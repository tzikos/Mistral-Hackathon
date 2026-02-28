import os
import requests

def elevenlabs_tts(text, output_path, voice_id=None, model_id=None):
    """
    Synthesize speech using ElevenLabs API and save to output_path.
    Args:
        text (str): Text to synthesize.
        output_path (str): Path to save the resulting audio file.
        voice_id (str, optional): ElevenLabs voice ID. Defaults to 'EXAVITQu4vr4xnSDxMaL'.
        model_id (str, optional): ElevenLabs model ID. Defaults to None (uses default model).
    Returns:
        str: Path to saved audio file, or None if failed.
    """
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not set in environment")

    url = "https://api.elevenlabs.io/v1/text-to-speech"
    if voice_id:
        url += f"/{voice_id}"
    else:
        url += "/EXAVITQu4vr4xnSDxMaL"  # Default voice

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }
    if model_id:
        payload["model_id"] = model_id

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(response.content)
        return output_path
    else:
        print(f"ElevenLabs TTS error: {response.status_code} {response.text}")
        return None
