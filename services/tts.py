import logging
import os
import re

import httpx

from services.clients import get_elevenlabs_key

logger = logging.getLogger(__name__)


def _strip_markdown(text: str) -> str:
    """Remove markdown syntax so ElevenLabs receives clean plain text."""
    # Fenced code blocks → keep content, drop the backtick fences
    text = re.sub(r"```[\w]*\n?(.*?)```", r"\1", text, flags=re.DOTALL)
    # Inline code
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # Headings (# ## ###)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
    # Bold / italic (**text**, *text*, __text__, _text_)
    text = re.sub(r"\*{1,3}([^*]+)\*{1,3}", r"\1", text)
    text = re.sub(r"_{1,3}([^_]+)_{1,3}", r"\1", text)
    # Strikethrough
    text = re.sub(r"~~([^~]+)~~", r"\1", text)
    # Links [label](url) → label
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    # Images ![alt](url) → alt
    text = re.sub(r"!\[([^\]]*)\]\([^\)]+\)", r"\1", text)
    # Blockquotes
    text = re.sub(r"^>\s+", "", text, flags=re.MULTILINE)
    # Unordered list bullets (-, *, +)
    text = re.sub(r"^[\-\*\+]\s+", "", text, flags=re.MULTILINE)
    # Ordered list numbers
    text = re.sub(r"^\d+\.\s+", "", text, flags=re.MULTILINE)
    # Horizontal rules
    text = re.sub(r"^[-\*_]{3,}\s*$", "", text, flags=re.MULTILINE)
    # Collapse excess blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


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

    text = _strip_markdown(text)

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
