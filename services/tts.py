import logging

import httpx

from services.clients import get_elevenlabs_key

logger = logging.getLogger(__name__)


async def synthesize_speech(voice_id: str, text: str) -> bytes | None:
    """Convert text to speech via ElevenLabs. Returns raw MP3 bytes or None on failure."""
    api_key = get_elevenlabs_key()
    try:
        async with httpx.AsyncClient(timeout=60) as http:
            resp = await http.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.8,
                    },
                },
            )
        if resp.status_code == 200:
            return resp.content
        logger.warning("ElevenLabs TTS error %s: %s", resp.status_code, resp.text)
    except Exception as e:
        logger.warning("TTS failed: %s", e)
    return None
