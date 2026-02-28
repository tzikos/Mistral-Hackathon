import logging
import os

import httpx

from services.clients import get_elevenlabs_key

logger = logging.getLogger(__name__)


async def synthesize_speech(text: str, voice_id: str | None = None) -> bytes | None:
    """Convert text to speech via ElevenLabs.

    Uses voice_id if provided; falls back to DEFAULT_VOICE_ID env var.
    Returns raw MP3 bytes or None on failure.
    """
    api_key = get_elevenlabs_key()
    default_voice_id = os.environ.get("DEFAULT_VOICE_ID")

    async def _call(vid: str) -> bytes | None:
        async with httpx.AsyncClient(timeout=60) as http:
            resp = await http.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{vid}",
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
        return None

    try:
        if voice_id:
            result = await _call(voice_id)
            if result:
                return result
            # Cloned voice failed — fall back to default
            logger.warning("Cloned voice %s failed, falling back to DEFAULT_VOICE_ID", voice_id)

        if default_voice_id:
            return await _call(default_voice_id)

        logger.warning("No voice_id and DEFAULT_VOICE_ID not set — skipping TTS")
    except Exception as e:
        logger.warning("TTS failed: %s", e)
    return None
