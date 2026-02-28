// Text-to-Speech service for converting chatbot responses to speech
import { TTSRequest, TTSResponse, TTSServiceResponse, TTSErrorState, TTSErrorType } from '../components/chatbot/chatbot.types';
import { TTS_CONFIG, VOICE_SETTINGS } from '../config/tts-config';
import { audioCacheService } from './audio-cache';

/**
 * Text-to-Speech service that handles API communication with Lambda TTS endpoint
 * Follows singleton pattern consistent with other services
 */
export class TextToSpeechService {
  private static instance: TextToSpeechService;
  private readonly apiEndpoint: string;

  private constructor() {
    // Use dedicated TTS endpoint if available, otherwise fall back to chat endpoint with /tts path
    this.apiEndpoint = import.meta.env.VITE_TTS_API_URL ||
      (import.meta.env.VITE_BACKEND_API_URL || 'https://your-lambda-url.amazonaws.com');
  }

  /**
   * Get singleton instance of TTS service
   */
  public static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  /**
   * Generate speech from text using ElevenLabs API via Lambda
   * @param text - Text to convert to speech
   * @param options - Optional TTS configuration overrides
   * @param onProgress - Optional progress callback for long operations
   * @returns Promise with audio data or error
   */
  async generateSpeech(
    text: string,
    options?: Partial<TTSRequest>,
    onProgress?: (message: string) => void
  ): Promise<TTSServiceResponse<ArrayBuffer>> {

    // Validate input
    const validationError = this.validateTTSRequest(text, options);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Prepare TTS request parameters
    const voiceId = options?.voiceId || TTS_CONFIG.voiceId;
    const modelId = options?.modelId || TTS_CONFIG.modelId;
    const trimmedText = text.trim();

    // Check cache first
    const cachedAudio = audioCacheService.get(trimmedText, voiceId, modelId);
    if (cachedAudio) {
      return {
        success: true,
        data: cachedAudio,
        audioData: cachedAudio
      };
    }

    // Prepare TTS request
    const ttsRequest: TTSRequest = {
      text: trimmedText,
      voiceId,
      modelId,
      outputFormat: options?.outputFormat || TTS_CONFIG.outputFormat,
      voiceSettings: options?.voiceSettings || VOICE_SETTINGS
    };

    // Provide progress feedback for long operations
    if (onProgress) {
      const estimatedTime = this.estimateGenerationTime(trimmedText, voiceId, modelId);
      if (estimatedTime > 5000) {
        onProgress(`Generating speech... This may take ${Math.ceil(estimatedTime / 1000)} seconds`);
      } else {
        onProgress('Generating speech...');
      }
    }

    // Execute with retry logic
    const result = await this.executeWithTTSRetry(() => this.callTTSEndpoint(ttsRequest));

    // Cache successful results
    if (result.success && result.audioData) {
      audioCacheService.set(trimmedText, result.audioData, voiceId, modelId);
    }

    return result;
  }

  /**
   * Call the Lambda TTS endpoint
   * @param request - TTS request data
   * @returns Promise with TTS response
   */
  private async callTTSEndpoint(request: TTSRequest): Promise<TTSServiceResponse<ArrayBuffer>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TTS_CONFIG.apiTimeout);

      // Use the endpoint directly if it's the dedicated TTS URL, otherwise append /tts
      const endpoint = import.meta.env.VITE_TTS_API_URL ? this.apiEndpoint : `${this.apiEndpoint}/tts`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return this.handleHTTPError(response);
      }

      // Handle JSON response (both success and error cases)
      const responseData = await response.json();

      // Check if it's an error response
      if (!responseData.success || responseData.error) {
        return {
          success: false,
          error: {
            type: 'tts_api',
            message: responseData.error || 'TTS API returned an error',
            retryable: this.isHTTPErrorRetryable(response.status)
          }
        };
      }

      // Handle successful response with base64 audio data
      if (!responseData.audioData) {
        return {
          success: false,
          error: {
            type: 'tts_api',
            message: 'No audio data received from TTS service',
            retryable: true
          }
        };
      }

      // Convert base64 to ArrayBuffer
      const base64Audio = responseData.audioData;
      const binaryString = atob(base64Audio);
      const audioData = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(audioData);

      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }

      if (audioData.byteLength === 0) {
        return {
          success: false,
          error: {
            type: 'tts_api',
            message: 'Received empty audio data',
            retryable: true
          }
        };
      }

      return {
        success: true,
        data: audioData,
        audioData
      };

    } catch (error) {
      console.error('TTS Service Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: {
              type: 'timeout',
              message: 'TTS request timed out',
              retryable: true
            }
          };
        }

        if (error.message.includes('fetch')) {
          return {
            success: false,
            error: {
              type: 'network',
              message: 'Network error during TTS request',
              retryable: true
            }
          };
        }
      }

      return {
        success: false,
        error: {
          type: 'server',
          message: error instanceof Error ? error.message : 'Unknown TTS error',
          retryable: true
        }
      };
    }
  }

  /**
   * Handle HTTP error responses
   * @param response - HTTP response object
   * @returns Error response
   */
  private async handleHTTPError(response: Response): Promise<TTSServiceResponse<ArrayBuffer>> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorType: TTSErrorState['type'] = 'server';

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If we can't parse JSON, use the default message
    }

    // Map HTTP status codes to error types
    switch (response.status) {
      case 400:
        errorType = 'content';
        break;
      case 401:
      case 403:
        errorType = 'auth';
        break;
      case 429:
        errorType = 'rate_limit';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = 'server';
        break;
      default:
        errorType = 'tts_api';
    }

    return {
      success: false,
      error: {
        type: errorType,
        message: errorMessage,
        retryable: this.isHTTPErrorRetryable(response.status)
      }
    };
  }

  /**
   * Determine if HTTP error is retryable
   * @param status - HTTP status code
   * @returns Whether the error should be retried
   */
  private isHTTPErrorRetryable(status: number): boolean {
    // Retry server errors and rate limits, but not client errors
    return status >= 500 || status === 429;
  }

  /**
   * Validate TTS request parameters
   * @param text - Text to validate
   * @param options - Optional parameters to validate
   * @returns Error state if validation fails, null if valid
   */
  private validateTTSRequest(text: string, options?: Partial<TTSRequest>): TTSErrorState | null {
    if (!text || typeof text !== 'string') {
      return {
        type: 'content',
        message: 'Text is required and must be a string',
        retryable: false
      };
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return {
        type: 'content',
        message: 'Text cannot be empty',
        retryable: false
      };
    }

    if (trimmedText.length > TTS_CONFIG.maxTextLength) {
      return {
        type: 'text_too_long',
        message: `Text is too long (max ${TTS_CONFIG.maxTextLength} characters)`,
        retryable: false
      };
    }

    // Validate voice ID format if provided
    if (options?.voiceId && typeof options.voiceId !== 'string') {
      return {
        type: 'content',
        message: 'Voice ID must be a string',
        retryable: false
      };
    }

    // Validate model ID if provided
    if (options?.modelId && typeof options.modelId !== 'string') {
      return {
        type: 'content',
        message: 'Model ID must be a string',
        retryable: false
      };
    }

    return null;
  }

  /**
   * Execute TTS request with custom retry logic
   * @param fn - Function to execute
   * @returns Promise with result or final error
   */
  private async executeWithTTSRetry(
    fn: () => Promise<TTSServiceResponse<ArrayBuffer>>
  ): Promise<TTSServiceResponse<ArrayBuffer>> {
    const maxRetries = 3;
    const baseDelay = 1000;
    let lastError: TTSErrorState | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();

        if (result.success) {
          return result;
        }

        // Check if error is retryable
        if (result.error && this.isRetryableError(result.error) && attempt < maxRetries) {
          lastError = result.error;
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Return error if not retryable or max retries reached
        return result;

      } catch (error) {
        // Handle unexpected errors
        const errorState: TTSErrorState = {
          type: 'server',
          message: error instanceof Error ? error.message : 'Unknown TTS error occurred',
          retryable: true
        };

        if (this.isRetryableError(errorState) && attempt < maxRetries) {
          lastError = errorState;
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
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
   * Custom retry logic for TTS errors
   * @param error - Error state to check
   * @returns Whether the error should be retried
   */
  private isRetryableError(error: TTSErrorState): boolean {
    switch (error.type) {
      case 'network':
      case 'timeout':
      case 'server':
        return true; // Always retry network, timeout, and server errors
      case 'rate_limit':
        return true; // Retry rate limit errors with backoff
      case 'tts_api':
        return error.retryable; // Use the retryable flag from the error
      case 'auth':
      case 'content':
      case 'text_too_long':
      case 'voice_not_found':
        return false; // Don't retry these errors
      default:
        return error.retryable;
    }
  }

  /**
   * Get user-friendly error message for TTS errors
   * @param error - Error state
   * @returns User-friendly error message
   */
  public getUserFriendlyErrorMessage(error: TTSErrorState): string {
    switch (error.type) {
      case 'network':
        return 'Unable to connect to the speech service. Please check your internet connection and try again.';
      case 'timeout':
        return 'The speech generation took too long. Please try again.';
      case 'server':
        return 'The speech service is temporarily unavailable. Please try again in a moment.';
      case 'rate_limit':
        return 'Too many speech requests have been made. Please wait a moment before trying again.';
      case 'auth':
        return 'There\'s an issue with the speech service configuration. Please contact support.';
      case 'content':
        return 'The text couldn\'t be processed for speech. Please try different text.';
      case 'text_too_long':
        return `The text is too long for speech conversion (max ${TTS_CONFIG.maxTextLength} characters).`;
      case 'tts_api':
        return 'The speech service encountered an error. Please try again.';
      case 'voice_not_found':
        return 'The selected voice is not available. Please try again.';
      case 'audio_playback':
        return 'Unable to play the generated audio. Please try again.';
      default:
        return error.message || 'An unexpected error occurred with speech generation. Please try again.';
    }
  }

  /**
   * Check if an error is retryable by the user
   * @param error - Error state
   * @returns Whether user should be offered a retry option
   */
  public isUserRetryable(error: TTSErrorState): boolean {
    return error.retryable && ['network', 'timeout', 'server', 'rate_limit', 'tts_api'].includes(error.type);
  }

  /**
   * Get suggested retry delay for user-initiated retries
   * @param error - Error state
   * @returns Suggested delay in milliseconds
   */
  public getSuggestedRetryDelay(error: TTSErrorState): number {
    switch (error.type) {
      case 'rate_limit':
        return 10000; // 10 seconds for rate limits (TTS is more expensive)
      case 'server':
      case 'tts_api':
        return 5000; // 5 seconds for server/API errors
      case 'network':
      case 'timeout':
        return 3000; // 3 seconds for network/timeout
      default:
        return 2000; // 2 seconds default
    }
  }

  /**
   * Create a sanitized error for logging (removes sensitive information)
   * @param error - Original error
   * @returns Sanitized error for logging
   */
  public sanitizeErrorForLogging(error: TTSErrorState): Omit<TTSErrorState, 'message'> & { message: string } {
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
   * Get current TTS configuration
   * @returns Current TTS configuration
   */
  public getConfig(): typeof TTS_CONFIG {
    return { ...TTS_CONFIG };
  }

  /**
   * Check if text is suitable for TTS conversion
   * @param text - Text to check
   * @returns Whether text can be converted to speech
   */
  public canConvertToSpeech(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const trimmedText = text.trim();
    return trimmedText.length > 0 && trimmedText.length <= TTS_CONFIG.maxTextLength;
  }

  /**
   * Estimate TTS generation time based on text length
   * @param text - Text to estimate for
   * @param voiceId - Voice ID to check cache for
   * @param modelId - Model ID to check cache for
   * @returns Estimated generation time in milliseconds (0 if cached)
   */
  public estimateGenerationTime(text: string, voiceId?: string, modelId?: string): number {
    if (!text) return 0;

    // If cached, return 0 (instant)
    if (audioCacheService.has(text.trim(), voiceId || TTS_CONFIG.voiceId, modelId || TTS_CONFIG.modelId)) {
      return 0;
    }

    // Rough estimate: ~100ms per word + base processing time
    const wordCount = text.trim().split(/\s+/).length;
    const baseTime = 2000; // 2 seconds base processing
    const timePerWord = 100; // 100ms per word

    return Math.min(baseTime + (wordCount * timePerWord), TTS_CONFIG.apiTimeout);
  }

  /**
   * Check if text is cached for TTS
   * @param text - Text to check
   * @param voiceId - Voice ID (optional)
   * @param modelId - Model ID (optional)
   * @returns Whether text is cached
   */
  public isCached(text: string, voiceId?: string, modelId?: string): boolean {
    return audioCacheService.has(text.trim(), voiceId || TTS_CONFIG.voiceId, modelId || TTS_CONFIG.modelId);
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public getCacheStats() {
    return {
      ...audioCacheService.getStats(),
      hitRate: audioCacheService.getHitRate(),
      config: audioCacheService.getConfig()
    };
  }

  /**
   * Clear TTS cache
   */
  public clearCache(): void {
    audioCacheService.clearAll();
  }

  /**
   * Update cache configuration
   * @param config - Partial cache configuration
   */
  public updateCacheConfig(config: Parameters<typeof audioCacheService.updateConfig>[0]): void {
    audioCacheService.updateConfig(config);
  }
}

// Export singleton instance
export const textToSpeechService = TextToSpeechService.getInstance();