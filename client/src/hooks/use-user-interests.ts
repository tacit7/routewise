import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { interestsApi } from "@/lib/interests-api";
import { userPreferences } from "@/lib/user-preferences";
import {
  transformInterestCategories,
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

/**
 * Query keys for React Query
 */
export const INTERESTS_QUERY_KEYS = {
  categories: ["interests", "categories"] as const,
  userInterests: (userId: number) => ["interests", "user", userId] as const,
  allInterests: ["interests"] as const,
};

/**
 * Hook for managing user interests with TanStack Query
 */
export function useUserInterests() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Query for interest categories
  const categoriesQuery = useQuery({
    queryKey: INTERESTS_QUERY_KEYS.categories,
    queryFn: () => interestsApi.getInterestCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    select: (data: InterestCategory[]) => DataTransformer.safeTransformCategories(data),
  });

  // Query for user's current interests
  const userInterestsQuery = useQuery({
    queryKey: user ? INTERESTS_QUERY_KEYS.userInterests(user.id) : [],
    queryFn: () => {
      if (!user) throw new Error("User not authenticated");
      return interestsApi.getUserInterests(user.id);
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
  });

  // Mutation for updating user interests
  const updateInterestsMutation = useMutation({
    mutationFn: (data: UpdateUserInterestsRequest) => {
      if (!user) throw new Error("User not authenticated");
      return interestsApi.updateUserInterests(user.id, data);
    },
    onSuccess: (updatedInterests: UserInterest[]) => {
      // Update cache
      if (user) {
        queryClient.setQueryData(
          INTERESTS_QUERY_KEYS.userInterests(user.id),
          updatedInterests
        );
      }

      // Save to localStorage
      const enabledNames = extractEnabledInterestNames(updatedInterests);
      userPreferences.saveSelectedInterests(enabledNames);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["trips", "suggested"] });
    },
    onError: (error) => {
      console.error("Failed to update user interests:", error);
    },
  });

  // Mutation for enabling all interests
  const enableAllMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("User not authenticated");
      return interestsApi.enableAllInterests(user.id);
    },
    onSuccess: (updatedInterests: UserInterest[]) => {
      // Update cache
      if (user) {
        queryClient.setQueryData(
          INTERESTS_QUERY_KEYS.userInterests(user.id),
          updatedInterests
        );
      }

      // Save to localStorage
      const enabledNames = extractEnabledInterestNames(updatedInterests);
      userPreferences.saveSelectedInterests(enabledNames);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["trips", "suggested"] });
    },
  });

  // Derived data
  const availableCategories = categoriesQuery.data || [];
  const userInterests = userInterestsQuery.data || [];
  const enabledInterestNames = extractEnabledInterestNames(userInterests);

  // Loading states
  const isLoadingCategories = categoriesQuery.isLoading;
  const isLoadingUserInterests = userInterestsQuery.isLoading;
  const isUpdatingInterests = updateInterestsMutation.isPending;

  // Error states
  const categoriesError = categoriesQuery.error;
  const userInterestsError = userInterestsQuery.error;
  const updateError = updateInterestsMutation.error;

  /**
   * Update user interests with frontend interest names
   */
  const updateInterests = async (selectedInterestNames: string[]) => {
    if (!categoriesQuery.data) {
      throw new Error("Interest categories not loaded");
    }

    const backendSelections = transformInterestSelectionsToBackend(
      selectedInterestNames,
      categoriesQuery.data
    );

    await updateInterestsMutation.mutateAsync({
      interests: backendSelections,
    });
  };

  /**
   * Toggle a specific interest
   */
  const toggleInterest = async (interestName: string) => {
    const isCurrentlyEnabled = enabledInterestNames.includes(interestName);
    const newSelections = isCurrentlyEnabled
      ? enabledInterestNames.filter(name => name !== interestName)
      : [...enabledInterestNames, interestName];

    await updateInterests(newSelections);
  };

  /**
   * Enable all available interests
   */
  const enableAllInterests = async () => {
    await enableAllMutation.mutateAsync();
  };

  /**
   * Check if a specific interest is enabled
   */
  const isInterestEnabled = (interestName: string): boolean => {
    return enabledInterestNames.includes(interestName);
  };

  /**
   * Refresh user interests data
   */
  const refreshUserInterests = () => {
    if (user) {
      return queryClient.invalidateQueries({
        queryKey: INTERESTS_QUERY_KEYS.userInterests(user.id),
      });
    }
  };

  /**
   * Preload interests data when user becomes available
   */
  const preloadInterests = () => {
    queryClient.prefetchQuery({
      queryKey: INTERESTS_QUERY_KEYS.categories,
      queryFn: () => interestsApi.getInterestCategories(),
      staleTime: 1000 * 60 * 30,
    });
  };

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

    // Error states
    categoriesError,
    userInterestsError,
    updateError,
    hasError: !!(categoriesError || userInterestsError || updateError),

    // Actions
    updateInterests,
    toggleInterest,
    enableAllInterests,
    isInterestEnabled,
    refreshUserInterests,
    preloadInterests,

    // Utilities
    isAuthenticated,
    user,
  };
}