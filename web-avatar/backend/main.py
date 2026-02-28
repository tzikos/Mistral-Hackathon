import os
import uuid
import httpx
from pathlib import Path
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from mistralai import Mistral
from mistralai.models.file import File as MistralFile

load_dotenv()

MISTRAL_API_KEY = os.environ["MISTRAL_API_KEY"]
MISTRAL_STT_MODEL = os.environ.get("MISTRAL_STT_MODEL", "voxtral-mini-transcribe-latest")
MISTRAL_CHAT_MODEL = os.environ.get("MISTRAL_CHAT_MODEL", "mistral-large-latest")
ELEVENLABS_API_KEY = os.environ["ELEVENLABS_API_KEY"]
ELEVENLABS_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")

AUDIO_DIR = Path(__file__).parent / "audio_files"
AUDIO_DIR.mkdir(exist_ok=True)

mistral_client = Mistral(api_key=MISTRAL_API_KEY)

SYSTEM_PROMPT = (
    "You are a friendly, helpful website assistant avatar. "
    "Keep your replies to 1-2 short sentences. Be conversational and warm."
)

app = FastAPI(title="Web Avatar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")


# ---------------------------------------------------------------------------
# STT via Mistral
# ---------------------------------------------------------------------------
async def run_stt(audio_bytes: bytes, filename: str) -> str:
    audio_file_obj = MistralFile(content=audio_bytes, fileName=filename)
    transcription = mistral_client.audio.transcriptions.complete(
        model=MISTRAL_STT_MODEL,
        file=audio_file_obj,
    )
    if hasattr(transcription, "text"):
        return transcription.text
    return ""


# ---------------------------------------------------------------------------
# Chat via Mistral
# ---------------------------------------------------------------------------
async def run_chat(user_text: str) -> str:
    response = mistral_client.chat.complete(
        model=MISTRAL_CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_text},
        ],
    )
    return response.choices[0].message.content


# ---------------------------------------------------------------------------
# TTS via ElevenLabs
# ---------------------------------------------------------------------------
async def run_tts(text: str) -> str:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()

    file_id = uuid.uuid4().hex[:12]
    file_path = AUDIO_DIR / f"{file_id}.mp3"
    file_path.write_bytes(resp.content)
    return f"/audio/{file_id}.mp3"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/stt")
async def stt_endpoint(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    transcript = await run_stt(audio_bytes, audio.filename or "audio.webm")
    return {"transcript": transcript}


@app.post("/api/chat")
async def chat_endpoint(body: dict):
    text = body.get("text", "")
    if not text:
        return JSONResponse({"error": "No text provided"}, status_code=400)
    reply = await run_chat(text)
    return {"replyText": reply}


@app.post("/api/talk")
async def talk_endpoint(audio: UploadFile = File(...)):
    """Full pipeline: STT -> Chat -> TTS, returns transcript + reply + audio URL."""
    audio_bytes = await audio.read()

    transcript = await run_stt(audio_bytes, audio.filename or "audio.webm")
    if not transcript:
        return JSONResponse(
            {"error": "Could not transcribe audio"}, status_code=400
        )

    reply_text = await run_chat(transcript)
    audio_url = await run_tts(reply_text)

    return {
        "transcript": transcript,
        "replyText": reply_text,
        "audioUrl": audio_url,
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}
