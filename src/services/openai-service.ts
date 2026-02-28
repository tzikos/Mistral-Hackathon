// OpenAI API service for chatbot integration
import { 
  OpenAIRequest, 
  OpenAIResponse, 
  Message, 
  ErrorState, 
  ApiServiceResponse 
} from '../components/chatbot/chatbot.types';
import { CHATBOT_CONFIG, API_CONFIG, validateEnvironment } from '../config/chatbot-config';
import { CHATBOT_SYSTEM_PROMPT } from '../config/chatbot-prompt';
import { conversationContextService } from './conversation-context-service';

// Update the config with the system prompt
CHATBOT_CONFIG.systemPrompt = CHATBOT_SYSTEM_PROMPT;

/**
 * OpenAI API service class for handling chat completions
 */
export class OpenAIService {
  private static instance: OpenAIService;
  private readonly apiUrl: string;
  private readonly headers: Record<string, string>;

  private constructor() {
    // Validate environment variables on initialization
    if (!validateEnvironment()) {
      throw new Error('OpenAI API configuration is invalid');
    }

    this.apiUrl = API_CONFIG.openaiUrl;
    this.headers = API_CONFIG.headers;
  }

  /**
   * Get singleton instance of OpenAI service
   */
  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Send a chat completion request to OpenAI API
   * @param messages - Array of conversation messages
   * @returns Promise with API response or error
   */
  public async sendChatCompletion(messages: Message[]): Promise<ApiServiceResponse<string>> {
    try {
      // Format messages for OpenAI API
      const formattedMessages = this.formatMessagesForAPI(messages);
      
      // Create API request payload
      const requestPayload: OpenAIRequest = {
        model: CHATBOT_CONFIG.model,
        messages: formattedMessages,
        max_tokens: CHATBOT_CONFIG.maxTokens,
        temperature: CHATBOT_CONFIG.temperature,
      };

      // Make API call with timeout
      const response = await this.makeAPICall(requestPayload);
      
      if (!response.ok) {
        return this.handleAPIError(response);
      }

      const data: OpenAIResponse = await response.json();
      
      // Extract message content from response
      const messageContent = data.choices[0]?.message?.content;
      
      if (!messageContent) {
        return {
          success: false,
          error: {
            type: 'server',
            message: 'No response content received from OpenAI',
            retryable: true
          }
        };
      }

      return {
        success: true,
        data: messageContent.trim()
      };

    } catch (error) {
      return this.handleRequestError(error);
    }
  }

  /**
   * Format conversation messages for OpenAI API with context optimization
   * @param messages - Array of conversation messages
   * @returns Formatted messages array with system prompt
   */
  private formatMessagesForAPI(messages: Message[]): OpenAIRequest['messages'] {
    // Start with system prompt
    const formattedMessages: OpenAIRequest['messages'] = [
      {
        role: 'system',
        content: CHATBOT_CONFIG.systemPrompt
      }
    ];

    // Optimize conversation context for API call
    const optimizedMessages = conversationContextService.prepareForAPI(messages, {
      maxMessages: CHATBOT_CONFIG.maxMessages,
      maxTokens: CHATBOT_CONFIG.maxTokens * 3, // Allow more context tokens
      prioritizeRecent: true
    });

    // Add optimized conversation messages
    optimizedMessages.forEach(message => {
      formattedMessages.push({
        role: message.role,
        content: message.content
      });
    });

    return formattedMessages;
  }

  /**
   * Make the actual API call with timeout handling
   * @param payload - OpenAI API request payload
   * @returns Fetch response
   */
  private async makeAPICall(payload: OpenAIRequest): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHATBOT_CONFIG.apiTimeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
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
        case 401:
          errorType = 'auth';
          errorMessage = 'Invalid API key. Please check your configuration.';
          retryable = false;
          break;
        case 429:
          errorType = 'rate_limit';
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          retryable = true;
          break;
        case 400:
          errorType = 'content';
          errorMessage = errorData.error?.message || 'Invalid request content.';
          retryable = false;
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
          errorMessage = errorData.error?.message || errorMessage;
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
export const openAIService = OpenAIService.getInstance();