export const useFocusManagement = (stepRef: React.RefObject<HTMLElement>) => {
  const focusOnStepChange = useCallback(() => {
    // Focus the main heading of the new step
    const stepElement = stepRef.current;
    if (stepElement) {
      const heading = stepElement.querySelector('h2, h3, [role="heading"]');
      if (heading instanceof HTMLElement) {
        heading.focus();
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [stepRef]);

  return { focusOnStepChange };
};

// Focus indicator styles
const focusStyles = `
    .focus-visible:focus-visible,
    .focus-visible:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    /* Skip to content link */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
      transition: top 0.3s;
    }

    .skip-link:focus {
      top: 6px;
    }
  `;
