// Conversation context management service for optimized API calls
import { Message } from '../components/chatbot/chatbot.types';
import { CHATBOT_CONFIG } from '../config/chatbot-config';

export interface ConversationContext {
  messages: Message[];
  tokenEstimate: number;
  contextWindow: number;
}

export interface ContextOptimizationOptions {
  maxMessages?: number;
  maxTokens?: number;
  preserveSystemPrompt?: boolean;
  prioritizeRecent?: boolean;
}

/**
 * Service for managing conversation context and optimizing API calls
 */
export class ConversationContextService {
  private static instance: ConversationContextService;
  
  // Token estimation constants (rough estimates for GPT models)
  private static readonly CHARS_PER_TOKEN = 4;
  private static readonly SYSTEM_PROMPT_TOKEN_ESTIMATE = 200;
  private static readonly MESSAGE_OVERHEAD_TOKENS = 10;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ConversationContextService {
    if (!ConversationContextService.instance) {
      ConversationContextService.instance = new ConversationContextService();
    }
    return ConversationContextService.instance;
  }

  /**
   * Optimize conversation context for API calls
   * @param messages - Full conversation history
   * @param options - Optimization options
   * @returns Optimized context for API call
   */
  public optimizeContext(
    messages: Message[], 
    options: ContextOptimizationOptions = {}
  ): ConversationContext {
    const {
      maxMessages = CHATBOT_CONFIG.maxMessages,
      maxTokens = CHATBOT_CONFIG.maxTokens * 2, // Allow more tokens for context
      preserveSystemPrompt = true,
      prioritizeRecent = true
    } = options;

    // Start with all messages
    let optimizedMessages = [...messages];

    // Apply message count limit
    if (optimizedMessages.length > maxMessages) {
      if (prioritizeRecent) {
        // Keep the most recent messages
        optimizedMessages = optimizedMessages.slice(-maxMessages);
      } else {
        // Keep the first few messages (including early context)
        optimizedMessages = optimizedMessages.slice(0, maxMessages);
      }
    }

    // Estimate tokens and apply token limit
    let tokenEstimate = this.estimateTokens(optimizedMessages);
    
    if (tokenEstimate > maxTokens) {
      optimizedMessages = this.reduceTokens(optimizedMessages, maxTokens, prioritizeRecent);
      tokenEstimate = this.estimateTokens(optimizedMessages);
    }

    // Ensure conversation flow makes sense
    optimizedMessages = this.ensureConversationFlow(optimizedMessages);

    return {
      messages: optimizedMessages,
      tokenEstimate,
      contextWindow: optimizedMessages.length
    };
  }

  /**
   * Estimate token count for messages
   * @param messages - Messages to estimate
   * @returns Estimated token count
   */
  public estimateTokens(messages: Message[]): number {
    let totalTokens = ConversationContextService.SYSTEM_PROMPT_TOKEN_ESTIMATE;

    for (const message of messages) {
      // Rough token estimation: chars/4 + overhead
      const contentTokens = Math.ceil(message.content.length / ConversationContextService.CHARS_PER_TOKEN);
      totalTokens += contentTokens + ConversationContextService.MESSAGE_OVERHEAD_TOKENS;
    }

    return totalTokens;
  }

  /**
   * Reduce messages to fit within token limit
   * @param messages - Messages to reduce
   * @param maxTokens - Maximum token limit
   * @param prioritizeRecent - Whether to prioritize recent messages
   * @returns Reduced messages array
   */
  private reduceTokens(
    messages: Message[], 
    maxTokens: number, 
    prioritizeRecent: boolean
  ): Message[] {
    if (messages.length === 0) return messages;

    let currentTokens = this.estimateTokens(messages);
    let reducedMessages = [...messages];

    while (currentTokens > maxTokens && reducedMessages.length > 1) {
      if (prioritizeRecent) {
        // Remove from the beginning (keep recent messages)
        reducedMessages = reducedMessages.slice(1);
      } else {
        // Remove from the end (keep early context)
        reducedMessages = reducedMessages.slice(0, -1);
      }
      
      currentTokens = this.estimateTokens(reducedMessages);
    }

    return reducedMessages;
  }

  /**
   * Ensure conversation flow makes sense by maintaining user-assistant pairs
   * @param messages - Messages to validate
   * @returns Messages with proper conversation flow
   */
  private ensureConversationFlow(messages: Message[]): Message[] {
    if (messages.length === 0) return messages;

    const validatedMessages: Message[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      // Always include the first message
      if (i === 0) {
        validatedMessages.push(message);
        continue;
      }

      const previousMessage = validatedMessages[validatedMessages.length - 1];
      
      // Avoid consecutive messages from the same role
      if (message.role !== previousMessage.role) {
        validatedMessages.push(message);
      } else if (message.role === 'user') {
        // If we have consecutive user messages, keep the more recent one
        validatedMessages.push(message);
      }
      // Skip consecutive assistant messages (keep the first one)
    }

    return validatedMessages;
  }

  /**
   * Get conversation summary for context preservation
   * @param messages - Messages to summarize
   * @param maxSummaryLength - Maximum summary length
   * @returns Conversation summary
   */
  public getConversationSummary(messages: Message[], maxSummaryLength: number = 200): string {
    if (messages.length === 0) return '';

    const userMessages = messages.filter(msg => msg.role === 'user');
    const topics = new Set<string>();

    // Extract key topics from user messages
    for (const message of userMessages) {
      const words = message.content.toLowerCase().split(/\s+/);
      const keywords = words.filter(word => 
        word.length > 3 && 
        !['what', 'when', 'where', 'how', 'why', 'can', 'could', 'would', 'should'].includes(word)
      );
      
      keywords.slice(0, 3).forEach(keyword => topics.add(keyword));
    }

    const topicList = Array.from(topics).slice(0, 10).join(', ');
    const summary = `Previous conversation covered: ${topicList}`;

    return summary.length > maxSummaryLength 
      ? summary.substring(0, maxSummaryLength - 3) + '...'
      : summary;
  }

  /**
   * Check if context needs optimization
   * @param messages - Current messages
   * @param thresholds - Optimization thresholds
   * @returns Whether optimization is needed
   */
  public needsOptimization(
    messages: Message[], 
    thresholds: { maxMessages?: number; maxTokens?: number } = {}
  ): boolean {
    const {
      maxMessages = CHATBOT_CONFIG.maxMessages,
      maxTokens = CHATBOT_CONFIG.maxTokens * 2
    } = thresholds;

    if (messages.length > maxMessages) return true;
    if (this.estimateTokens(messages) > maxTokens) return true;

    return false;
  }

  /**
   * Get context statistics
   * @param messages - Messages to analyze
   * @returns Context statistics
   */
  public getContextStats(messages: Message[]): {
    messageCount: number;
    userMessages: number;
    assistantMessages: number;
    estimatedTokens: number;
    averageMessageLength: number;
  } {
    const userMessages = messages.filter(msg => msg.role === 'user').length;
    const assistantMessages = messages.filter(msg => msg.role === 'assistant').length;
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const averageMessageLength = messages.length > 0 ? Math.round(totalLength / messages.length) : 0;

    return {
      messageCount: messages.length,
      userMessages,
      assistantMessages,
      estimatedTokens: this.estimateTokens(messages),
      averageMessageLength
    };
  }

  /**
   * Create context-aware message for API with optimization
   * @param messages - Full conversation history
   * @param options - Optimization options
   * @returns Optimized messages for API call
   */
  public prepareForAPI(
    messages: Message[], 
    options: ContextOptimizationOptions = {}
  ): Message[] {
    const context = this.optimizeContext(messages, options);
    return context.messages;
  }
}

// Export singleton instance
export const conversationContextService = ConversationContextService.getInstance();
export default ConversationContextService;