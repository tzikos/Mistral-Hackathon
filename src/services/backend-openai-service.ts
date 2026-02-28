// Backend OpenAI service that calls your secure API endpoint
import {
  Message,
  ErrorState,
  ApiServiceResponse
} from '../components/chatbot/chatbot.types';
import { CHATBOT_CONFIG } from '../config/chatbot-config';
import { conversationContextService } from './conversation-context-service';

// Note: System prompt is now handled server-side in the AWS Lambda function
// Frontend only sends user/assistant messages for security

/**
 * Backend OpenAI service that calls your secure API endpoint instead of OpenAI directly
 */
export class BackendOpenAIService {
  private static instance: BackendOpenAIService;
  private readonly apiUrl: string;

  private constructor() {
    // Use your backend API endpoint
    // For local development: 'http://localhost:3000/api/chat'
    // For production: 'https://yourdomain.com/api/chat'
    this.apiUrl = import.meta.env.VITE_BACKEND_API_URL || '/api/chat';

    // Debug: Log the URL being used
    console.log('Backend API URL:', this.apiUrl);
    console.log('Environment variable:', import.meta.env.VITE_BACKEND_API_URL);
  }

  /**
   * Get singleton instance of Backend OpenAI service
   */
  public static getInstance(): BackendOpenAIService {
    if (!BackendOpenAIService.instance) {
      BackendOpenAIService.instance = new BackendOpenAIService();
    }
    return BackendOpenAIService.instance;
  }

  /**
   * Send a chat completion request to your backend API
   * @param messages - Array of conversation messages
   * @returns Promise with API response or error
   */
  public async sendChatCompletion(messages: Message[]): Promise<ApiServiceResponse<string>> {
    try {
      // Format messages for API
      const formattedMessages = this.formatMessagesForAPI(messages);

      // Create API request payload
      const requestPayload = {
        messages: formattedMessages,
        model: CHATBOT_CONFIG.model,
        maxTokens: CHATBOT_CONFIG.maxTokens,
        temperature: CHATBOT_CONFIG.temperature,
      };

      // Make API call to your backend with timeout
      const response = await this.makeAPICall(requestPayload);

      if (!response.ok) {
        return this.handleAPIError(response);
      }

      const data = await response.json();

      // Check if the response indicates success
      if (!data.success || !data.data) {
        return {
          success: false,
          error: {
            type: 'server',
            message: data.error || 'No response content received from AI service',
            retryable: true
          }
        };
      }

      return {
        success: true,
        data: data.data
      };

    } catch (error) {
      return this.handleRequestError(error);
    }
  }

  /**
   * Format conversation messages for API with context optimization
   * Note: System prompt is handled server-side, so we only send user/assistant messages
   * @param messages - Array of conversation messages
   * @returns Formatted messages array (user/assistant only)
   */
  private formatMessagesForAPI(messages: Message[]): Array<{ role: string; content: string }> {
    // Optimize conversation context for API call
    const optimizedMessages = conversationContextService.prepareForAPI(messages, {
      maxMessages: CHATBOT_CONFIG.maxMessages,
      maxTokens: CHATBOT_CONFIG.maxTokens * 3,
      prioritizeRecent: true
    });

    // Return only user/assistant messages (system prompt is added server-side)
    return optimizedMessages.map(message => ({
      role: message.role,
      content: message.content
    }));
  }

  /**
   * Make the actual API call to your backend with timeout handling
   * @param payload - API request payload
   * @returns Fetch response
   */
  private async makeAPICall(payload: any): Promise<Response> {
    // Debug logging
    console.log('Making API call to:', this.apiUrl);
    console.log('Payload:', payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHATBOT_CONFIG.apiTimeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      console.log('Response status:', response.status);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Handle API response errors
   * @param response - Failed fetch response
   * @returns Error response
   */
  private async handleAPIError(response: Response): Promise<ApiServiceResponse<string>> {
    let errorMessage = 'An error occurred while communicating with the AI service';
    let errorType: ErrorState['type'] = 'server';
    let retryable = true;

    try {
      const errorData = await response.json();

      switch (response.status) {
        case 400:
          errorType = 'content';
          errorMessage = errorData.error || 'Invalid request content.';
          retryable = false;
          break;
        case 429:
          errorType = 'rate_limit';
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          retryable = true;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = 'server';
          errorMessage = 'AI service is temporarily unavailable. Please try again.';
          retryable = true;
          break;
        default:
          errorMessage = errorData.error || errorMessage;
      }
    } catch {
      // If we can't parse the error response, use default message
    }

    return {
      success: false,
      error: {
        type: errorType,
        message: errorMessage,
        retryable
      }
    };
  }

  /**
   * Handle request errors (network, timeout, etc.)
   * @param error - Caught error
   * @returns Error response
   */
  private handleRequestError(error: unknown): ApiServiceResponse<string> {
    let errorMessage = 'Failed to connect to AI service';
    let errorType: ErrorState['type'] = 'network';
    let retryable = true;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorType = 'timeout';
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('fetch')) {
        errorType = 'network';
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: {
        type: errorType,
        message: errorMessage,
        retryable
      }
    };
  }
}

// Export singleton instance
export const backendOpenAIService = BackendOpenAIService.getInstance();