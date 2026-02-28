#!/usr/bin/env python3
"""
Minimal API server to bridge frontend and Mistral voice API
"""

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from voice_api_test import transcribe_audio
from elevenlabs_tts import elevenlabs_tts
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
        if isinstance(transcription_result, dict):
            transcription = transcription_result.get('text', '')
            error_msg = transcription_result.get('error')
        else:
            transcription = getattr(transcription_result, 'text', '')
            error_msg = None
        
        # Generate response
        response_text = f"You said: {transcription}" if transcription else "I didn't catch that"
        
        # Synthesize speech using ElevenLabs
        output_file = os.path.join(app.config['UPLOAD_FOLDER'], 'response.mp3')
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        print(f"Attempting to synthesize speech (ElevenLabs): '{response_text}'")
        synthesis_result = elevenlabs_tts(response_text, output_file)
        print(f"Synthesis result: {synthesis_result}")
        
        # Check if synthesis was successful
        if synthesis_result is None or not os.path.exists(output_file):
            print("Text-to-speech failed, returning text response only")
            return jsonify({
                'transcription': transcription,
                'response': response_text,
                'audio': None,
                'error': error_msg
            })

        # Read the audio file to send back
        with open(output_file, 'rb') as f:
            audio_data = f.read()

        # Clean up
        cleanup_files = [filepath, output_file]
        for f in cleanup_files:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except Exception as cleanup_error:
                    print(f"Warning: Could not clean up file {f}: {cleanup_error}")

        return jsonify({
            'transcription': transcription,
            'response': response_text,
            'audio': {
                'data': list(audio_data),
                'format': 'mp3'
            },
            'error': error_msg
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