import { useCallback, useRef, useEffect } from "react";
import { focusElement, announceToScreenReader } from "@/lib/trip-wizard/accessibility";

export const useFocusManagement = () => {
  const stepRefs = useRef<Map<number, HTMLElement>>(new Map());
  const previousStepRef = useRef<number>(1);

  const registerStep = useCallback((stepNumber: number, element: HTMLElement | null) => {
    if (element) {
      stepRefs.current.set(stepNumber, element);
    } else {
      stepRefs.current.delete(stepNumber);
    }
  }, []);

  const focusStep = useCallback((stepNumber: number, options?: { smooth?: boolean }) => {
    const stepElement = stepRefs.current.get(stepNumber);
    
    if (stepElement) {
      // Find the main heading or first focusable element
      const heading = stepElement.querySelector('h1, h2, h3, [role="heading"]') as HTMLElement;
      const firstFocusable = stepElement.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      ) as HTMLElement;
      
      const elementToFocus = heading || firstFocusable || stepElement;
      
      // Set tabindex if the element isn't naturally focusable
      if (elementToFocus === heading && !elementToFocus.hasAttribute('tabindex')) {
        elementToFocus.setAttribute('tabindex', '-1');
      }
      
      focusElement(elementToFocus, options);
      
      // Announce step change to screen readers
      if (heading) {
        const stepTitle = heading.textContent || `Step ${stepNumber}`;
        announceToScreenReader(`Now on ${stepTitle}`, 'polite');
      }
    }
  }, []);

  const focusOnStepChange = useCallback((
    newStep: number, 
    options?: { smooth?: boolean }
  ) => {
    // Small delay to ensure the new step is rendered
    setTimeout(() => {
      focusStep(newStep, options);
    }, 100);
  }, [focusStep]);

  const focusFirstError = useCallback((stepNumber?: number) => {
    const targetStep = stepNumber || Array.from(stepRefs.current.keys())[0];
    const stepElement = stepRefs.current.get(targetStep);
    
    if (stepElement) {
      const firstError = stepElement.querySelector(
        '[role="alert"], [aria-invalid="true"], .error, .text-red-600'
      ) as HTMLElement;
      
      if (firstError) {
        focusElement(firstError, { smooth: true });
        announceToScreenReader('Please correct the errors before proceeding', 'assertive');
        return true;
      }
    }
    
    return false;
  }, []);

  const manageFocusOnNavigation = useCallback((
    newStep: number,
    direction: 'forward' | 'backward' = 'forward'
  ) => {
    previousStepRef.current = newStep;
    
    // Focus management with direction-aware announcement
    const directionText = direction === 'forward' ? 'Moving to' : 'Returning to';
    
    setTimeout(() => {
      const stepElement = stepRefs.current.get(newStep);
      if (stepElement) {
        const heading = stepElement.querySelector('h1, h2, h3, [role="heading"]') as HTMLElement;
        if (heading) {
          const stepTitle = heading.textContent || `Step ${newStep}`;
          announceToScreenReader(`${directionText} ${stepTitle}`, 'polite');
        }
      }
      
      focusStep(newStep, { smooth: true });
    }, 150);
  }, [focusStep]);

  const skipToContent = useCallback((stepNumber: number) => {
    const stepElement = stepRefs.current.get(stepNumber);
    
    if (stepElement) {
      const mainContent = stepElement.querySelector(
        '[role="main"], main, .step-content, .wizard-content'
      ) as HTMLElement;
      
      const targetElement = mainContent || stepElement;
      focusElement(targetElement, { smooth: true });
      announceToScreenReader('Skipped to main content', 'polite');
    }
  }, []);

  // Cleanup refs when component unmounts
  useEffect(() => {
    return () => {
      stepRefs.current.clear();
    };
  }, []);

  return {
    registerStep,
    focusStep,
    focusOnStepChange,
    focusFirstError,
    manageFocusOnNavigation,
    skipToContent,
  };
};