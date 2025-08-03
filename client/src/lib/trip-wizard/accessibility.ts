export const stepAriaLabels = {
  1: {
    title: "Select your trip type",
    description: "Choose between road trip, flight-based travel, or combination trip",
    instructions: "Use arrow keys or Tab to navigate options, Space or Enter to select"
  },
  2: {
    title: "Enter start and destination locations",
    description: "Specify where your journey begins and ends, with optional stops along the way",
    instructions: "Type to search for locations, use arrow keys to select from suggestions"
  },
  3: {
    title: "Choose your travel dates",
    description: "Select when you want to start and end your trip, or mark as flexible",
    instructions: "Use date picker or type dates directly, check flexible option if dates are not fixed"
  },
  4: {
    title: "Select transportation methods",
    description: "Choose how you'll get around during your trip",
    instructions: "Select multiple options if needed, use Tab to navigate and Space to toggle"
  },
  5: {
    title: "Choose lodging preferences",
    description: "Select where you'd like to stay and your budget range",
    instructions: "Select multiple lodging types and adjust budget slider"
  },
  6: {
    title: "Select trip intentions",
    description: "Tell us what kind of experience you're looking for",
    instructions: "Choose multiple tags that describe your ideal trip"
  },
  7: {
    title: "Special needs and accessibility",
    description: "Let us know about any special requirements for your trip",
    instructions: "Fill out any applicable options and add notes if needed"
  }
};

export const getStepDescription = (stepNumber: number): string => {
  return stepAriaLabels[stepNumber as keyof typeof stepAriaLabels]?.description || "";
};

export const getStepInstructions = (stepNumber: number): string => {
  return stepAriaLabels[stepNumber as keyof typeof stepAriaLabels]?.instructions || "";
};

export const announceStepChange = (stepNumber: number, title: string): void => {
  const message = `Step ${stepNumber}: ${title}. ${getStepInstructions(stepNumber)}`;
  announceToScreenReader(message);
};

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only absolute -left-[10000px] w-[1px] h-[1px] overflow-hidden';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

export const focusElement = (element: HTMLElement, options?: { smooth?: boolean }): void => {
  if (!element) return;
  
  element.focus();
  
  if (options?.smooth) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start',
      inline: 'nearest'
    });
  }
};

export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

export const getAccessibleButtonProps = (isPressed?: boolean) => ({
  'aria-pressed': isPressed,
  'role': 'button',
  'tabIndex': 0,
});

export const getAccessibleFormFieldProps = (
  fieldId: string,
  error?: string,
  description?: string,
  required?: boolean
) => {
  const describedBy = [
    description && `${fieldId}-description`,
    error && `${fieldId}-error`
  ].filter(Boolean).join(' ');

  return {
    'id': fieldId,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': !!error,
    'aria-required': required,
  };
};