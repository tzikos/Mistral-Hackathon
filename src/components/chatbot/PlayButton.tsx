import React, { useRef, useEffect, useState } from 'react';
import { Play, Square, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { Button } from '../ui/button';
import { PlayButtonProps, PlaybackState } from './chatbot.types';
import { 
  isMobileDevice, 
  provideHapticFeedback, 
  getTTSAriaLabel, 
  announceToScreenReader,
  prefersReducedMotion 
} from '../../utils/accessibility-helpers';

/**
 * PlayButton component for text-to-speech functionality
 * Provides play/stop controls with visual state feedback and full accessibility support
 */


export const PlayButton: React.FC<PlayButtonProps> = ({
  messageId,
  text,
  playbackState,
  onPlay,
  onStop,
  disabled = false,
  className = '',
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [justClicked, setJustClicked] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isMobile] = useState(isMobileDevice());
  const [reducedMotion] = useState(prefersReducedMotion());

  // Determine current state
  const isLoading = playbackState?.isLoading || false;
  const isPlaying = playbackState?.isPlaying || false;
  const hasError = playbackState?.error !== null && playbackState?.error !== undefined;
  const isCurrentMessage = playbackState?.messageId === messageId;

  // Announce state changes to screen readers and handle success animation
  useEffect(() => {
    if (!isCurrentMessage) return;

    if (isLoading) {
      announceToScreenReader('Converting text to speech, please wait');
    } else if (isPlaying) {
      announceToScreenReader('Audio playback started. Press Escape or click the stop button to stop playback.');
      // Show success animation when playback starts (respect reduced motion preference)
      if (!reducedMotion) {
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 600);
      }
    } else if (hasError) {
      announceToScreenReader(`Error occurred: ${playbackState?.error}. Click to retry.`, 'assertive');
    }
  }, [isLoading, isPlaying, hasError, isCurrentMessage, playbackState?.error, reducedMotion]);

  // Focus management for accessibility
  useEffect(() => {
    if (isCurrentMessage && hasError && buttonRef.current) {
      // Focus the button when there's an error to help users retry
      buttonRef.current.focus();
    }
  }, [hasError, isCurrentMessage]);

  // Handle click events with animation feedback
  const handleClick = () => {
    if (disabled || isLoading) return;

    // Trigger click animation
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 150);

    if (isPlaying && isCurrentMessage) {
      onStop(messageId);
    } else {
      onPlay(messageId, text);
    }
  };

  // Handle mouse events for hover effects
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Handle touch events for mobile optimization
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) {
      setIsTouched(true);
      // Provide haptic feedback on supported devices
      provideHapticFeedback(10);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isMobile) {
      setIsTouched(false);
      // Prevent the click event from firing twice on mobile
      e.preventDefault();
      // Add slight delay to show touch feedback
      setTimeout(() => {
        if (!disabled && !isLoading) {
          handleClick();
        }
      }, 50);
    }
  };

  const handleTouchCancel = () => {
    if (isMobile) {
      setIsTouched(false);
    }
  };

  // Handle keyboard navigation with enhanced accessibility
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Space and Enter are handled by default button behavior
    // Add Escape key to stop playback
    if (event.key === 'Escape' && isPlaying && isCurrentMessage) {
      event.preventDefault();
      onStop(messageId);
    }
    
    // Add additional keyboard shortcuts for accessibility
    if (event.key === 'p' && event.ctrlKey) {
      event.preventDefault();
      if (!disabled && !isLoading) {
        if (isPlaying && isCurrentMessage) {
          onStop(messageId);
        } else {
          onPlay(messageId, text);
        }
      }
    }
  };

  // Determine button state and appearance with accessibility information
  const getButtonState = () => {
    if (isLoading && isCurrentMessage) {
      return {
        icon: (
          <div className="relative">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin opacity-30" />
          </div>
        ),
        variant: 'outline' as const,
        title: 'Generating speech...',
        ariaLabel: getTTSAriaLabel(true, false, false),
        ariaPressed: false,
        ariaExpanded: undefined,
        role: 'button',
      };
    }

    if (isPlaying && isCurrentMessage) {
      return {
        icon: (
          <div className="relative">
            <Square className="h-4 w-4" aria-hidden="true" />
            <Volume2 className={`absolute -top-1 -right-1 h-2 w-2 text-blue-500 ${showSuccessAnimation ? 'animate-bounce' : ''}`} aria-hidden="true" />
          </div>
        ),
        variant: 'default' as const,
        title: 'Stop playback',
        ariaLabel: getTTSAriaLabel(false, true, false),
        ariaPressed: true,
        ariaExpanded: true,
        role: 'button',
      };
    }

    if (hasError && isCurrentMessage) {
      return {
        icon: <AlertCircle className="h-4 w-4 animate-pulse" aria-hidden="true" />,
        variant: 'destructive' as const,
        title: `Error: ${playbackState?.error}. Click to retry.`,
        ariaLabel: getTTSAriaLabel(false, false, true, playbackState?.error),
        ariaPressed: false,
        ariaExpanded: undefined,
        role: 'button',
      };
    }

    return {
      icon: (
        <Play 
          className={`h-4 w-4 transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`} 
          aria-hidden="true" 
        />
      ),
      variant: 'outline' as const,
      title: 'Play audio',
      ariaLabel: getTTSAriaLabel(false, false, false),
      ariaPressed: false,
      ariaExpanded: false,
      role: 'button',
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        size="sm"
        variant={buttonState.variant}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        onTouchCancel={isMobile ? handleTouchCancel : undefined}
        disabled={disabled || (isLoading && isCurrentMessage)}
        title={buttonState.title}
        aria-label={buttonState.ariaLabel}
        aria-pressed={buttonState.ariaPressed}
        aria-expanded={buttonState.ariaExpanded}
        aria-describedby={hasError && isCurrentMessage ? `error-${messageId}` : undefined}
        aria-live="polite"
        aria-atomic="true"
        role={buttonState.role}
        tabIndex={disabled ? -1 : 0}
        data-tooltip={buttonState.title}
        className={`
          min-w-[2.5rem] h-9 p-2 relative overflow-hidden
          transition-all duration-300 ease-out
          touch-manipulation select-none
          ${(isHovered || isTouched) && !disabled && !isLoading ? 'scale-105 shadow-lg' : 'scale-100'}
          ${justClicked ? 'scale-95' : ''}
          ${isTouched ? 'bg-opacity-80' : ''}
          focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          focus:outline-none focus:ring-opacity-50
          focus-visible:ring-2 focus-visible:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${hasError && isCurrentMessage ? 'animate-pulse shadow-red-200 shadow-lg' : ''}
          ${isPlaying && isCurrentMessage ? 'ring-2 ring-blue-400 ring-opacity-50 shadow-blue-200 shadow-lg' : ''}
          ${showSuccessAnimation ? 'animate-pulse' : ''}
          sm:min-w-[2rem] sm:h-8 sm:p-1.5
          ${className}
        `}
        data-testid={`play-button-${messageId}`}
        data-state={
          isLoading && isCurrentMessage ? 'loading' :
          isPlaying && isCurrentMessage ? 'playing' :
          hasError && isCurrentMessage ? 'error' : 'idle'
        }
      >
        {buttonState.icon}
        
        {/* Animated background for loading state */}
        {isLoading && isCurrentMessage && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100 to-transparent animate-pulse opacity-30 rounded" />
        )}
        
        {/* Success ripple effect */}
        {showSuccessAnimation && (
          <div className="absolute inset-0 rounded bg-green-200 animate-ping opacity-20" />
        )}
        
        {/* Hidden text for screen readers */}
        <span className="sr-only">
          {isLoading && isCurrentMessage ? 'Loading' :
           isPlaying && isCurrentMessage ? 'Playing' :
           hasError && isCurrentMessage ? 'Error' : 'Play'}
        </span>
      </Button>
      
      {/* Progress indicator for playing state */}
      {isPlaying && isCurrentMessage && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full">
          <div className="h-full bg-blue-600 rounded-full animate-pulse" />
        </div>
      )}
      
      {/* Error description for screen readers */}
      {hasError && isCurrentMessage && (
        <div id={`error-${messageId}`} className="sr-only">
          Text-to-speech conversion failed: {playbackState?.error}. 
          This may be due to network issues or service unavailability. 
          Click the button to try again.
        </div>
      )}
      
      {/* Skip link for screen readers */}
      {isPlaying && isCurrentMessage && (
        <div className="sr-only">
          <a 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onStop(messageId);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStop(messageId);
              }
            }}
          >
            Skip audio playback
          </a>
        </div>
      )}
    </div>
  );
};

export default PlayButton;