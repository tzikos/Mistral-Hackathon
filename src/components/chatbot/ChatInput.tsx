import React, { useState, KeyboardEvent } from 'react';
import { ChatInputProps } from './chatbot.types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send } from 'lucide-react';

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
  placeholder = "Ask me about Dimitris's experience..."
}) => {
  const [message, setMessage] = useState('');
  const maxLength = 200; // Character limit

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && isMessageValid) {
      onSendMessage(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  const isMessageValid = message.trim().length > 0 && message.trim().length <= maxLength;

  return (
    <div className="border-t bg-white p-4">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-12"
            maxLength={maxLength}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
            {message.length}/{maxLength}
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={disabled || !isMessageValid}
          size="sm"
          className="px-3"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Character limit warning */}
      {message.length > maxLength * 0.8 && (
        <div className="text-xs text-gray-500 mt-1">
          {message.length}/{maxLength} characters
        </div>
      )}
    </div>
  );
};

export default ChatInput;