// Enhanced chatbot service with retry logic and comprehensive error handling
import { Message, ApiServiceResponse, ErrorState } from '../components/chatbot/chatbot.types';
import { backendOpenAIService } from './backend-openai-service';
import { retryService, RetryConfig } from './retry-service';
import { conversationContextService } from './conversation-context-service';
import SessionStorageService from './session-storage-service';

/**
 * Enhanced chatbot service that combines OpenAI API calls with retry logic
 */
export class ChatbotService {
  private static instance: ChatbotService;

  private constructor() {}

  /**
   * Get singleton instance of chatbot service
   */
  public static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  /**
   * Send message to chatbot with retry logic and enhanced error handling
   * @param messages - Array of conversation messages
   * @param retryConfig - Optional retry configuration
   * @returns Promise with chatbot response or error
   */
  async sendMessage(
    messages: Message[], 
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiServiceResponse<string>> {
    // Update retry configuration if provided
    if (retryConfig) {
      retryService.updateConfig(retryConfig);
    }

    // Validate input
    const validationError = this.validateMessages(messages);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Check if context optimization is needed and log stats
    if (conversationContextService.needsOptimization(messages)) {
      const stats = conversationContextService.getContextStats(messages);
      console.log('Context optimization applied:', stats);
    }

    // Execute with retry logic using backend service
    return retryService.executeWithRetry(
      () => backendOpenAIService.sendChatCompletion(messages),
      this.isRetryableError
    );
  }

  /**
   * Validate messages array
   * @param messages - Messages to validate
   * @returns Error state if validation fails, null if valid
   */
  private validateMessages(messages: Message[]): ErrorState | null {
    if (!Array.isArray(messages)) {
      return {
        type: 'content',
        message: 'Messages must be an array',
        retryable: false
      };
    }

    if (messages.length === 0) {
      return {
        type: 'content',
        message: 'At least one message is required',
        retryable: false
      };
    }

    // Check for empty or invalid messages
    for (const message of messages) {
      if (!message.content || typeof message.content !== 'string') {
        return {
          type: 'content',
          message: 'All messages must have valid content',
          retryable: false
        };
      }

      if (!['user', 'assistant'].includes(message.role)) {
        return {
          type: 'content',
          message: 'Invalid message role',
          retryable: false
        };
      }

      // Check message length only for user messages (not system or assistant)
      if (message.role === 'user' && message.content.length > 200) {
        return {
          type: 'content',
          message: 'Message content is too long (max 200 characters)',
          retryable: false
        };
      }
    }

    return null;
  }

  /**
   * Custom retry logic for chatbot errors
   * @param error - Error state to check
   * @returns Whether the error should be retried
   */
  private isRetryableError(error: ErrorState): boolean {
    switch (error.type) {
      case 'network':
      case 'timeout':
        return true; // Always retry network and timeout errors
      case 'server':
        return true; // Retry server errors
      case 'rate_limit':
        return true; // Retry rate limit errors with backoff
      case 'auth':
        return false; // Don't retry auth errors
      case 'content':
        return false; // Don't retry content errors
      default:
        return error.retryable;
    }
  }

  /**
   * Get user-friendly error message for display
   * @param error - Error state
   * @returns User-friendly error message
   */
  public getUserFriendlyErrorMessage(error: ErrorState): string {
    switch (error.type) {
      case 'network':
        return 'Unable to connect to the AI service. Please check your internet connection and try again.';
      case 'timeout':
        return 'The request took too long to complete. Please try again.';
      case 'server':
        return 'The AI service is temporarily unavailable. Please try again in a moment.';
      case 'rate_limit':
        return 'Too many requests have been made. Please wait a moment before trying again.';
      case 'auth':
        return 'There\'s an issue with the AI service configuration. Please contact support.';
      case 'content':
        return 'Your message couldn\'t be processed. Please try rephrasing your question.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if an error is retryable by the user
   * @param error - Error state
   * @returns Whether user should be offered a retry option
   */
  public isUserRetryable(error: ErrorState): boolean {
    return error.retryable && ['network', 'timeout', 'server', 'rate_limit'].includes(error.type);
  }

  /**
   * Get suggested retry delay for user-initiated retries
   * @param error - Error state
   * @returns Suggested delay in milliseconds
   */
  public getSuggestedRetryDelay(error: ErrorState): number {
    switch (error.type) {
      case 'rate_limit':
        return 5000; // 5 seconds for rate limits
      case 'server':
        return 3000; // 3 seconds for server errors
      case 'network':
      case 'timeout':
        return 2000; // 2 seconds for network/timeout
      default:
        return 1000; // 1 second default
    }
  }

  /**
   * Create a sanitized error for logging (removes sensitive information)
   * @param error - Original error
   * @returns Sanitized error for logging
   */
  public sanitizeErrorForLogging(error: ErrorState): Omit<ErrorState, 'message'> & { message: string } {
    // Remove potentially sensitive information from error messages
    let sanitizedMessage = error.message;
    
    // Remove API keys or tokens if they somehow end up in error messages
    sanitizedMessage = sanitizedMessage.replace(/sk-[a-zA-Z0-9]+/g, '[API_KEY_REDACTED]');
    sanitizedMessage = sanitizedMessage.replace(/Bearer\s+[a-zA-Z0-9]+/g, '[TOKEN_REDACTED]');
    
    return {
      type: error.type,
      message: sanitizedMessage,
      retryable: error.retryable
    };
  }

  /**
   * Get conversation context statistics
   * @param messages - Messages to analyze
   * @returns Context statistics
   */
  public getContextStats(messages: Message[]) {
    return conversationContextService.getContextStats(messages);
  }

  /**
   * Check if conversation needs optimization
   * @param messages - Messages to check
   * @returns Whether optimization is recommended
   */
  public needsOptimization(messages: Message[]): boolean {
    return conversationContextService.needsOptimization(messages);
  }

  /**
   * Get conversation summary for context preservation
   * @param messages - Messages to summarize
   * @returns Conversation summary
   */
  public getConversationSummary(messages: Message[]): string {
    return conversationContextService.getConversationSummary(messages);
  }

  /**
   * Optimize conversation for better performance
   * @param messages - Messages to optimize
   * @returns Optimized conversation context
   */
  public optimizeConversation(messages: Message[]) {
    return conversationContextService.optimizeContext(messages);
  }

  /**
   * Get storage information and manage session persistence
   * @returns Storage usage information
   */
  public getStorageInfo() {
    return SessionStorageService.getStorageInfo();
  }

  /**
   * Clear old conversation data if needed
   * @param maxAgeMinutes - Maximum age in minutes before clearing
   */
  public clearOldConversations(maxAgeMinutes: number = 60): boolean {
    if (SessionStorageService.shouldClearOldSession(maxAgeMinutes)) {
      SessionStorageService.clearMessages();
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const chatbotService = ChatbotService.getInstance();