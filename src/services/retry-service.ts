// Retry service for handling transient failures
import { ApiServiceResponse, ErrorState } from '../components/chatbot/chatbot.types';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * Retry service for handling transient failures with exponential backoff
 */
export class RetryService {
  private config: RetryConfig;

  constructor(config: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.config = config;
  }

  /**
   * Execute a function with retry logic
   * @param fn - Function to execute
   * @param isRetryable - Function to determine if error is retryable
   * @returns Promise with result or final error
   */
  async executeWithRetry<T>(
    fn: () => Promise<ApiServiceResponse<T>>,
    isRetryable?: (error: ErrorState) => boolean
  ): Promise<ApiServiceResponse<T>> {
    let lastError: ErrorState | null = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await fn();
        
        if (result.success) {
          return result;
        }
        
        // Check if error is retryable
        if (result.error && this.shouldRetry(result.error, attempt, isRetryable)) {
          lastError = result.error;
          
          if (attempt < this.config.maxRetries) {
            const delay = this.calculateDelay(attempt);
            await this.sleep(delay);
            continue;
          }
        }
        
        // Return error if not retryable or max retries reached
        return result;
        
      } catch (error) {
        // Handle unexpected errors
        const errorState: ErrorState = {
          type: 'network',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          retryable: true
        };
        
        if (this.shouldRetry(errorState, attempt, isRetryable)) {
          lastError = errorState;
          
          if (attempt < this.config.maxRetries) {
            const delay = this.calculateDelay(attempt);
            await this.sleep(delay);
            continue;
          }
        }
        
        return {
          success: false,
          error: errorState
        };
      }
    }
    
    // This should never be reached, but just in case
    return {
      success: false,
      error: lastError || {
        type: 'server',
        message: 'Maximum retry attempts exceeded',
        retryable: false
      }
    };
  }

  /**
   * Determine if an error should be retried
   * @param error - Error state
   * @param attempt - Current attempt number
   * @param customRetryCheck - Custom retry logic
   * @returns Whether to retry
   */
  private shouldRetry(
    error: ErrorState, 
    attempt: number, 
    customRetryCheck?: (error: ErrorState) => boolean
  ): boolean {
    // Don't retry if max attempts reached
    if (attempt >= this.config.maxRetries) {
      return false;
    }
    
    // Use custom retry logic if provided
    if (customRetryCheck) {
      return customRetryCheck(error);
    }
    
    // Default retry logic based on error type
    switch (error.type) {
      case 'network':
      case 'timeout':
      case 'server':
      case 'rate_limit':
        return error.retryable;
      case 'auth':
      case 'content':
        return false; // Don't retry authentication or content errors
      default:
        return error.retryable;
    }
  }

  /**
   * Calculate delay for exponential backoff
   * @param attempt - Current attempt number
   * @returns Delay in milliseconds
   */
  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt);
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Sleep for specified duration
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update retry configuration
   * @param config - New retry configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current retry configuration
   * @returns Current retry configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

// Export default instance
export const retryService = new RetryService();