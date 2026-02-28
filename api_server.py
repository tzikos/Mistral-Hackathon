#!/usr/bin/env python3
"""
Minimal API server to bridge frontend and Mistral voice API
"""

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import base64
from voice_api_test import transcribe_audio
from kokoro_tts import kokoro_tts
from mistral_completion import get_mistral_reply
from flask_cors import CORS

app = Flask(__name__)
# Configure CORS to allow all origins for development
CORS(app, resources={r"/*": {"origins": "*"}}, methods=["GET", "POST"], allow_headers=["*"])

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint to verify CORS is working"""
    return jsonify({
        'status': 'success',
        'message': 'CORS is working correctly',
        'methods_allowed': ['GET', 'POST', 'OPTIONS']
    })

@app.route('/api/voice', methods=['POST', 'OPTIONS'])
def handle_voice():
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    print("Request headers:", dict(request.headers))  # Debug log
    print("Request files:", request.files)  # Debug log
    
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    print(f"Received file: {audio_file.filename}")  # Debug log
    print(f"File content type: {audio_file.content_type}")  # Debug log
    print(f"File size: {len(audio_file.read())} bytes")  # Debug log
    audio_file.seek(0)  # Reset file pointer after reading for size
    
    # Save the audio file
    filename = secure_filename(audio_file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    audio_file.save(filepath)
    
    try:
        # Transcribe the audio
        transcription_result = transcribe_audio(filepath)
        transcription_error = None
        if isinstance(transcription_result, dict):
            transcription = transcription_result.get('text', '')
            transcription_error = transcription_result.get('error')
        else:
            transcription = getattr(transcription_result, 'text', '')
            transcription_error = None
        
        # Get Mistral model reply
        completion_error = None
        if transcription:
            try:
                system_prompt = None
                reply_text = get_mistral_reply(transcription, system_prompt=system_prompt)
            except Exception as e:
                reply_text = "Sorry, there was an error generating a reply."
                completion_error = str(e)
        else:
            reply_text = "I didn't catch that. Please try again."

        # Synthesize reply with Kokoro (Hugging Face)
        tts_error = None
        output_file = os.path.join(app.config['UPLOAD_FOLDER'], 'response.wav')
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        print(f"Attempting to synthesize speech (Kokoro): '{reply_text}'")
        try:
            synthesis_result = kokoro_tts(reply_text, output_file)
            print(f"Synthesis result: {synthesis_result}")
        except Exception as e:
            synthesis_result = None
            tts_error = str(e)
        
        # Check if synthesis was successful
        if synthesis_result is None or not os.path.exists(output_file):
            print("Text-to-speech failed, returning text response only")
            return jsonify({
                'transcription': transcription,
                'transcription_error': transcription_error,
                'reply': reply_text,
                'completion_error': completion_error,
                'audio': None,
                'tts_error': tts_error
            })

        # Read the audio file to send back
        with open(output_file, 'rb') as f:
            audio_data = f.read()
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')

        # Clean up only input audio, keep output for inspection/playback
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as cleanup_error:
                print(f"Warning: Could not clean up file {filepath}: {cleanup_error}")

        return jsonify({
            'transcription': transcription,
            'transcription_error': transcription_error,
            'reply': reply_text,
            'completion_error': completion_error,
            'audio': {
                'base64': audio_base64,
                'format': 'wav'
            },
            'tts_error': tts_error
        })
        
    except Exception as e:
        # Clean up in case of error
        cleanup_files = [filepath]
        if 'output_file' in locals() and output_file:
            cleanup_files.append(output_file)
        
        for f in cleanup_files:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except Exception as cleanup_error:
                    print(f"Warning: Could not clean up file {f}: {cleanup_error}")
        
        print(f"Server error: {e}")
        return jsonify({'error': f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
