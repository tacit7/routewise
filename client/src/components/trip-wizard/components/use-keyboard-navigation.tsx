export const useKeyboardNavigation = (
  currentStep: number,
  totalSteps: number,
  onNext: () => void,
  onPrevious: () => void,
  canProceed: boolean
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Arrow keys for step navigation
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "ArrowRight":
            if (canProceed && currentStep < totalSteps) {
              event.preventDefault();
              onNext();
            }
            break;
          case "ArrowLeft":
            if (currentStep > 1) {
              event.preventDefault();
              onPrevious();
            }
            break;
        }
      }

      // Escape to cancel/exit
      if (event.key === "Escape") {
        event.preventDefault();
        // Show exit confirmation
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, totalSteps, onNext, onPrevious, canProceed]);
};
