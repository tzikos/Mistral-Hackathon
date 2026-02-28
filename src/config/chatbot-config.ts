// Chatbot configuration settings
export interface ChatbotConfig {
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  model: string;
  maxMessages: number;
  apiTimeout: number;
}

export const CHATBOT_CONFIG: ChatbotConfig = {
  systemPrompt: '', // Will be populated from chatbot-prompt.ts
  maxTokens: parseInt(import.meta.env.VITE_CHATBOT_MAX_TOKENS || '500'),
  temperature: 0.3, // Low temperature for factual responses
  model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
  maxMessages: 20, // Limit conversation history
  apiTimeout: 30000, // 30 seconds timeout
};

// Environment variable validation
export const validateEnvironment = (): boolean => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('VITE_OPENAI_API_KEY environment variable is required');
    return false;
  }
  return true;
};

// API endpoints and headers
export const API_CONFIG = {
  openaiUrl: 'https://api.openai.com/v1/chat/completions',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
  },
};