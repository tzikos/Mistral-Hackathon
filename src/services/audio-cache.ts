// Audio Cache Service for TTS audio caching
import { TTS_CONFIG } from '../config/tts-config';

/**
 * Cache entry for storing audio data with metadata
 */
interface AudioCacheEntry {
  audioData: ArrayBuffer;
  audioUrl: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  textHash: string;
  size: number;
}

/**
 * Cache statistics for monitoring and debugging
 */
interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  memoryUsage: number;
}

/**
 * Audio Cache configuration
 */
interface AudioCacheConfig {
  maxEntries: number;
  maxSizeBytes: number;
  maxAgeMs: number;
  cleanupIntervalMs: number;
}

/**
 * Audio Cache Service for caching TTS-generated audio
 * Implements LRU eviction with size and time-based cleanup
 */
export class AudioCacheService {
  private static instance: AudioCacheService;
  private cache: Map<string, AudioCacheEntry> = new Map();
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    memoryUsage: 0
  };
  
  private config: AudioCacheConfig = {
    maxEntries: 50, // Maximum number of cached audio files
    maxSizeBytes: 50 * 1024 * 1024, // 50MB total cache size
    maxAgeMs: 30 * 60 * 1000, // 30 minutes max age
    cleanupIntervalMs: 5 * 60 * 1000 // Cleanup every 5 minutes
  };
  
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupTimer();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.clearAll();
    });
  }

  /**
   * Get singleton instance of AudioCacheService
   */
  public static getInstance(): AudioCacheService {
    if (!AudioCacheService.instance) {
      AudioCacheService.instance = new AudioCacheService();
    }
    return AudioCacheService.instance;
  }

  /**
   * Generate cache key from text and TTS settings
   * @param text - Text content
   * @param voiceId - Voice ID used
   * @param modelId - Model ID used
   * @returns Cache key string
   */
  private generateCacheKey(text: string, voiceId?: string, modelId?: string): string {
    const normalizedText = text.trim().toLowerCase();
    const voice = voiceId || TTS_CONFIG.voiceId;
    const model = modelId || TTS_CONFIG.modelId;
    
    // Create a simple hash of the content
    const content = `${normalizedText}|${voice}|${model}`;
    return this.simpleHash(content);
  }

  /**
   * Simple hash function for cache keys
   * @param str - String to hash
   * @returns Hash string
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if audio is cached for given parameters
   * @param text - Text content
   * @param voiceId - Voice ID (optional)
   * @param modelId - Model ID (optional)
   * @returns Whether audio is cached
   */
  has(text: string, voiceId?: string, modelId?: string): boolean {
    const key = this.generateCacheKey(text, voiceId, modelId);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.removeEntry(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cached audio data
   * @param text - Text content
   * @param voiceId - Voice ID (optional)
   * @param modelId - Model ID (optional)
   * @returns Cached audio data or null if not found
   */
  get(text: string, voiceId?: string, modelId?: string): ArrayBuffer | null {
    const key = this.generateCacheKey(text, voiceId, modelId);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.missCount++;
      return null;
    }
    
    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.removeEntry(key);
      this.stats.missCount++;
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hitCount++;
    
    return entry.audioData;
  }

  /**
   * Get cached audio URL for direct playback
   * @param text - Text content
   * @param voiceId - Voice ID (optional)
   * @param modelId - Model ID (optional)
   * @returns Cached audio URL or null if not found
   */
  getAudioUrl(text: string, voiceId?: string, modelId?: string): string | null {
    const key = this.generateCacheKey(text, voiceId, modelId);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.missCount++;
      return null;
    }
    
    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.removeEntry(key);
      this.stats.missCount++;
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hitCount++;
    
    return entry.audioUrl;
  }

  /**
   * Store audio data in cache
   * @param text - Text content
   * @param audioData - Audio data to cache
   * @param voiceId - Voice ID (optional)
   * @param modelId - Model ID (optional)
   * @returns Whether caching was successful
   */
  set(text: string, audioData: ArrayBuffer, voiceId?: string, modelId?: string): boolean {
    const key = this.generateCacheKey(text, voiceId, modelId);
    const size = audioData.byteLength;
    
    // Check if audio is too large to cache
    if (size > this.config.maxSizeBytes / 4) { // Don't cache items larger than 25% of total cache
      return false;
    }
    
    // Create blob URL for the audio
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(blob);
    
    // Create cache entry
    const entry: AudioCacheEntry = {
      audioData: audioData.slice(0), // Create a copy
      audioUrl,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      textHash: this.simpleHash(text.trim().toLowerCase()),
      size
    };
    
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.removeEntry(key);
    }
    
    // Ensure we have space for the new entry
    this.ensureSpace(size);
    
    // Add to cache
    this.cache.set(key, entry);
    this.stats.totalEntries++;
    this.stats.totalSize += size;
    this.updateMemoryUsage();
    
    return true;
  }

  /**
   * Remove specific entry from cache
   * @param text - Text content
   * @param voiceId - Voice ID (optional)
   * @param modelId - Model ID (optional)
   * @returns Whether entry was removed
   */
  remove(text: string, voiceId?: string, modelId?: string): boolean {
    const key = this.generateCacheKey(text, voiceId, modelId);
    return this.removeEntry(key);
  }

  /**
   * Clear all cached audio
   */
  clearAll(): void {
    for (const [key] of this.cache) {
      this.removeEntry(key);
    }
    this.cache.clear();
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      evictionCount: this.stats.evictionCount,
      memoryUsage: 0
    };
  }

  /**
   * Get cache statistics
   * @returns Current cache statistics
   */
  getStats(): CacheStats {
    this.updateMemoryUsage();
    return { ...this.stats };
  }

  /**
   * Get cache hit rate
   * @returns Hit rate as percentage (0-100)
   */
  getHitRate(): number {
    const total = this.stats.hitCount + this.stats.missCount;
    return total > 0 ? (this.stats.hitCount / total) * 100 : 0;
  }

  /**
   * Update cache configuration
   * @param newConfig - Partial configuration to update
   */
  updateConfig(newConfig: Partial<AudioCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupIntervalMs) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
    
    // Trigger cleanup if limits were reduced
    if (newConfig.maxEntries || newConfig.maxSizeBytes) {
      this.cleanup();
    }
  }

  /**
   * Get current cache configuration
   * @returns Current configuration
   */
  getConfig(): AudioCacheConfig {
    return { ...this.config };
  }

  /**
   * Preload audio into cache (for anticipated requests)
   * @param text - Text content
   * @param audioData - Audio data to preload
   * @param voiceId - Voice ID (optional)
   * @param modelId - Model ID (optional)
   * @returns Whether preloading was successful
   */
  preload(text: string, audioData: ArrayBuffer, voiceId?: string, modelId?: string): boolean {
    return this.set(text, audioData, voiceId, modelId);
  }

  /**
   * Check if entry is expired
   * @param entry - Cache entry to check
   * @returns Whether entry is expired
   */
  private isExpired(entry: AudioCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.maxAgeMs;
  }

  /**
   * Remove entry by key
   * @param key - Cache key to remove
   * @returns Whether entry was removed
   */
  private removeEntry(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(entry.audioUrl);
    
    // Remove from cache
    this.cache.delete(key);
    this.stats.totalEntries--;
    this.stats.totalSize -= entry.size;
    
    return true;
  }

  /**
   * Ensure there's space for a new entry of given size
   * @param requiredSize - Size needed for new entry
   */
  private ensureSpace(requiredSize: number): void {
    // Check if we need to make space
    while (
      this.cache.size >= this.config.maxEntries ||
      this.stats.totalSize + requiredSize > this.config.maxSizeBytes
    ) {
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * Evict the least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.removeEntry(oldestKey);
      this.stats.evictionCount++;
    }
  }

  /**
   * Cleanup expired entries and optimize cache
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    // Find expired entries
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove expired entries
    for (const key of keysToRemove) {
      this.removeEntry(key);
      this.stats.evictionCount++;
    }
    
    // If still over limits, evict LRU entries
    while (
      this.cache.size > this.config.maxEntries ||
      this.stats.totalSize > this.config.maxSizeBytes
    ) {
      this.evictLeastRecentlyUsed();
    }
    
    this.updateMemoryUsage();
  }

  /**
   * Update memory usage statistics
   */
  private updateMemoryUsage(): void {
    // Estimate memory usage (audio data + overhead)
    this.stats.memoryUsage = this.stats.totalSize + (this.cache.size * 1024); // 1KB overhead per entry
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Stop the cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Export singleton instance
export const audioCacheService = AudioCacheService.getInstance();