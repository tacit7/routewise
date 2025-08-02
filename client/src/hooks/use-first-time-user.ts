import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth-context";
import { userPreferences } from "@/lib/user-preferences";
import { useUserInterests } from "./use-user-interests";
import { useSuggestedTripsPreferences } from "./use-suggested-trips";

/**
 * Hook for managing first-time user experience
 */
export function useFirstTimeUser() {
  const { user, isAuthenticated } = useAuth();
  const { enabledInterestNames, enableAllInterests, isLoadingUserInterests } = useUserInterests();
  const { preloadSuggestedTrips } = useSuggestedTripsPreferences();
  
  const [isFirstVisit, setIsFirstVisit] = useState(() => userPreferences.isFirstVisit());
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user has any interests set up
  const hasInterestsConfigured = enabledInterestNames.length > 0;

  // Determine if we should show the first-time user experience
  const shouldShowFirstTimeExperience = 
    isAuthenticated && 
    isFirstVisit && 
    !hasInterestsConfigured &&
    !isLoadingUserInterests &&
    !hasCompletedOnboarding;

  /**
   * Complete the first-time user onboarding
   */
  const completeOnboarding = useCallback(async () => {
    try {
      // Mark first visit as complete
      userPreferences.markFirstVisitComplete();
      setIsFirstVisit(false);
      setHasCompletedOnboarding(true);

      // Don't automatically enable all interests - let user choose manually
      // This allows for the desired behavior where all interests start unmarked

      // Preload suggested trips for better UX (only if interests are configured)
      if (hasInterestsConfigured) {
        preloadSuggestedTrips();
      }

    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      throw error;
    }
  }, [hasInterestsConfigured, preloadSuggestedTrips]);

  /**
   * Skip onboarding and mark as completed
   */
  const skipOnboarding = useCallback(() => {
    userPreferences.markFirstVisitComplete();
    setIsFirstVisit(false);
    setHasCompletedOnboarding(true);
  }, []);

  /**
   * Reset first-time user state (for testing/debugging)
   */
  const resetFirstTimeUser = useCallback(() => {
    userPreferences.clearAllPreferences();
    setIsFirstVisit(true);
    setHasCompletedOnboarding(false);
  }, []);

  // Auto-complete onboarding if user already has interests configured
  useEffect(() => {
    if (isAuthenticated && hasInterestsConfigured && isFirstVisit) {
      userPreferences.markFirstVisitComplete();
      setIsFirstVisit(false);
    }
  }, [isAuthenticated, hasInterestsConfigured, isFirstVisit]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const unsubscribe = userPreferences.addStorageEventListener?.((preferences) => {
      setIsFirstVisit(preferences.isFirstVisit);
    });

    return unsubscribe;
  }, []);

  return {
    // State
    isFirstVisit,
    hasInterestsConfigured,
    shouldShowFirstTimeExperience,
    hasCompletedOnboarding,

    // Actions
    completeOnboarding,
    skipOnboarding,
    resetFirstTimeUser,

    // Utilities
    isAuthenticated,
    user,
  };
}

/**
 * Hook for managing onboarding flow state
 */
export function useOnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'interests' | 'complete'>('welcome');
  const [isAnimating, setIsAnimating] = useState(false);
  const { shouldShowFirstTimeExperience, completeOnboarding } = useFirstTimeUser();

  /**
   * Move to next step in onboarding
   */
  const nextStep = useCallback(() => {
    setIsAnimating(true);
    
    setTimeout(() => {
      if (currentStep === 'welcome') {
        setCurrentStep('interests');
      } else if (currentStep === 'interests') {
        setCurrentStep('complete');
      }
      setIsAnimating(false);
    }, 300);
  }, [currentStep]);

  /**
   * Complete the entire onboarding flow
   */
  const finishOnboarding = useCallback(async () => {
    try {
      await completeOnboarding();
      setCurrentStep('complete');
    } catch (error) {
      console.error("Failed to finish onboarding:", error);
    }
  }, [completeOnboarding]);

  /**
   * Reset onboarding flow
   */
  const resetFlow = useCallback(() => {
    setCurrentStep('welcome');
    setIsAnimating(false);
  }, []);

  return {
    // State
    currentStep,
    isAnimating,
    shouldShowOnboarding: shouldShowFirstTimeExperience,

    // Actions
    nextStep,
    finishOnboarding,
    resetFlow,
    setCurrentStep,
  };
}

/**
 * Hook for first-visit animations and effects
 */
export function useFirstVisitAnimations() {
  const { isFirstVisit } = useFirstTimeUser();
  const [hasSeenAnimation, setHasSeenAnimation] = useState(false);

  const shouldShowAnimation = isFirstVisit && !hasSeenAnimation;

  const markAnimationSeen = useCallback(() => {
    setHasSeenAnimation(true);
  }, []);

  return {
    shouldShowAnimation,
    markAnimationSeen,
    isFirstVisit,
  };
}