# Mistral Hackathon - Voice API POC

This project provides a minimal proof-of-concept for testing Mistral's voice API capabilities, including speech-to-text and text-to-speech functionality.

## Features

- Record audio from microphone
- Transcribe speech to text using Mistral AI
- Generate text responses
- Convert text back to speech
- Simple web interface for testing

## Setup

1. **Install dependencies (using uv and pyproject.toml):**
   ```bash
   uv venv
   uv pip install -e .
   ```

2. **Set up environment variables:**
   Create a `.env` file with your API keys:
   ```
   MISTRAL_API_KEY=your_mistral_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   # Optional: force a specific transcription model
   MISTRAL_TRANSCRIPTION_MODEL=voxtral-mini-transcribe-latest
   ```

3. **Install additional requirements:**
    - For audio recording in the web interface, no additional system libraries are needed
    - For command-line audio playback, you may need:
       - Mac: `afplay` (included with macOS)
       - Linux: `aplay` (install with `sudo apt-get install alsa-utils`)
   - For ElevenLabs TTS, no extra Python packages are needed (uses `requests`, add to pyproject.toml if missing)

## Running the POC

### Option 1: Command Line Test
Run the voice API test directly:
```bash
python voice_api_test.py
```
- Place an audio file named `input.wav` in the project directory
- The script will transcribe it and generate a response
- The response will be saved as `output.wav`
- Play it with: `afplay output.wav` (Mac) or `aplay output.wav` (Linux)

### Option 2: Web Interface
1. Start the API server:
   ```bash
   uv venv
   uv pip install -e .
   python api_server.py
   ```

2. Open `frontend.html` in your web browser

3. Click "Start Recording", speak, then "Stop Recording"

4. The system will:
   - Transcribe your speech
   - Display the transcription
   - Generate a response
   - Convert response to speech (using ElevenLabs TTS)
   - Allow you to play the response

## Files

- `voice_api_test.py` - Core voice API functions
- `api_server.py` - Flask server for web interface
- `elevenlabs_tts.py` - ElevenLabs TTS integration
- `frontend.html` - Simple web interface
- `pyproject.toml` - Python dependencies

## Troubleshooting

- **Microphone permission denied**: Check browser microphone permissions
- **No transcription**: Ensure your Mistral API key is valid and has voice API access
- **No speech response**: Ensure your ElevenLabs API key is valid and you have quota
- **Audio playback issues**: Try different audio formats or players

## Notes

- This is a minimal POC - error handling is basic
- The voice API endpoints and models may change as Mistral updates their API
- For production use, add proper authentication, error handling, and logging