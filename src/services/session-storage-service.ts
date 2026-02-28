// Session storage service for chatbot conversation persistence
import { Message, ChatSession } from '../components/chatbot/chatbot.types';

export class SessionStorageService {
  private static readonly STORAGE_KEY = 'chatbot_messages';
  private static readonly MAX_MESSAGES = 50; // Limit to prevent storage quota issues
  private static readonly STORAGE_QUOTA_BUFFER = 0.1; // 10% buffer for storage quota

  /**
   * Save messages to session storage with quota handling
   */
  static saveMessages(messages: Message[]): boolean {
    try {
      // Limit messages to prevent storage quota issues
      const limitedMessages = this.limitMessages(messages);
      
      const sessionData: ChatSession = {
        messages: limitedMessages,
        timestamp: new Date()
      };

      const serializedData = JSON.stringify(sessionData);
      
      // Check if we're approaching storage quota
      if (this.isApproachingStorageQuota(serializedData)) {
        // Remove older messages and try again
        const reducedMessages = this.limitMessages(messages, Math.floor(this.MAX_MESSAGES / 2));
        const reducedSessionData: ChatSession = {
          messages: reducedMessages,
          timestamp: new Date()
        };
        
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(reducedSessionData));
        console.warn('Storage quota approaching, reduced message history');
      } else {
        sessionStorage.setItem(this.STORAGE_KEY, serializedData);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save messages to session storage:', error);
      
      // If storage is full, try to clear and save with reduced messages
      if (this.isStorageQuotaError(error)) {
        try {
          this.clearMessages();
          const reducedMessages = this.limitMessages(messages, 10); // Keep only last 10 messages
          const reducedSessionData: ChatSession = {
            messages: reducedMessages,
            timestamp: new Date()
          };
          
          sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(reducedSessionData));
          console.warn('Storage quota exceeded, saved with reduced message history');
          return true;
        } catch (retryError) {
          console.error('Failed to save even reduced messages:', retryError);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Load messages from session storage
   */
  static loadMessages(): Message[] {
    try {
      const savedData = sessionStorage.getItem(this.STORAGE_KEY);
      if (!savedData) {
        return [];
      }

      const sessionData: ChatSession = JSON.parse(savedData);
      
      // Validate the data structure
      if (!sessionData.messages || !Array.isArray(sessionData.messages)) {
        console.warn('Invalid session data structure, clearing storage');
        this.clearMessages();
        return [];
      }

      // Convert timestamp strings back to Date objects
      const messages: Message[] = sessionData.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      // Validate message structure
      const validMessages = messages.filter(this.isValidMessage);
      
      if (validMessages.length !== messages.length) {
        console.warn('Some messages had invalid structure and were filtered out');
      }

      return validMessages;
    } catch (error) {
      console.error('Failed to load messages from session storage:', error);
      // Clear corrupted data
      this.clearMessages();
      return [];
    }
  }

  /**
   * Clear all messages from session storage
   */
  static clearMessages(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear messages from session storage:', error);
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const testKey = '__storage_test__';
      const testValue = 'x';
      let used = 0;
      let available = 0;

      // Calculate used storage
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          used += sessionStorage[key].length + key.length;
        }
      }

      // Calculate available storage by trying to store data
      try {
        let testSize = 1024; // Start with 1KB
        while (testSize < 10 * 1024 * 1024) { // Max 10MB test
          try {
            sessionStorage.setItem(testKey, 'x'.repeat(testSize));
            sessionStorage.removeItem(testKey);
            available = testSize;
            testSize *= 2;
          } catch {
            break;
          }
        }
      } catch {
        available = 0;
      }

      const total = used + available;
      const percentage = total > 0 ? (used / total) * 100 : 0;

      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Check if we're approaching storage quota
   */
  private static isApproachingStorageQuota(data: string): boolean {
    try {
      const storageInfo = this.getStorageInfo();
      const dataSize = data.length * 2; // Rough estimate for UTF-16 encoding
      const projectedUsage = (storageInfo.used + dataSize) / (storageInfo.used + storageInfo.available);
      
      return projectedUsage > (1 - this.STORAGE_QUOTA_BUFFER);
    } catch {
      return false;
    }
  }

  /**
   * Check if error is related to storage quota
   */
  private static isStorageQuotaError(error: any): boolean {
    return error && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014
    );
  }

  /**
   * Limit messages to prevent storage issues
   */
  private static limitMessages(messages: Message[], maxMessages: number = this.MAX_MESSAGES): Message[] {
    if (messages.length <= maxMessages) {
      return messages;
    }

    // Keep the most recent messages
    return messages.slice(-maxMessages);
  }

  /**
   * Validate message structure
   */
  private static isValidMessage(message: any): message is Message {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.content === 'string' &&
      (message.role === 'user' || message.role === 'assistant') &&
      message.timestamp instanceof Date
    );
  }

  /**
   * Get session age in minutes
   */
  static getSessionAge(): number {
    try {
      const savedData = sessionStorage.getItem(this.STORAGE_KEY);
      if (!savedData) {
        return 0;
      }

      const sessionData: ChatSession = JSON.parse(savedData);
      const sessionTimestamp = new Date(sessionData.timestamp);
      const now = new Date();
      
      return Math.floor((now.getTime() - sessionTimestamp.getTime()) / (1000 * 60));
    } catch {
      return 0;
    }
  }

  /**
   * Check if session should be cleared based on age
   */
  static shouldClearOldSession(maxAgeMinutes: number = 60): boolean {
    return this.getSessionAge() > maxAgeMinutes;
  }
}

export default SessionStorageService;