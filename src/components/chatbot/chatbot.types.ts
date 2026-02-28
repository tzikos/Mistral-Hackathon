// TypeScript interfaces and types for the CV Chatbot

// Message interface for chat messages
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

// Chatbot configuration interface
export interface ChatbotConfig {
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  model: string;
  maxMessages: number;
  apiTimeout: number;
}

// OpenAI API request interface
export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
}

// OpenAI API response interface
export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Error handling types
export type ErrorType = 'network' | 'auth' | 'rate_limit' | 'content' | 'server' | 'timeout';

export interface ErrorState {
  type: ErrorType;
  message: string;
  retryable: boolean;
}

// Chatbot state interface
export interface ChatbotState {
  messages: Message[];
  isLoading: boolean;
  error: ErrorState | null;
}

// Component prop interfaces
export interface ChatbotContainerProps {
  className?: string;
  maxHeight?: string;
}

export interface ChatMessageProps {
  message: Message;
  isUser: boolean;
  playbackState?: PlaybackState;
  onPlayTTS?: (messageId: string, text: string) => void;
  onStopTTS?: (messageId: string) => void;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export interface TypingIndicatorProps {
  visible: boolean;
}

export interface PlayButtonProps {
  messageId: string;
  text: string;
  playbackState?: PlaybackState;
  onPlay: (messageId: string, text: string) => void;
  onStop: (messageId: string) => void;
  disabled?: boolean;
  className?: string;
}

// API service types
export interface ApiServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorState;
}

// Session storage types
export interface ChatSession {
  messages: Message[];
  timestamp: Date;
}

// Storage information interface
export interface StorageInfo {
  used: number;
  available: number;
  percentage: number;
}

// Rate limiting types
export interface RateLimitState {
  canSendMessage: boolean;
  remainingCooldown: number;
  messagesInLastMinute: number;
  reason?: string;
}

// Text-to-Speech related types
export interface TTSRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
  outputFormat?: string;
  voiceSettings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface TTSResponse {
  success: boolean;
  audioData?: ArrayBuffer;
  error?: string;
  audioUrl?: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  messageId: string;
  audioUrl?: string;
}

export interface TTSConfig {
  voiceId: string;
  modelId: string;
  outputFormat: string;
  maxTextLength: number;
  apiTimeout: number;
}

// Audio management types
export interface AudioManager {
  currentAudio: HTMLAudioElement | null;
  currentMessageId: string | null;
  playAudio: (audioData: ArrayBuffer, messageId: string) => Promise<void>;
  stopCurrent: () => void;
  isPlaying: (messageId: string) => boolean;
}

// TTS service types
export interface TTSServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: TTSErrorState;
  audioData?: ArrayBuffer;
  audioUrl?: string;
}

// Extended error types for TTS
export type TTSErrorType = ErrorType | 'tts_api' | 'audio_playback' | 'text_too_long' | 'voice_not_found';

export interface TTSErrorState extends ErrorState {
  type: TTSErrorType;
}

// Extended message interface with TTS support
export interface MessageWithTTS extends Message {
  ttsState?: PlaybackState;
  canPlayTTS?: boolean;
}

// Utility types
export type MessageRole = Message['role'];
export type ChatbotStatus = 'idle' | 'loading' | 'error' | 'success';
export type TTSStatus = 'idle' | 'loading' | 'playing' | 'error' | 'stopped';