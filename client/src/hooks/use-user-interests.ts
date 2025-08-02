import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { interestsApi } from "@/lib/interests-api";
import { userPreferences } from "@/lib/user-preferences";
import {
  extractEnabledInterestNames,
  transformInterestSelectionsToBackend,
  DataTransformer,
} from "@/lib/data-transformers";
import type {
  UserInterest,
  InterestCategory,
  FrontendInterestCategory,
  UpdateUserInterestsRequest,
} from "@/types/interests";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useToast } from "./use-toast";

// Removed debounce utility - using direct calls for better error handling

/**
 * Query keys for React Query
 */
export const INTERESTS_QUERY_KEYS = {
  categories: ["interests", "categories"] as const,
  userInterests: (userId: number) => ["interests", "user", userId] as const,
  allInterests: ["interests"] as const,
};

/**
 * Optimistic update configuration
 */
const OPTIMISTIC_CONFIG = {
  UPDATE_DELAY: 300, // Debounce updates
  ROLLBACK_DELAY: 3000, // Auto-rollback failed updates
  MAX_RETRIES: 2,
} as const;

/**
 * Hook for managing user interests with advanced features
 * - Optimistic updates for instant UI feedback
 * - Intelligent caching and background refresh
 * - Batch operations and debouncing
 * - Comprehensive error handling
 */
export function useUserInterests() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Local state for optimistic updates
  const [optimisticInterests, setOptimisticInterests] = useState<string[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  // Query for interest categories with enhanced caching
  const categoriesQuery = useQuery({
    queryKey: INTERESTS_QUERY_KEYS.categories,
    queryFn: () => interestsApi.getInterestCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (renamed from cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on client errors
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 2;
    },
    select: (data: InterestCategory[]) => {
      try {
        return DataTransformer.safeTransformCategories(data, {
          strict: false,
          logErrors: false, // Reduce noise during development
          useValidPartial: true,
        });
      } catch (error) {
        console.warn('Error transforming categories, using fallback:', error);
        return DataTransformer.safeTransformCategories([], { strict: false });
      }
    },
    meta: {
      errorMessage: "Failed to load interest categories"
    }
  });

  // Query for user's current interests with background refresh
  const userInterestsQuery = useQuery({
    queryKey: user ? INTERESTS_QUERY_KEYS.userInterests(user.id) : [],
    queryFn: () => {
      if (!user) throw new Error("User not authenticated");
      return interestsApi.getUserInterests(user.id);
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 2;
    },
    meta: {
      errorMessage: "Failed to load your interests"
    }
  });

  // Enhanced mutation with optimistic updates
  const updateInterestsMutation = useMutation({
    mutationFn: (data: UpdateUserInterestsRequest) => {
      if (!user) throw new Error("User not authenticated");
      return interestsApi.updateUserInterests(user.id, data);
    },
    onMutate: async (data: UpdateUserInterestsRequest) => {
      if (!user) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: INTERESTS_QUERY_KEYS.userInterests(user.id) 
      });

      // Snapshot previous value for rollback
      const previousInterests = queryClient.getQueryData(
        INTERESTS_QUERY_KEYS.userInterests(user.id)
      );

      // For optimistic updates, we don't need to do complex mapping here
      // The optimistic state is already set in the updateInterests function
      // This avoids the data transformation complexity during mutations

      return { previousInterests };
    },
    onSuccess: (updatedInterests: UserInterest[]) => {
      if (!user) return;

      // Clear optimistic state
      setOptimisticInterests([]);
      setPendingUpdates(new Set());

      // Update cache with real data
      queryClient.setQueryData(
        INTERESTS_QUERY_KEYS.userInterests(user.id),
        updatedInterests
      );

      // Save to localStorage
      const enabledNames = extractEnabledInterestNames(updatedInterests);
      userPreferences.saveSelectedInterests(enabledNames);

      // Background refresh of suggested trips
      queryClient.invalidateQueries({ 
        queryKey: ["trips", "suggested"],
        refetchType: 'none' // Don't show loading state
      });

      toast?.({
        title: "Interests updated",
        description: "Your travel preferences have been saved.",
      });
    },
    onError: (error, variables, context) => {
      if (!user || !context) return;

      // Rollback optimistic updates
      setOptimisticInterests([]);
      setPendingUpdates(new Set());

      if (context.previousInterests) {
        queryClient.setQueryData(
          INTERESTS_QUERY_KEYS.userInterests(user.id),
          context.previousInterests
        );
      }

      console.error("Failed to update user interests:", error);
      toast?.({
        title: "Update failed",
        description: "Failed to save your interests. Please try again.",
        variant: "destructive",
      });
    },
    retry: OPTIMISTIC_CONFIG.MAX_RETRIES,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Removed enableAllMutation - using standard updateInterests flow instead

  // Memoized derived data with optimistic updates
  const availableCategories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data]);
  
  const userInterests = useMemo(() => userInterestsQuery.data || [], [userInterestsQuery.data]);
  
  const enabledInterestNames = useMemo(() => {
    // Use optimistic interests if available, otherwise real data
    if (optimisticInterests.length > 0) {
      return optimisticInterests;
    }
    return extractEnabledInterestNames(userInterests);
  }, [optimisticInterests, userInterests]);

  // Enhanced loading states
  const isLoadingCategories = categoriesQuery.isLoading;
  const isLoadingUserInterests = userInterestsQuery.isLoading;
  const isUpdatingInterests = updateInterestsMutation.isPending;
  const hasOptimisticUpdates = optimisticInterests.length > 0;

  // Error states with enhanced handling
  const categoriesError = categoriesQuery.error;
  const userInterestsError = userInterestsQuery.error;
  const updateError = updateInterestsMutation.error;

  // Removed debouncedUpdate - using direct API calls for better error handling

  /**
   * Update user interests with optimistic updates and debouncing
   */
  const updateInterests = useCallback(async (selectedInterestNames: string[]) => {
    if (!categoriesQuery.data) {
      throw new Error("Interest categories not loaded");
    }

    // Immediately update optimistic state
    setOptimisticInterests(selectedInterestNames);
    userPreferences.saveSelectedInterests(selectedInterestNames);

    // Get the original backend categories data needed for transformation
    const originalCategories = await interestsApi.getInterestCategories();
    
    const backendSelections = transformInterestSelectionsToBackend(
      selectedInterestNames,
      originalCategories
    );

    // Call the API directly instead of using debounced version to avoid stale closure
    await updateInterestsMutation.mutateAsync({
      interests: backendSelections,
    });
  }, [categoriesQuery.data, updateInterestsMutation]);

  /**
   * Toggle a specific interest with optimistic updates
   */
  const toggleInterest = useCallback(async (interestName: string) => {
    const currentInterests = optimisticInterests.length > 0 
      ? optimisticInterests 
      : enabledInterestNames;
    
    const isCurrentlyEnabled = currentInterests.includes(interestName);
    const newSelections = isCurrentlyEnabled
      ? currentInterests.filter(name => name !== interestName)
      : [...currentInterests, interestName];

    // Mark as pending
    setPendingUpdates(prev => new Set(prev).add(interestName));

    try {
      await updateInterests(newSelections);
    } finally {
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(interestName);
        return next;
      });
    }
  }, [optimisticInterests, enabledInterestNames, updateInterests]);

  /**
   * Enable all available interests with optimistic updates
   */
  const enableAllInterests = useCallback(async () => {
    const allInterestNames = availableCategories.map(cat => cat.name);
    
    // Use the standard updateInterests flow for consistency
    await updateInterests(allInterestNames);
  }, [availableCategories, updateInterests]);

  /**
   * Batch update multiple interests efficiently
   */
  const batchUpdateInterests = useCallback(async (
    updates: Array<{ interestName: string; enabled: boolean }>
  ) => {
    const currentInterests = optimisticInterests.length > 0 
      ? optimisticInterests 
      : enabledInterestNames;
    
    let newSelections = [...currentInterests];
    
    updates.forEach(({ interestName, enabled }) => {
      if (enabled && !newSelections.includes(interestName)) {
        newSelections.push(interestName);
      } else if (!enabled) {
        newSelections = newSelections.filter(name => name !== interestName);
      }
    });

    await updateInterests(newSelections);
  }, [optimisticInterests, enabledInterestNames, updateInterests]);

  /**
   * Check if a specific interest is enabled (with optimistic updates)
   */
  const isInterestEnabled = useCallback((interestName: string): boolean => {
    return enabledInterestNames.includes(interestName);
  }, [enabledInterestNames]);

  /**
   * Check if an interest is currently being updated
   */
  const isInterestPending = useCallback((interestName: string): boolean => {
    return pendingUpdates.has(interestName);
  }, [pendingUpdates]);

  /**
   * Refresh user interests data with background refetch
   */
  const refreshUserInterests = useCallback(() => {
    if (user) {
      return queryClient.invalidateQueries({
        queryKey: INTERESTS_QUERY_KEYS.userInterests(user.id),
        refetchType: 'active'
      });
    }
  }, [user, queryClient]);

  /**
   * Preload interests data for better UX
   */
  const preloadInterests = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: INTERESTS_QUERY_KEYS.categories,
      queryFn: () => interestsApi.getInterestCategories(),
      staleTime: 1000 * 60 * 30,
    });

    if (user) {
      queryClient.prefetchQuery({
        queryKey: INTERESTS_QUERY_KEYS.userInterests(user.id),
        queryFn: () => interestsApi.getUserInterests(user.id),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [queryClient, user]);

  /**
   * Background refresh without loading states
   */
  const backgroundRefresh = useCallback(() => {
    if (user) {
      queryClient.refetchQueries({
        queryKey: INTERESTS_QUERY_KEYS.userInterests(user.id),
        type: 'active'
      });
    }
  }, [user, queryClient]);

  /**
   * Reset optimistic state (useful for error recovery)
   */
  const resetOptimisticState = useCallback(() => {
    setOptimisticInterests([]);
    setPendingUpdates(new Set());
  }, []);

  // Auto-prefetch when user becomes available
  useEffect(() => {
    if (user && isAuthenticated) {
      interestsApi.prefetchUserData(user.id);
    }
  }, [user, isAuthenticated]);

  return {
    // Data
    availableCategories,
    userInterests,
    enabledInterestNames,

    // Loading states
    isLoadingCategories,
    isLoadingUserInterests,
    isUpdatingInterests,
    isLoading: isLoadingCategories || isLoadingUserInterests,
    hasOptimisticUpdates,

    // Error states
    categoriesError,
    userInterestsError,
    updateError,
    hasError: !!(categoriesError || userInterestsError || updateError),

    // Actions
    updateInterests,
    toggleInterest,
    enableAllInterests,
    batchUpdateInterests,
    isInterestEnabled,
    isInterestPending,
    refreshUserInterests,
    preloadInterests,
    backgroundRefresh,
    resetOptimisticState,

    // Utilities
    isAuthenticated,
    user,
  };
}