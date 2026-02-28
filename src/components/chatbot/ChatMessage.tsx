import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessageProps } from './chatbot.types';
import PlayButton from './PlayButton';

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isUser, 
  playbackState, 
  onPlayTTS, 
  onStopTTS 
}) => {
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] sm:max-w-[85%] md:max-w-xs lg:max-w-md px-3 py-2 sm:px-4 rounded-lg transition-all duration-300 ease-out ${
        isUser 
          ? 'bg-blue-600 text-white ml-auto' 
          : `bg-gray-100 text-gray-900 mr-auto ${
              playbackState?.messageId === message.id && playbackState?.isPlaying 
                ? 'ring-2 ring-blue-200 ring-opacity-50 shadow-lg shadow-blue-100' 
                : ''
            }`
      }`}>
        <div className="text-sm leading-relaxed">
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <ReactMarkdown 
              className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 text-left"
              components={{
                // Custom styling for markdown elements with left alignment
                p: ({ children }) => <p className="mb-2 last:mb-0 text-left">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-left">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-left">{children}</ol>,
                li: ({ children }) => <li className="text-sm text-left">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-200 text-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2 text-left">
                    {children}
                  </pre>
                ),
                h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-left">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mb-2 text-left">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-left">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-gray-300 pl-2 italic mb-2 text-left">
                    {children}
                  </blockquote>
                ),
                a: ({ children, href }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        
        {/* Play button for bot messages with content */}
        {!isUser && message.content.trim() && onPlayTTS && onStopTTS && (
          <div className="flex items-center justify-between mt-2 gap-2 transition-all duration-300 ease-out">
            <div className={`text-xs flex-1 transition-colors duration-200 ${
              playbackState?.messageId === message.id && playbackState?.isPlaying 
                ? 'text-blue-600 font-medium' 
                : isUser ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span className="block sm:inline">
                {formatTimestamp(message.timestamp)}
              </span>
              {playbackState?.messageId === message.id && playbackState?.isPlaying && (
                <span className="ml-1 inline-block w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="flex-shrink-0">
              <PlayButton
                messageId={message.id}
                text={message.content}
                playbackState={playbackState}
                onPlay={onPlayTTS}
                onStop={onStopTTS}
                className="transition-transform duration-200 ease-out"
              />
            </div>
          </div>
        )}
        
        {/* Timestamp only for user messages or bot messages without TTS */}
        {(isUser || !message.content.trim() || !onPlayTTS || !onStopTTS) && (
          <div className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTimestamp(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;