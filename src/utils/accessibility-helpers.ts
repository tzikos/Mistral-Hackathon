// Accessibility helper utilities for TTS functionality

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         isTouchDevice();
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

/**
 * Check if element is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  const focusableElements = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];
  
  return focusableElements.some(selector => element.matches(selector));
};

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors));
};

/**
 * Trap focus within a container
 */
export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Check if element is visible to screen readers
 */
export const isVisibleToScreenReader = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    element.hasAttribute('aria-hidden') ||
    element.getAttribute('aria-hidden') === 'true'
  );
};

/**
 * Provide haptic feedback on supported devices
 */
export const provideHapticFeedback = (pattern: number | number[] = 10): void => {
  if ('vibrate' in navigator && isMobileDevice()) {
    navigator.vibrate(pattern);
  }
};

/**
 * Check if user has enabled high contrast mode
 */
export const isHighContrastMode = (): boolean => {
  // Check for Windows high contrast mode
  if (window.matchMedia('(-ms-high-contrast: active)').matches) {
    return true;
  }
  
  // Check for other high contrast preferences
  if (window.matchMedia('(prefers-contrast: high)').matches) {
    return true;
  }
  
  return false;
};

/**
 * Get appropriate ARIA label for TTS button state
 */
export const getTTSAriaLabel = (
  isLoading: boolean,
  isPlaying: boolean,
  hasError: boolean,
  errorMessage?: string
): string => {
  if (isLoading) {
    return 'Converting text to speech, please wait';
  }
  
  if (isPlaying) {
    return 'Stop audio playback. Audio is currently playing. Press Escape to stop.';
  }
  
  if (hasError) {
    return `Error occurred: ${errorMessage || 'Unknown error'}. Click to retry text-to-speech conversion.`;
  }
  
  return 'Play audio version of this message using text-to-speech. Press Ctrl+P for keyboard shortcut.';
};

/**
 * Validate color contrast ratio (simplified check)
 */
export const hasGoodContrast = (foreground: string, background: string): boolean => {
  // This is a simplified check - in a real implementation, you'd calculate the actual contrast ratio
  // For now, we'll just check if the colors are different enough
  return foreground !== background;
};

/**
 * Check if animations should be disabled
 */
export const shouldDisableAnimations = (): boolean => {
  return prefersReducedMotion();
};

/**
 * Get optimal touch target size for current device
 */
export const getOptimalTouchTargetSize = (): { width: number; height: number } => {
  if (isMobileDevice()) {
    // iOS Human Interface Guidelines recommend 44x44 points minimum
    return { width: 44, height: 44 };
  }
  
  // Desktop can use smaller targets
  return { width: 32, height: 32 };
};

/**
 * Check if element meets accessibility guidelines
 */
export const checkAccessibility = (element: HTMLElement): {
  hasAriaLabel: boolean;
  hasFocusIndicator: boolean;
  hasGoodContrast: boolean;
  isKeyboardAccessible: boolean;
} => {
  const hasAriaLabel = !!(
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.getAttribute('title')
  );
  
  const hasFocusIndicator = element.matches(':focus-visible') || 
                           element.style.outline !== 'none';
  
  const isKeyboardAccessible = isFocusable(element);
  
  return {
    hasAriaLabel,
    hasFocusIndicator,
    hasGoodContrast: true, // Simplified for this implementation
    isKeyboardAccessible
  };
};