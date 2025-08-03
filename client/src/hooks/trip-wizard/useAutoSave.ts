import { useCallback, useEffect, useMemo, useRef } from "react";
import { TripWizardData } from "@/types/trip-wizard";
import { saveDraft } from "@/lib/trip-wizard/storage";

interface UseAutoSaveProps {
  data: TripWizardData;
  currentStep: number;
  completedSteps: number[];
  enabled?: boolean;
  debounceMs?: number;
}

export const useAutoSave = ({
  data,
  currentStep,
  completedSteps,
  enabled = true,
  debounceMs = 800,
}: UseAutoSaveProps) => {
  const draftIdRef = useRef<string>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>();

  const debouncedSave = useCallback(
    (dataToSave: TripWizardData, step: number, completed: number[]) => {
      if (!enabled) return;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Create new timeout
      timeoutRef.current = setTimeout(() => {
        try {
          // Only save if data has actually changed
          const dataString = JSON.stringify({
            data: dataToSave,
            step,
            completed,
          });

          if (dataString === lastSavedRef.current) {
            return; // No changes to save
          }

          const id = saveDraft(dataToSave, step, completed, draftIdRef.current);
          draftIdRef.current = id;
          lastSavedRef.current = dataString;

          console.debug('Trip wizard draft auto-saved', {
            step,
            completed: completed.length,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.warn('Failed to auto-save trip wizard draft:', error);
        }
      }, debounceMs);
    },
    [enabled, debounceMs]
  );

  // Auto-save when data, step, or completed steps change
  useEffect(() => {
    debouncedSave(data, currentStep, completedSteps);
  }, [data, currentStep, completedSteps, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const forceSave = useCallback(() => {
    if (!enabled) return;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      const id = saveDraft(data, currentStep, completedSteps, draftIdRef.current);
      draftIdRef.current = id;
      lastSavedRef.current = JSON.stringify({
        data,
        step: currentStep,
        completed: completedSteps,
      });

      console.debug('Trip wizard draft force-saved', {
        step: currentStep,
        completed: completedSteps.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to force-save trip wizard draft:', error);
    }
  }, [data, currentStep, completedSteps, enabled]);

  const setDraftId = useCallback((id: string) => {
    draftIdRef.current = id;
  }, []);

  return {
    forceSave,
    setDraftId,
    currentDraftId: draftIdRef.current,
  };
};