import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatbotContainerProps, ChatbotState, ErrorState, PlaybackState } from './chatbot.types';
import { chatbotService } from '../../services/chatbot-service';
import SessionStorageService from '../../services/session-storage-service';
import { textToSpeechService } from '../../services/text-to-speech-service';
import { audioManager } from '../../services/audio-manager';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { RefreshCw, AlertCircle, ChevronDown } from 'lucide-react';

const ChatbotContainer: React.FC<ChatbotContainerProps> = ({ 
  className = '', 
  maxHeight = '400px' 
}) => {
  // Responsive height calculation
  const getResponsiveHeight = () => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 640; // sm breakpoint
      return isMobile ? '350px' : maxHeight;
    }
    return maxHeight;
  };

  const [containerHeight, setContainerHeight] = useState(getResponsiveHeight);

  // Update height on window resize
  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(getResponsiveHeight());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [maxHeight]);
  // State management for messages and loading
  const [state, setState] = useState<ChatbotState>({
    messages: [],
    isLoading: false,
    error: null
  });

  // TTS playback state management
  const [playbackStates, setPlaybackStates] = useState<Map<string, PlaybackState>>(new Map());

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Generate unique message ID
  const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add message to conversation
  const addMessage = (content: string, role: 'user' | 'assistant'): Message => {
    const newMessage: Message = {
      id: generateMessageId(),
      content,
      role,
      timestamp: new Date()
    };

    setState(prevState => ({
      ...prevState,
      messages: [...prevState.messages, newMessage]
    }));

    return newMessage;
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    // Mark that this is user-initiated interaction (not initial load)
    setIsInitialLoad(false);
    setHasUserInteracted(true);
    
    // Add user message immediately
    addMessage(content, 'user');

    // Set loading state
    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null
    }));

    try {
      // Get current messages for context
      const currentMessages = [...state.messages, {
        id: generateMessageId(),
        content,
        role: 'user' as const,
        timestamp: new Date()
      }];

      // Send to chatbot service
      const response = await chatbotService.sendMessage(currentMessages);

      if (response.success && response.data) {
        // Add assistant response
        addMessage(response.data, 'assistant');
      } else if (response.error) {
        // Handle error
        setState(prevState => ({
          ...prevState,
          error: response.error || null
        }));
      }
    } catch (error) {
      // Handle unexpected errors
      const errorState: ErrorState = {
        type: 'network',
        message: 'An unexpected error occurred',
        retryable: true
      };
      
      setState(prevState => ({
        ...prevState,
        error: errorState
      }));
    } finally {
      // Clear loading state
      setState(prevState => ({
        ...prevState,
        isLoading: false
      }));
    }
  };

  // Handle retry for failed messages
  const handleRetry = () => {
    if (state.messages.length > 0) {
      const lastUserMessage = [...state.messages]
        .reverse()
        .find(msg => msg.role === 'user');
      
      if (lastUserMessage) {
        handleSendMessage(lastUserMessage.content);
      }
    }
  };

  // Clear error state
  const clearError = () => {
    setState(prevState => ({
      ...prevState,
      error: null
    }));
  };

  // Clear conversation history
  const clearConversation = () => {
    setState(prevState => ({
      ...prevState,
      messages: [],
      error: null
    }));
    SessionStorageService.clearMessages();
    
    // Stop any playing audio and clear playback states
    audioManager.stopCurrent();
    setPlaybackStates(new Map());
  };

  // Handle TTS play request
  const handlePlayTTS = async (messageId: string, text: string) => {
    // Update state to loading
    setPlaybackStates(prev => new Map(prev.set(messageId, {
      isPlaying: false,
      isLoading: true,
      error: null,
      messageId
    })));

    try {
      // Generate speech
      const result = await textToSpeechService.generateSpeech(text);
      
      if (result.success && result.audioData) {
        try {
          // Play audio
          await audioManager.playAudio(result.audioData, messageId);
          
          // Update state to playing
          setPlaybackStates(prev => new Map(prev.set(messageId, {
            isPlaying: true,
            isLoading: false,
            error: null,
            messageId
          })));

          // Set up audio end listener to reset state
          const checkAudioEnd = () => {
            if (!audioManager.isPlaying(messageId)) {
              setPlaybackStates(prev => {
                const newStates = new Map(prev);
                newStates.delete(messageId);
                return newStates;
              });
            } else {
              // Check again in 100ms
              setTimeout(checkAudioEnd, 100);
            }
          };
          
          // Start checking for audio end
          setTimeout(checkAudioEnd, 100);
          
        } catch (audioError) {
          // Handle audio playback errors
          const errorMessage = audioError instanceof Error 
            ? `Audio playback failed: ${audioError.message}`
            : 'Failed to play audio';
            
          setPlaybackStates(prev => new Map(prev.set(messageId, {
            isPlaying: false,
            isLoading: false,
            error: errorMessage,
            messageId
          })));
        }
      } else {
        // Handle TTS generation error
        const errorMessage = result.error 
          ? textToSpeechService.getUserFriendlyErrorMessage(result.error)
          : 'Failed to generate speech';
          
        setPlaybackStates(prev => new Map(prev.set(messageId, {
          isPlaying: false,
          isLoading: false,
          error: errorMessage,
          messageId
        })));
      }
    } catch (error) {
      // Handle unexpected errors
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        // Provide more specific error messages based on error type
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error - please check your connection and try again';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out - please try again';
        } else if (error.message.includes('audio')) {
          errorMessage = 'Audio playback error - please try again';
        } else {
          errorMessage = error.message;
        }
      }
        
      setPlaybackStates(prev => new Map(prev.set(messageId, {
        isPlaying: false,
        isLoading: false,
        error: errorMessage,
        messageId
      })));
      
      // Log error for debugging (sanitized)
      console.error('TTS error for message', messageId, ':', error);
    }
  };

  // Handle TTS stop request
  const handleStopTTS = (messageId: string) => {
    // Stop audio playback
    audioManager.stopCurrent();
    
    // Clear playback state
    setPlaybackStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(messageId);
      return newStates;
    });
  };

  // Handle TTS retry (when user clicks on error state)
  const handleTTSRetry = (messageId: string, text: string) => {
    // Clear the error state first
    setPlaybackStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(messageId);
      return newStates;
    });
    
    // Retry the TTS request
    handlePlayTTS(messageId, text);
  };

  // Performance monitoring - log context stats periodically
  useEffect(() => {
    if (state.messages.length > 0 && state.messages.length % 10 === 0) {
      const stats = chatbotService.getContextStats(state.messages);
      console.log('Conversation stats:', stats);
      
      // Check storage usage
      const storageInfo = chatbotService.getStorageInfo();
      if (storageInfo.percentage > 80) {
        console.warn('Storage usage high:', storageInfo);
      }
    }
  }, [state.messages.length]);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    // Only scroll if not on initial load, messages container exists, and user has interacted
    if (!isInitialLoad && messagesContainerRef.current && hasUserInteracted) {
      // Use scrollTop instead of scrollIntoView to prevent page scrolling
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Check if user has scrolled up from bottom
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // Handle scroll events to detect if user scrolled up
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setIsUserScrolledUp(!isAtBottom);
    }
  };

  // Effect for auto-scrolling when messages change (only if user hasn't scrolled up and not on initial load)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  useEffect(() => {
    // Only auto-scroll if:
    // 1. Not on initial load
    // 2. User hasn't scrolled up
    // 3. User has interacted with the chatbot (sent a message)
    if (!isUserScrolledUp && !isInitialLoad && hasUserInteracted) {
      scrollToBottom();
    }
  }, [state.messages, state.isLoading, isUserScrolledUp, isInitialLoad, hasUserInteracted]);

  // Session storage for conversation persistence
  useEffect(() => {
    // Check if we should clear old session (1 hour default)
    const wasCleared = chatbotService.clearOldConversations(60);
    if (wasCleared) {
      console.log('Cleared old conversation session');
      // Mark initial load as complete immediately if no messages to restore
      setTimeout(() => {
        setIsInitialLoad(false);
      }, 500);
      return;
    }

    // Load messages from session storage on mount
    const savedMessages = SessionStorageService.loadMessages();
    if (savedMessages.length > 0) {
      setState(prevState => ({
        ...prevState,
        messages: savedMessages
      }));

      // Log restoration info
      const stats = chatbotService.getContextStats(savedMessages);
      console.log('Restored conversation:', stats);
    }
    
    // Mark initial load as complete after a longer delay to ensure no auto-scroll
    setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);
  }, []);

  // Save messages to session storage when they change
  useEffect(() => {
    if (state.messages.length > 0) {
      const saveSuccess = SessionStorageService.saveMessages(state.messages);
      if (!saveSuccess) {
        console.warn('Failed to save conversation to session storage');
      }
    }
  }, [state.messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioManager.cleanup();
    };
  }, []);

  // Render error message
  const renderError = () => {
    if (!state.error) return null;

    const userFriendlyMessage = chatbotService.getUserFriendlyErrorMessage(state.error);
    const isRetryable = chatbotService.isUserRetryable(state.error);

    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{userFriendlyMessage}</p>
            {isRetryable && (
              <div className="mt-2 flex space-x-2">
                <Button
                  onClick={handleRetry}
                  size="sm"
                  variant="outline"
                  className="text-red-700 border-red-300 hover:bg-red-50"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  onClick={clearError}
                  size="sm"
                  variant="ghost"
                  className="text-red-700 hover:bg-red-50"
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`w-full ${className} relative`} style={{ maxHeight: containerHeight }}>
      <div className="flex flex-col h-full">
        {/* Messages area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 scroll-smooth"
          style={{ maxHeight: `calc(${containerHeight} - 80px)` }}
          onScroll={handleScroll}
        >
          {/* Welcome message */}
          {state.messages.length === 0 && !state.isLoading && (
            <div className="text-center text-gray-500 py-8 px-2">
              <p className="text-sm sm:text-base">
                Hi! I'm here to answer questions about Dimitris's professional experience.
              </p>
              <p className="text-xs sm:text-sm mt-2">
                Ask me about his work, education, or skills!
              </p>
            </div>
          )}

          {/* Clear conversation button (only show when there are messages) */}
          {state.messages.length > 0 && (
            <div className="flex justify-center mb-2">
              <Button
                onClick={clearConversation}
                size="sm"
                variant="ghost"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear conversation
              </Button>
            </div>
          )}

          {/* Error display */}
          {renderError()}

          {/* Messages */}
          {state.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isUser={message.role === 'user'}
              playbackState={playbackStates.get(message.id)}
              onPlayTTS={handlePlayTTS}
              onStopTTS={handleStopTTS}
            />
          ))}

          {/* Typing indicator */}
          <TypingIndicator visible={state.isLoading} />

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {isUserScrolledUp && (
          <div className="absolute bottom-16 sm:bottom-20 right-2 sm:right-4 z-10">
            <Button
              onClick={() => {
                // Force scroll to bottom using scrollTop to prevent page scrolling
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTo({
                    top: messagesContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                  });
                }
                setIsUserScrolledUp(false);
                setHasUserInteracted(true);
              }}
              size="sm"
              variant="secondary"
              className="rounded-full shadow-lg hover:shadow-xl transition-shadow h-8 w-8 p-0"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={state.isLoading}
          placeholder="Ask me about Dimitris's experience..."
        />
      </div>
    </Card>
  );
};

export default ChatbotContainer;