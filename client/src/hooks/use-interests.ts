/**
 * Unified interests hooks export
 * Provides a comprehensive API for all interests-related functionality
 */

export {
  useUserInterests,
  INTERESTS_QUERY_KEYS,
} from "./use-user-interests";

export {
  useSuggestedTrips,
  useSuggestedTrip,
  useSuggestedTripsPreferences,
  SUGGESTED_TRIPS_QUERY_KEYS,
} from "./use-suggested-trips";

export {
  useFirstTimeUser,
  useOnboardingFlow,
  useFirstVisitAnimations,
} from "./use-first-time-user";

// Re-export common types for convenience
export type {
  InterestCategory,
  UserInterest,
  SuggestedTrip,
  FrontendInterestCategory,
  FrontendSuggestedTrip,
  UpdateUserInterestsRequest,
  UserPreferences,
} from "@/types/interests";

// Re-export utilities
export { userPreferences } from "@/lib/user-preferences";
export { interestsApi } from "@/lib/interests-api";
export { DataTransformer } from "@/lib/data-transformers";