import { useState, useEffect, useCallback } from "react";
import { TripWizardDraft } from "@/types/trip-wizard";
import { loadDraft, clearDraft, isDraftRecent, hasDraftProgress, getDraftAge } from "@/lib/trip-wizard/storage";

export const useDraftRecovery = () => {
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState<TripWizardDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkForDraft = async () => {
      setIsLoading(true);
      
      try {
        const draft = loadDraft();
        
        if (!draft) {
          setIsLoading(false);
          return;
        }

        // Only show recovery prompt if:
        // 1. Draft has meaningful progress (not just step 1)
        // 2. Draft is recent (within last 30 minutes)
        // 3. Draft hasn't expired
        const hasProgress = hasDraftProgress(draft);
        const isRecent = isDraftRecent(draft, 30);

        if (hasProgress && isRecent) {
          setRecoveredDraft(draft);
          setShowRecoveryPrompt(true);
        } else if (!isRecent && hasProgress) {
          // Draft is old but has progress - still offer recovery but with different message
          setRecoveredDraft(draft);
          setShowRecoveryPrompt(true);
        } else {
          // Draft has no meaningful progress or is too old - clear it
          clearDraft();
        }
      } catch (error) {
        console.warn('Error checking for draft recovery:', error);
        clearDraft();
      } finally {
        setIsLoading(false);
      }
    };

    checkForDraft();
  }, []);

  const acceptDraft = useCallback(() => {
    setShowRecoveryPrompt(false);
    // Keep the draft for use - don't clear it yet
    return recoveredDraft;
  }, [recoveredDraft]);

  const rejectDraft = useCallback(() => {
    setShowRecoveryPrompt(false);
    setRecoveredDraft(null);
    clearDraft();
    return null;
  }, []);

  const dismissPrompt = useCallback(() => {
    setShowRecoveryPrompt(false);
  }, []);

  const getDraftSummary = useCallback(() => {
    if (!recoveredDraft) return null;

    const { data, currentStep, completedSteps, lastUpdated } = recoveredDraft;
    const age = getDraftAge(recoveredDraft);
    
    const summary = {
      age,
      currentStep,
      completedStepsCount: completedSteps.length,
      hasLocations: !!(data.startLocation && data.endLocation),
      hasDates: !!(data.startDate && data.endDate) || data.flexibleDates,
      hasTransportation: data.transportation.length > 0,
      hasLodging: data.lodging.length > 0,
      hasIntentions: data.intentions.length > 0,
      locationSummary: data.startLocation && data.endLocation 
        ? `${data.startLocation.main_text} → ${data.endLocation.main_text}`
        : null,
    };

    return summary;
  }, [recoveredDraft]);

  const getRecoveryMessage = useCallback(() => {
    if (!recoveredDraft) return "";

    const isRecent = isDraftRecent(recoveredDraft, 30);
    const summary = getDraftSummary();
    
    if (isRecent) {
      return `You have an in-progress trip (${summary?.age}) with ${summary?.completedStepsCount} completed steps. Would you like to continue where you left off?`;
    } else {
      return `You have a saved trip draft from ${summary?.age}. Would you like to continue with this trip or start fresh?`;
    }
  }, [recoveredDraft, getDraftSummary]);

  return {
    showRecoveryPrompt,
    recoveredDraft,
    isLoading,
    acceptDraft,
    rejectDraft,
    dismissPrompt,
    getDraftSummary,
    getRecoveryMessage,
  };
};