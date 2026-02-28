#!/usr/bin/env python3
"""
Minimal POC to test Mistral's voice API.
Uses the official Mistral client library.
"""

import os
from mistralai import Mistral
from dotenv import load_dotenv
from mistralai.models.sdkerror import SDKError

# Load environment variables
load_dotenv()

# Configuration
API_KEY = os.environ.get("MISTRAL_API_KEY")
if not API_KEY:
    raise ValueError("Please set MISTRAL_API_KEY in your .env file")

# Initialize client
client = Mistral(api_key=API_KEY)


def _extract_model_id(model_obj):
    """Extract model id from SDK model objects across versions."""
    return getattr(model_obj, "id", None) or getattr(model_obj, "name", None)


def _build_transcription_model_candidates():
    """Build an ordered list of transcription models to try."""
    candidates = []

    env_model = os.environ.get("MISTRAL_TRANSCRIPTION_MODEL", "").strip()
    if env_model:
        candidates.append(env_model)

    candidates.extend([
        "voxtral-mini-transcribe-latest",
        "voxtral-mini-transcribe",
        "voxtral-mini-latest",
    ])

    try:
        models_response = client.models.list()
        model_items = getattr(models_response, "data", models_response)
        discovered = []
        for model_obj in model_items:
            model_id = _extract_model_id(model_obj)
            if not model_id:
                continue
            lowered = model_id.lower()
            if "voxtral" in lowered and "transcribe" in lowered:
                discovered.append(model_id)

        candidates.extend(discovered)
    except Exception as list_error:
        print(f"Could not list models for auto-discovery: {list_error}")

    unique_candidates = []
    seen = set()
    for model in candidates:
        if model and model not in seen:
            unique_candidates.append(model)
            seen.add(model)

    return unique_candidates

def transcribe_audio(audio_file_path):
    """Send audio to Mistral API for transcription"""
    try:
        print(f"Transcribing audio file: {audio_file_path}")
        print(f"File size: {os.path.getsize(audio_file_path)} bytes")
        
        # Read the file content as bytes
        with open(audio_file_path, "rb") as audio_file:
            audio_data = audio_file.read()
        
        # Create a file-like object that Mistral API expects
        from mistralai.models.file import File
        audio_file_obj = File(content=audio_data, fileName=os.path.basename(audio_file_path))

        candidate_models = _build_transcription_model_candidates()
        if not candidate_models:
            raise RuntimeError(
                "No transcription model candidates found. "
                "Set MISTRAL_TRANSCRIPTION_MODEL in your environment."
            )

        last_error = None
        transcription = None
        for model_name in candidate_models:
            try:
                print(f"Trying transcription model: {model_name}")
                transcription = client.audio.transcriptions.complete(
                    model=model_name,
                    file=audio_file_obj,
                )
                print(f"Transcription model succeeded: {model_name}")
                break
            except SDKError as model_error:
                last_error = model_error
                error_text = str(model_error)
                if "invalid model" in error_text.lower():
                    print(f"Model not available: {model_name}")
                    continue
                raise

        if transcription is None:
            raise RuntimeError(
                "All transcription model attempts failed. "
                f"Tried: {', '.join(candidate_models)}"
            ) from last_error
        
        print(f"Transcription result: {transcription}")
        # If SDK returns an object, convert to dict for compatibility
        if hasattr(transcription, "text"):
            return {"text": transcription.text}
        return transcription
    except Exception as e:
        print(f"Error in transcription: {e}")
        import traceback
        traceback.print_exc()
        return {"text": "", "error": str(e)}

def synthesize_speech(text, output_file):
    """Convert text to speech using Mistral API"""
    try:
        print(f"Attempting to synthesize speech: '{text}'")
        
        # Note: As of current Mistral client version, text-to-speech (TTS) is not available
        # The audio API only supports transcription (speech-to-text), not synthesis (text-to-speech)
        # This is a placeholder that would work if/when TTS is added to the API
        
        # For now, we'll create a simple text response instead of audio
        print("Text-to-speech not yet available in Mistral API")
        print(f"Response text would be: '{text}'")
        
        # Return None to indicate no audio was generated
        return None
        
    except Exception as e:
        print(f"Error in speech synthesis: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("Mistral Voice API Test")
    print("Place an audio file named 'input.wav' in this directory")
    print("Then press Enter to process it...")
    
    input()  # Wait for user to prepare the file
    
    try:
        # Transcribe the audio
        transcription = transcribe_audio("input.wav")
        print(f"Transcription: {transcription.get('text', '') if isinstance(transcription, dict) else getattr(transcription, 'text', '')}")

        text_val = transcription.get('text') if isinstance(transcription, dict) else getattr(transcription, 'text', None)
        if text_val:
            # Generate response
            response_text = f"You said: {text_val}"
            print(f"Response: {response_text}")

            # Synthesize speech
            output_file = synthesize_speech(response_text, "output.wav")
            if output_file:
                print(f"Response saved to {output_file}")
                print("You can play it with: afplay output.wav (Mac) or aplay output.wav (Linux)")
        else:
            print("No transcription received. Check your API key and audio file.")
            
    except Exception as e:
        print(f"Error: {e}")