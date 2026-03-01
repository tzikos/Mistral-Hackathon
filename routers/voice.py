import base64
import logging
import os
import tempfile

import httpx
from fastapi import APIRouter, Form, HTTPException, UploadFile, File
from pydantic import BaseModel

from db import db_get_profile, db_upsert_profile, db_profile_exists
from prompts import build_system_prompt
from routers.profiles import read_profile
from services.clients import get_mistral_client, get_elevenlabs_key
from services.completion import get_chat_reply
from services.stt import transcribe_audio
from services.tts import synthesize_speech

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory session store: session_id → list of {role, content} message dicts
_sessions: dict[str, list[dict]] = {}


@router.post("/profile/{profile_id}/clone-voice")
async def clone_voice(profile_id: str, file: UploadFile = File(...)):
    """Upload a voice sample and create a cloned voice via ElevenLabs."""
    if not db_profile_exists(profile_id):
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")

    contents = await file.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 25 MB)")

    api_key = get_elevenlabs_key()

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.elevenlabs.io/v1/voices/add",
                headers={"xi-api-key": api_key},
                data={
                    "name": f"clone-{profile_id}",
                    "description": f"Cloned voice for {profile_id}",
                },
                files={
                    "files": (
                        file.filename or "voice.wav",
                        contents,
                        file.content_type or "audio/wav",
                    ),
                },
            )

        if resp.status_code != 200:
            logger.error("ElevenLabs clone error %s: %s", resp.status_code, resp.text)
            raise HTTPException(status_code=502, detail=f"Voice cloning failed: {resp.text}")

        voice_id = resp.json().get("voice_id")
        if not voice_id:
            raise HTTPException(status_code=502, detail="No voice_id returned")

        profile_data = db_get_profile(profile_id)
        profile_data["voice_id"] = voice_id
        db_upsert_profile(profile_id, profile_data)

        return {"voice_id": voice_id, "status": "cloned"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Voice cloning failed")
        raise HTTPException(status_code=500, detail=f"Voice cloning failed: {e}")


@router.delete("/profile/{profile_id}/voice")
async def delete_voice(profile_id: str):
    """Delete the cloned voice from ElevenLabs and clear voice_id from the profile."""
    profile_data = db_get_profile(profile_id)
    voice_id = profile_data.get("voice_id")

    if not voice_id:
        raise HTTPException(status_code=404, detail="No cloned voice found for this profile")

    api_key = get_elevenlabs_key()

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.delete(
                f"https://api.elevenlabs.io/v1/voices/{voice_id}",
                headers={"xi-api-key": api_key},
            )
        if resp.status_code not in (200, 204, 404):
            logger.warning("ElevenLabs voice delete returned %s: %s", resp.status_code, resp.text)
    except Exception:
        logger.warning("Failed to delete voice %s from ElevenLabs", voice_id)

    # Always clear from Supabase even if ElevenLabs failed
    profile_data.pop("voice_id", None)
    db_upsert_profile(profile_id, profile_data)

    return {"status": "deleted"}


@router.get("/profile/{profile_id}/voice-status")
def voice_status(profile_id: str):
    """Check if a profile has a cloned voice."""
    profile_data = read_profile(profile_id)
    vid = profile_data.get("voice_id")
    return {"has_voice": bool(vid), "voice_id": vid}


@router.post("/profile/{profile_id}/chat")
async def voice_chat(
    profile_id: str,
    file: UploadFile = File(...),
    session_id: str = Form(...),
):
    """Full voice conversation: STT → Mistral completion → ElevenLabs TTS.

    Accepts an audio file and a session_id, returns JSON with transcription,
    reply text, and base64-encoded audio of the reply. Conversation history
    is accumulated server-side under the given session_id.
    """
    profile_data = read_profile(profile_id)

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    suffix = ".wav"
    if file.filename:
        suffix = os.path.splitext(file.filename)[1] or ".wav"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(audio_bytes)
    tmp.close()

    try:
        client = get_mistral_client()

        # 1. STT — transcribe audio
        transcription_text = transcribe_audio(client, audio_bytes, file.filename or "recording.wav")

        if not transcription_text.strip():
            return {
                "transcription": "",
                "reply": "I couldn't hear that clearly. Could you try again?",
                "audio": None,
            }

        # 2. Mistral completion — with full conversation history
        history = _sessions.get(session_id, [])
        history.append({"role": "user", "content": transcription_text})

        system_prompt = build_system_prompt(profile_data)
        reply_text = get_chat_reply(client, system_prompt, history)

        history.append({"role": "assistant", "content": reply_text})
        _sessions[session_id] = history

        # 3. TTS — synthesize reply (falls back to DEFAULT_VOICE_ID if no clone)
        voice_id = profile_data.get("voice_id") or None
        audio_b64 = None

        audio_bytes_out = await synthesize_speech(reply_text, voice_id)
        if audio_bytes_out:
            audio_b64 = base64.b64encode(audio_bytes_out).decode("utf-8")

        return {
            "transcription": transcription_text,
            "reply": reply_text,
            "audio": {"base64": audio_b64, "format": "mp3"} if audio_b64 else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Voice chat failed")
        raise HTTPException(status_code=500, detail=f"Voice chat failed: {e}")
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


class TextChatRequest(BaseModel):
    text: str
    session_id: str


@router.post("/profile/{profile_id}/chat/text")
async def text_chat(profile_id: str, body: TextChatRequest):
    """Text conversation: Mistral completion → ElevenLabs TTS.

    Accepts plain text and a session_id, returns JSON with reply text and
    base64-encoded audio. Shares the same session history as voice chat.
    """
    profile_data = read_profile(profile_id)

    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Empty message")

    try:
        client = get_mistral_client()

        history = _sessions.get(body.session_id, [])
        history.append({"role": "user", "content": body.text})

        system_prompt = build_system_prompt(profile_data)
        reply_text = get_chat_reply(client, system_prompt, history)

        history.append({"role": "assistant", "content": reply_text})
        _sessions[body.session_id] = history

        voice_id = profile_data.get("voice_id") or None
        audio_b64 = None
        audio_bytes_out = await synthesize_speech(reply_text, voice_id)
        if audio_bytes_out:
            audio_b64 = base64.b64encode(audio_bytes_out).decode("utf-8")

        return {
            "transcription": body.text,
            "reply": reply_text,
            "audio": {"base64": audio_b64, "format": "mp3"} if audio_b64 else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Text chat failed")
        raise HTTPException(status_code=500, detail=f"Text chat failed: {e}")


@router.delete("/profile/{profile_id}/chat/{session_id}")
def clear_session(profile_id: str, session_id: str):
    """Clear the conversation history for a session."""
    _sessions.pop(session_id, None)
    return {"status": "cleared"}
