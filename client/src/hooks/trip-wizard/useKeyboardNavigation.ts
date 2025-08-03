import { useEffect, useCallback } from "react";

interface UseKeyboardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onExit?: () => void;
  canProceed: boolean;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onExit,
  canProceed,
  enabled = true,
}: UseKeyboardNavigationProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input field
    const target = event.target as HTMLElement;
    const isInputElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
                          target.contentEditable === 'true';
    
    if (isInputElement) return;

    // Handle keyboard shortcuts
    switch (event.key) {
      case 'ArrowRight':
        // Ctrl/Cmd + Right Arrow: Next step
        if ((event.ctrlKey || event.metaKey) && canProceed && currentStep < totalSteps) {
          event.preventDefault();
          onNext();
        }
        break;

      case 'ArrowLeft':
        // Ctrl/Cmd + Left Arrow: Previous step
        if ((event.ctrlKey || event.metaKey) && currentStep > 1) {
          event.preventDefault();
          onPrevious();
        }
        break;

      case 'Enter':
        // Enter: Next step (if not in an input and can proceed)
        if (canProceed && currentStep < totalSteps && !isInputElement) {
          event.preventDefault();
          onNext();
        }
        break;

      case 'Escape':
        // Escape: Exit wizard
        if (onExit) {
          event.preventDefault();
          onExit();
        }
        break;

      case '?':
        // Question mark: Show help (could be implemented later)
        if (event.shiftKey) {
          event.preventDefault();
          // Could show keyboard shortcuts help modal
          console.log('Keyboard shortcuts help requested');
        }
        break;
    }
  }, [currentStep, totalSteps, onNext, onPrevious, onExit, canProceed, enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  // Return help text for keyboard shortcuts
  const getKeyboardShortcuts = useCallback(() => {
    return [
      { keys: ['Ctrl', '→'], description: 'Next step' },
      { keys: ['Ctrl', '←'], description: 'Previous step' },
      { keys: ['Enter'], description: 'Proceed to next step' },
      { keys: ['Esc'], description: 'Exit wizard' },
      { keys: ['Shift', '?'], description: 'Show keyboard shortcuts' },
    ];
  }, []);

  return {
    getKeyboardShortcuts,
  };
};