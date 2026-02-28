// Audio Manager for handling TTS audio playback
import { AUDIO_CONFIG } from '../config/tts-config';
import { TTSErrorState } from '../components/chatbot/chatbot.types';
import { audioCacheService } from './audio-cache';

/**
 * Audio Manager class for handling audio playback with single instance management
 * Ensures only one audio plays at a time and handles cleanup properly
 */
export class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentMessageId: string | null = null;
  private audioUrls: Map<string, string> = new Map(); // Track created URLs for cleanup
  private fadeTimeouts: Set<NodeJS.Timeout> = new Set(); // Track fade timeouts

  private constructor() {
    // Bind methods to preserve context
    this.handleAudioEnd = this.handleAudioEnd.bind(this);
    this.handleAudioError = this.handleAudioError.bind(this);
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * Get singleton instance of AudioManager
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Play audio from ArrayBuffer data
   * @param audioData - Audio data as ArrayBuffer
   * @param messageId - ID of the message this audio belongs to
   * @param text - Original text for caching (optional)
   * @param voiceId - Voice ID for caching (optional)
   * @param modelId - Model ID for caching (optional)
   * @returns Promise that resolves when audio starts playing
   */
  async playAudio(
    audioData: ArrayBuffer, 
    messageId: string, 
    text?: string, 
    voiceId?: string, 
    modelId?: string
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stopCurrent();

      // Try to get cached audio URL first
      let audioUrl: string;
      if (text && audioCacheService.has(text, voiceId, modelId)) {
        audioUrl = audioCacheService.getAudioUrl(text, voiceId, modelId)!;
      } else {
        // Create blob and object URL
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(blob);
        
        // Cache the audio data for future use
        if (text) {
          audioCacheService.set(text, audioData, voiceId, modelId);
        }
      }
      
      // Store URL for cleanup
      this.audioUrls.set(messageId, audioUrl);

      // Create and configure audio element
      const audio = new Audio(audioUrl);
      audio.volume = AUDIO_CONFIG.volume;
      audio.preload = 'auto';

      // Set up event listeners
      audio.addEventListener('ended', this.handleAudioEnd);
      audio.addEventListener('error', this.handleAudioError);

      // Store current audio reference
      this.currentAudio = audio;
      this.currentMessageId = messageId;

      // Wait for audio to be ready and then play
      await this.waitForAudioReady(audio);
      await this.playWithFadeIn(audio);

    } catch (error) {
      // Clean up on error
      this.cleanupMessage(messageId);
      throw this.createAudioError(error, 'Failed to play audio');
    }
  }

  /**
   * Stop currently playing audio
   */
  stopCurrent(): void {
    if (this.currentAudio && this.currentMessageId) {
      this.fadeOutAndStop(this.currentAudio);
      this.cleanupMessage(this.currentMessageId);
      this.currentAudio = null;
      this.currentMessageId = null;
    }
  }

  /**
   * Check if audio is currently playing for a specific message
   * @param messageId - Message ID to check
   * @returns Whether audio is playing for this message
   */
  isPlaying(messageId: string): boolean {
    return this.currentMessageId === messageId && 
           this.currentAudio !== null && 
           !this.currentAudio.paused;
  }

  /**
   * Check if any audio is currently playing
   * @returns Whether any audio is currently playing
   */
  isAnyPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  /**
   * Get the ID of the currently playing message
   * @returns Current message ID or null if nothing is playing
   */
  getCurrentMessageId(): string | null {
    return this.currentMessageId;
  }

  /**
   * Set volume for current and future audio playback
   * @param volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (this.currentAudio) {
      this.currentAudio.volume = clampedVolume;
    }
    
    // Update config for future audio
    (AUDIO_CONFIG as any).volume = clampedVolume;
  }

  /**
   * Get current volume level
   * @returns Current volume (0.0 to 1.0)
   */
  getVolume(): number {
    return this.currentAudio?.volume ?? AUDIO_CONFIG.volume;
  }

  /**
   * Clean up all audio resources
   */
  cleanup(): void {
    // Stop current audio
    this.stopCurrent();
    
    // Clean up all stored URLs (but not cached URLs)
    this.audioUrls.forEach((url, messageId) => {
      // Only revoke URLs that aren't from cache
      if (!url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.audioUrls.clear();
    
    // Clear all fade timeouts
    this.fadeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.fadeTimeouts.clear();
  }

  /**
   * Wait for audio to be ready for playback
   * @param audio - Audio element to wait for
   * @returns Promise that resolves when audio is ready
   */
  private async waitForAudioReady(audio: HTMLAudioElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Audio preload timeout'));
      }, AUDIO_CONFIG.preloadTimeout);

      const onCanPlay = () => {
        clearTimeout(timeout);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        clearTimeout(timeout);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
        reject(new Error('Audio failed to load'));
      };

      if (audio.readyState >= 3) { // HAVE_FUTURE_DATA
        clearTimeout(timeout);
        resolve();
      } else {
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('error', onError);
      }
    });
  }

  /**
   * Play audio with fade-in effect
   * @param audio - Audio element to play
   * @returns Promise that resolves when playback starts
   */
  private async playWithFadeIn(audio: HTMLAudioElement): Promise<void> {
    const targetVolume = AUDIO_CONFIG.volume;
    const fadeDuration = AUDIO_CONFIG.fadeInDuration;
    
    // Start with zero volume
    audio.volume = 0;
    
    // Start playback
    await audio.play();
    
    // Fade in
    if (fadeDuration > 0) {
      this.fadeVolume(audio, 0, targetVolume, fadeDuration);
    } else {
      audio.volume = targetVolume;
    }
  }

  /**
   * Fade out and stop audio
   * @param audio - Audio element to fade out
   */
  private fadeOutAndStop(audio: HTMLAudioElement): void {
    const currentVolume = audio.volume;
    const fadeDuration = AUDIO_CONFIG.fadeOutDuration;
    
    if (fadeDuration > 0 && currentVolume > 0) {
      this.fadeVolume(audio, currentVolume, 0, fadeDuration, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Fade audio volume over time
   * @param audio - Audio element to fade
   * @param startVolume - Starting volume
   * @param endVolume - Target volume
   * @param duration - Fade duration in milliseconds
   * @param onComplete - Callback when fade completes
   */
  private fadeVolume(
    audio: HTMLAudioElement, 
    startVolume: number, 
    endVolume: number, 
    duration: number,
    onComplete?: () => void
  ): void {
    const steps = 20; // Number of volume steps
    const stepDuration = duration / steps;
    const volumeStep = (endVolume - startVolume) / steps;
    
    let currentStep = 0;
    
    const fadeStep = () => {
      if (currentStep >= steps || audio.paused) {
        audio.volume = endVolume;
        onComplete?.();
        return;
      }
      
      audio.volume = startVolume + (volumeStep * currentStep);
      currentStep++;
      
      const timeout = setTimeout(fadeStep, stepDuration);
      this.fadeTimeouts.add(timeout);
    };
    
    fadeStep();
  }

  /**
   * Handle audio end event
   */
  private handleAudioEnd(): void {
    if (this.currentMessageId) {
      this.cleanupMessage(this.currentMessageId);
    }
    this.currentAudio = null;
    this.currentMessageId = null;
  }

  /**
   * Handle audio error event
   * @param event - Error event
   */
  private handleAudioError(event: Event): void {
    const audio = event.target as HTMLAudioElement;
    const error = audio.error;
    
    console.error('Audio playback error:', error);
    
    if (this.currentMessageId) {
      this.cleanupMessage(this.currentMessageId);
    }
    this.currentAudio = null;
    this.currentMessageId = null;
  }

  /**
   * Clean up resources for a specific message
   * @param messageId - Message ID to clean up
   */
  private cleanupMessage(messageId: string): void {
    const audioUrl = this.audioUrls.get(messageId);
    if (audioUrl) {
      // Only revoke URLs that aren't from cache (cache manages its own URLs)
      // We can safely revoke all URLs here as cache maintains its own references
      URL.revokeObjectURL(audioUrl);
      this.audioUrls.delete(messageId);
    }
  }

  /**
   * Create a standardized audio error
   * @param originalError - Original error
   * @param message - Error message
   * @returns Formatted error
   */
  private createAudioError(originalError: unknown, message: string): TTSErrorState {
    const errorMessage = originalError instanceof Error 
      ? `${message}: ${originalError.message}`
      : message;
      
    return {
      type: 'audio_playback',
      message: errorMessage,
      retryable: true
    };
  }

  /**
   * Check if audio is cached for given parameters
   * @param text - Text content
   * @param voiceId - Voice ID (optional)
   * @param modelId - Model ID (optional)
   * @returns Whether audio is cached
   */
  isCached(text: string, voiceId?: string, modelId?: string): boolean {
    return audioCacheService.has(text, voiceId, modelId);
  }

  /**
   * Get audio playback statistics
   * @returns Playback statistics
   */
  getStats(): {
    isPlaying: boolean;
    currentMessageId: string | null;
    activeUrls: number;
    volume: number;
    cache: {
      hitRate: number;
      totalEntries: number;
      memoryUsage: number;
    };
  } {
    const cacheStats = audioCacheService.getStats();
    return {
      isPlaying: this.isAnyPlaying(),
      currentMessageId: this.currentMessageId,
      activeUrls: this.audioUrls.size,
      volume: this.getVolume(),
      cache: {
        hitRate: audioCacheService.getHitRate(),
        totalEntries: cacheStats.totalEntries,
        memoryUsage: cacheStats.memoryUsage
      }
    };
  }

  /**
   * Preload audio data for faster playback
   * @param audioData - Audio data to preload
   * @param messageId - Message ID for the audio
   * @param text - Original text for caching (optional)
   * @param voiceId - Voice ID for caching (optional)
   * @param modelId - Model ID for caching (optional)
   * @returns Promise that resolves when preloading is complete
   */
  async preloadAudio(
    audioData: ArrayBuffer, 
    messageId: string, 
    text?: string, 
    voiceId?: string, 
    modelId?: string
  ): Promise<void> {
    try {
      // Check if already cached
      if (text && audioCacheService.has(text, voiceId, modelId)) {
        return; // Already cached, no need to preload
      }

      // Don't preload if already exists for this message
      if (this.audioUrls.has(messageId)) {
        return;
      }

      // Cache the audio data
      if (text) {
        audioCacheService.preload(text, audioData, voiceId, modelId);
      }

      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      // Store URL for later use
      this.audioUrls.set(messageId, audioUrl);
      
      // Create audio element for preloading
      const audio = new Audio(audioUrl);
      audio.preload = 'auto';
      
      // Wait for it to be ready
      await this.waitForAudioReady(audio);
      
    } catch (error) {
      // Clean up on preload error
      this.cleanupMessage(messageId);
      throw this.createAudioError(error, 'Failed to preload audio');
    }
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();