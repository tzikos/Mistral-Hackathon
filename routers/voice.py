import base64
import json
import logging
import os
import tempfile

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File

from config import PROFILES_DIR, UPLOADS_DIR
from prompts import build_system_prompt
from routers.profiles import read_profile
from services.clients import get_mistral_client, get_elevenlabs_key
from services.completion import get_chat_reply
from services.stt import transcribe_audio
from services.tts import synthesize_speech

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/profile/{profile_id}/clone-voice")
async def clone_voice(profile_id: str, file: UploadFile = File(...)):
    """Upload a voice sample and create a cloned voice via ElevenLabs."""
    profile_path = PROFILES_DIR / f"{profile_id}.json"
    if not profile_path.exists():
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

        profile_data = json.loads(profile_path.read_text())
        profile_data["voice_id"] = voice_id
        profile_path.write_text(json.dumps(profile_data, indent=2))

        return {"voice_id": voice_id, "status": "cloned"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Voice cloning failed")
        raise HTTPException(status_code=500, detail=f"Voice cloning failed: {e}")


@router.get("/profile/{profile_id}/voice-status")
def voice_status(profile_id: str):
    """Check if a profile has a cloned voice."""
    profile_data = read_profile(profile_id)
    vid = profile_data.get("voice_id")
    return {"has_voice": bool(vid), "voice_id": vid}


@router.post("/profile/{profile_id}/chat")
async def voice_chat(profile_id: str, file: UploadFile = File(...)):
    """Full voice conversation: STT → Mistral completion → ElevenLabs TTS.

    Accepts an audio file, returns JSON with transcription, reply text,
    and base64-encoded audio of the reply.
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

        # 2. Mistral completion
        system_prompt = build_system_prompt(profile_data)
        reply_text = get_chat_reply(client, system_prompt, transcription_text)

        # 3. TTS — synthesize reply
        voice_id = profile_data.get("voice_id")
        audio_b64 = None

        if voice_id:
            audio_bytes_out = await synthesize_speech(voice_id, reply_text)
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
