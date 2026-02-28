// Text-to-Speech configuration settings for ElevenLabs integration

export interface TTSConfig {
  voiceId: string;
  modelId: string;
  outputFormat: string;
  maxTextLength: number;
  apiTimeout: number;
}

export const TTS_CONFIG: TTSConfig = {
  voiceId: 'yCpaZffTvy3eneNRGfsE', // Selected voice ID
  modelId: 'eleven_multilingual_v2', // ElevenLabs multilingual model for better quality
  outputFormat: 'mp3_44100_128', // MP3 format optimized for web playback
  maxTextLength: 2000, // Maximum characters for TTS conversion
  apiTimeout: 60000, // 60 seconds timeout for TTS API calls
};

// ElevenLabs API configuration
export const ELEVENLABS_CONFIG = {
  baseUrl: 'https://api.elevenlabs.io/v1',
  endpoints: {
    textToSpeech: '/text-to-speech',
    voices: '/voices',
  },
};

// Voice settings for optimal quality
export const VOICE_SETTINGS = {
  stability: 0.5, // Balance between consistency and expressiveness
  similarity_boost: 0.8, // Higher similarity to original voice
  style: 0.0, // Neutral style
  use_speaker_boost: true, // Enhance speaker characteristics
};

// Audio playback settings
export const AUDIO_CONFIG = {
  volume: 0.8, // Default volume level
  fadeInDuration: 100, // Fade in duration in milliseconds
  fadeOutDuration: 200, // Fade out duration in milliseconds
  preloadTimeout: 5000, // Timeout for audio preloading
};