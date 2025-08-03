import { useCallback, useRef } from "react";
import { announceToScreenReader } from "@/lib/trip-wizard/accessibility";

export const useScreenReaderAnnouncements = () => {
  const lastAnnouncementRef = useRef<string>("");
  const announcementTimeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite',
    preventDuplicates = true
  ) => {
    // Prevent duplicate announcements
    if (preventDuplicates && message === lastAnnouncementRef.current) {
      return;
    }

    // Clear any pending timeout
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }

    // Throttle announcements to prevent overwhelming screen readers
    announcementTimeoutRef.current = setTimeout(() => {
      announceToScreenReader(message, priority);
      lastAnnouncementRef.current = message;
    }, priority === 'assertive' ? 100 : 300);
  }, []);

  const announceStepChange = useCallback((
    stepNumber: number, 
    stepTitle: string, 
    totalSteps: number
  ) => {
    const message = `Step ${stepNumber} of ${totalSteps}: ${stepTitle}`;
    announce(message, 'polite');
  }, [announce]);

  const announceProgress = useCallback((
    currentStep: number, 
    totalSteps: number, 
    completedSteps: number
  ) => {
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    const message = `Progress: ${completedSteps} of ${totalSteps} steps completed, ${percentage}% done`;
    announce(message, 'polite');
  }, [announce]);

  const announceValidationError = useCallback((
    fieldName: string, 
    errorMessage: string
  ) => {
    const message = `Error in ${fieldName}: ${errorMessage}`;
    announce(message, 'assertive', false); // Don't prevent duplicates for errors
  }, [announce]);

  const announceValidationSuccess = useCallback((stepTitle: string) => {
    const message = `${stepTitle} completed successfully`;
    announce(message, 'polite');
  }, [announce]);

  const announceFormSubmission = useCallback((status: 'submitting' | 'success' | 'error') => {
    const messages = {
      submitting: 'Submitting your trip plan, please wait',
      success: 'Trip plan submitted successfully',
      error: 'Error submitting trip plan, please try again'
    };
    
    const priority = status === 'error' ? 'assertive' : 'polite';
    announce(messages[status], priority);
  }, [announce]);

  const announceDraftSaved = useCallback(() => {
    announce('Your progress has been saved automatically', 'polite');
  }, [announce]);

  const announceDraftRecovered = useCallback((stepNumber: number) => {
    const message = `Previous trip draft recovered, continuing from step ${stepNumber}`;
    announce(message, 'polite');
  }, [announce]);

  const announceSkipAction = useCallback((actionDescription: string) => {
    const message = `Skipped: ${actionDescription}`;
    announce(message, 'polite');
  }, [announce]);

  const announceHelp = useCallback((helpText: string) => {
    announce(`Help: ${helpText}`, 'polite');
  }, [announce]);

  const announceKeyboardShortcut = useCallback((shortcut: string, action: string) => {
    const message = `Keyboard shortcut: ${shortcut} for ${action}`;
    announce(message, 'polite');
  }, [announce]);

  // Clear any pending timeouts on cleanup
  const cleanup = useCallback(() => {
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
  }, []);

  return {
    announce,
    announceStepChange,
    announceProgress,
    announceValidationError,
    announceValidationSuccess,
    announceFormSubmission,
    announceDraftSaved,
    announceDraftRecovered,
    announceSkipAction,
    announceHelp,
    announceKeyboardShortcut,
    cleanup,
  };
};