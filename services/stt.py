import os
import logging

logger = logging.getLogger(__name__)


def transcribe_audio(client, audio_bytes: bytes, filename: str) -> str:
    """Transcribe audio using Mistral STT. Returns transcribed text or empty string."""
    from mistralai.models.file import File as MistralFile

    audio_file_obj = MistralFile(content=audio_bytes, file_name=filename)

    models = ["voxtral-mini-latest"]
    env_model = os.environ.get("MISTRAL_TRANSCRIPTION_MODEL", "").strip()
    if env_model:
        models.insert(0, env_model)

    for model_name in models:
        try:
            result = client.audio.transcriptions.complete(model=model_name, file=audio_file_obj)
            return result.text if hasattr(result, "text") else str(result)
        except Exception as e:
            logger.warning("STT model %s failed: %s", model_name, e)

    return ""
