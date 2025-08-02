import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { interestsApi } from "@/lib/interests-api";
import { userPreferences } from "@/lib/user-preferences";
import { DataTransformer } from "@/lib/data-transformers";
import type { SuggestedTrip, FrontendSuggestedTrip } from "@/types/interests";

/**
 * Query keys for suggested trips
 */
export const SUGGESTED_TRIPS_QUERY_KEYS = {
  all: ["trips", "suggested"] as const,
  user: (userId: number, limit?: number) => 
    ["trips", "suggested", "user", userId, limit] as const,
  trip: (tripId: string, userId?: number) => 
    ["trips", "suggested", "trip", tripId, userId] as const,
};

/**
 * Hook for fetching suggested trips based on user interests
 */
export function useSuggestedTrips(limit: number = 5) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const suggestedTripsQuery = useQuery({
    queryKey: user ? SUGGESTED_TRIPS_QUERY_KEYS.user(user.id, limit) : [],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      // Check cache first
      const cachedTrips = userPreferences.getCachedSuggestedTrips(user.id);
      if (cachedTrips && cachedTrips.length >= limit) {
        return cachedTrips.slice(0, limit);
      }

      // Fetch from API
      const trips = await interestsApi.getSuggestedTrips(user.id, limit);
      
      // Cache the results
      userPreferences.cacheSuggestedTrips(trips, user.id);
      
      return trips;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 15, // 15 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    select: (data: SuggestedTrip[]) => DataTransformer.safeTransformTrips(data),
  });

  // Background refresh function that doesn't show loading state
  const backgroundRefresh = () => {
    if (user) {
      queryClient.prefetchQuery({
        queryKey: SUGGESTED_TRIPS_QUERY_KEYS.user(user.id, limit),
        queryFn: async () => {
          const trips = await interestsApi.getSuggestedTrips(user.id, limit);
          userPreferences.cacheSuggestedTrips(trips, user.id);
          return trips;
        },
        staleTime: 1000 * 60 * 15,
      });
    }
  };

  // Force refresh function
  const forceRefresh = () => {
    if (user) {
      userPreferences.clearCache();
      return queryClient.invalidateQueries({
        queryKey: SUGGESTED_TRIPS_QUERY_KEYS.user(user.id, limit),
      });
    }
  };

  return {
    // Data
    trips: suggestedTripsQuery.data || [],
    
    // States
    isLoading: suggestedTripsQuery.isLoading,
    isError: suggestedTripsQuery.isError,
    error: suggestedTripsQuery.error,
    
    // Actions
    backgroundRefresh,
    forceRefresh,
    
    // Utilities
    isAuthenticated,
    user,
  };
}

/**
 * Hook for fetching a specific suggested trip by ID
 */
export function useSuggestedTrip(tripId: string) {
  const { user } = useAuth();

  const tripQuery = useQuery({
    queryKey: SUGGESTED_TRIPS_QUERY_KEYS.trip(tripId, user?.id),
    queryFn: () => interestsApi.getSuggestedTripById(tripId, user?.id),
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
    select: (data: SuggestedTrip | null) => 
      data ? DataTransformer.safeTransformTrips([data])[0] : null,
  });

  return {
    trip: tripQuery.data,
    isLoading: tripQuery.isLoading,
    isError: tripQuery.isError,
    error: tripQuery.error,
    notFound: tripQuery.data === null && !tripQuery.isLoading,
  };
}

/**
 * Hook for managing suggested trips state and preferences
 */
export function useSuggestedTripsPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Invalidate suggested trips when interests change
   */
  const invalidateOnInterestChange = () => {
    queryClient.invalidateQueries({ 
      queryKey: SUGGESTED_TRIPS_QUERY_KEYS.all 
    });
    userPreferences.clearCache();
  };

  /**
   * Preload suggested trips for better UX
   */
  const preloadSuggestedTrips = (limit: number = 5) => {
    if (user) {
      queryClient.prefetchQuery({
        queryKey: SUGGESTED_TRIPS_QUERY_KEYS.user(user.id, limit),
        queryFn: async () => {
          const trips = await interestsApi.getSuggestedTrips(user.id, limit);
          userPreferences.cacheSuggestedTrips(trips, user.id);
          return trips;
        },
        staleTime: 1000 * 60 * 15,
      });
    }
  };

  /**
   * Get cache statistics for debugging
   */
  const getCacheStats = () => {
    return userPreferences.getCacheStats();
  };

  /**
   * Clear all suggested trips cache
   */
  const clearCache = () => {
    userPreferences.clearCache();
    queryClient.removeQueries({ queryKey: SUGGESTED_TRIPS_QUERY_KEYS.all });
  };

  return {
    invalidateOnInterestChange,
    preloadSuggestedTrips,
    getCacheStats,
    clearCache,
    isAuthenticated: !!user,
    user,
  };
}