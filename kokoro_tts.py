import audioop
import os
import re
import shutil
import wave
from gradio_client import Client


def _split_text(text, max_chars):
    text = re.sub(r"\s+", " ", text.strip())
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        if end < len(text):
            last_space = text.rfind(" ", start, end)
            if last_space > start + 40:
                end = last_space
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end
    return chunks


def kokoro_tts(text, output_path, space_id=None, voice=None, speed=None, api_name=None):
    """
    Synthesize speech using a Hugging Face Space (Gradio) and save to output_path.
    Args:
        text (str): Text to synthesize.
        output_path (str): Path to save the resulting audio file.
        space_id (str, optional): Hugging Face Space ID (e.g., "user/space").
        voice (str, optional): Kokoro voice name.
        speed (float, optional): Speech speed.
        api_name (str, optional): Gradio API endpoint name.
    Returns:
        str: Path to saved audio file, or None if failed.
    """
    space_id = space_id or os.environ.get("KOKORO_SPACE", "tzikos98/kokoro-tts-test")
    voice = voice or os.environ.get("KOKORO_VOICE", "af_heart")
    api_name = api_name or os.environ.get("KOKORO_API_NAME", "/predict")
    if speed is None:
        try:
            speed = float(os.environ.get("KOKORO_SPEED", "1"))
        except ValueError:
            speed = 1.0

    try:
        max_chars = int(os.environ.get("KOKORO_MAX_CHARS", "250"))
    except ValueError:
        max_chars = 250

    hf_token = os.environ.get("HF_TOKEN")
    try:
        client = Client(space_id, hf_token=hf_token) if hf_token else Client(space_id)
    except TypeError:
        # Fallback for older client versions
        client = Client(space_id)

    try:
        chunks = _split_text(text, max_chars)
        if not chunks:
            return None
        if len(chunks) == 1:
            result = client.predict(chunks[0], voice, speed, api_name=api_name)
            audio_path = result[0] if isinstance(result, (list, tuple)) else result
            if not audio_path:
                return None
            shutil.copy(audio_path, output_path)
            return output_path

        audio_params = None
        audio_frames = []
        for chunk in chunks:
            result = client.predict(chunk, voice, speed, api_name=api_name)
            audio_path = result[0] if isinstance(result, (list, tuple)) else result
            if not audio_path:
                continue
            with wave.open(audio_path, "rb") as wf:
                params = wf.getparams()
                frames = wf.readframes(wf.getnframes())
                if audio_params is None:
                    audio_params = params
                    audio_frames.append(frames)
                    continue

                # Normalize sample rate if needed, keep channels/sampwidth consistent
                if params.nchannels != audio_params.nchannels or params.sampwidth != audio_params.sampwidth:
                    raise ValueError("Inconsistent audio parameters across chunks")

                if params.framerate != audio_params.framerate:
                    frames, _ = audioop.ratecv(
                        frames,
                        params.sampwidth,
                        params.nchannels,
                        params.framerate,
                        audio_params.framerate,
                        None,
                    )
                audio_frames.append(frames)

        if not audio_params or not audio_frames:
            return None

        with wave.open(output_path, "wb") as out:
            out.setparams(audio_params)
            out.writeframes(b"".join(audio_frames))
        return output_path
    except Exception as exc:
        print(f"Kokoro TTS error: {exc}")
        return None
