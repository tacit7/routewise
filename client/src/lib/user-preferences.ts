import type { UserPreferences, SuggestedTrip } from "@/types/interests";

const PREFERENCES_KEY = "routewise_user_preferences";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  isFirstVisit: true,
  lastSelectedInterests: [],
};

/**
 * User preferences manager for localStorage
 */
export class UserPreferencesManager {
  /**
   * Get user preferences from localStorage
   */
  getPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (!stored) {
        return DEFAULT_PREFERENCES;
      }

      const parsed = JSON.parse(stored) as UserPreferences;
      
      // Validate and clean up expired cache
      if (parsed.suggestedTripsCache) {
        const now = Date.now();
        const cacheAge = now - parsed.suggestedTripsCache.timestamp;
        
        if (cacheAge > CACHE_DURATION) {
          delete parsed.suggestedTripsCache;
        }
      }

      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch (error) {
      console.warn("Failed to load user preferences:", error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Save user preferences to localStorage
   */
  setPreferences(preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save user preferences:", error);
    }
  }

  /**
   * Check if this is the user's first visit
   */
  isFirstVisit(): boolean {
    return this.getPreferences().isFirstVisit;
  }

  /**
   * Mark that the user has completed their first visit
   */
  markFirstVisitComplete(): void {
    this.setPreferences({ isFirstVisit: false });
  }

  /**
   * Get last selected interests
   */
  getLastSelectedInterests(): string[] {
    return this.getPreferences().lastSelectedInterests;
  }

  /**
   * Save user's interest selections
   */
  saveSelectedInterests(interests: string[]): void {
    this.setPreferences({ lastSelectedInterests: interests });
  }

  /**
   * Cache suggested trips data
   */
  cacheSuggestedTrips(trips: SuggestedTrip[], userId: number): void {
    this.setPreferences({
      suggestedTripsCache: {
        data: trips,
        timestamp: Date.now(),
        userId,
      },
    });
  }

  /**
   * Get cached suggested trips if valid
   */
  getCachedSuggestedTrips(userId: number): SuggestedTrip[] | null {
    const preferences = this.getPreferences();
    const cache = preferences.suggestedTripsCache;

    if (!cache || cache.userId !== userId) {
      return null;
    }

    const now = Date.now();
    const cacheAge = now - cache.timestamp;

    if (cacheAge > CACHE_DURATION) {
      return null;
    }

    return cache.data;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    const preferences = this.getPreferences();
    delete preferences.suggestedTripsCache;
    this.setPreferences(preferences);
  }

  /**
   * Clear all preferences (reset to defaults)
   */
  clearAllPreferences(): void {
    try {
      localStorage.removeItem(PREFERENCES_KEY);
    } catch (error) {
      console.warn("Failed to clear user preferences:", error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    const preferences = this.getPreferences();
    const cache = preferences.suggestedTripsCache;

    if (!cache) {
      return { hasCachedTrips: false };
    }

    const now = Date.now();
    const cacheAge = now - cache.timestamp;
    const isExpired = cacheAge > CACHE_DURATION;

    return {
      hasCachedTrips: true,
      cacheAge: cacheAge,
      isExpired: isExpired,
      userId: cache.userId,
      tripCount: cache.data.length,
      timestamp: new Date(cache.timestamp).toISOString(),
    };
  }
}

/**
 * Singleton instance of the user preferences manager
 */
export const userPreferences = new UserPreferencesManager();

/**
 * Hook for reactive preferences (to be used with React state)
 */
export function useLocalStoragePreferences() {
  const getPreferences = () => userPreferences.getPreferences();
  
  const setPreferences = (preferences: Partial<UserPreferences>) => {
    userPreferences.setPreferences(preferences);
    // Trigger storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: PREFERENCES_KEY,
      newValue: JSON.stringify(userPreferences.getPreferences()),
    }));
  };

  return { getPreferences, setPreferences };
}

/**
 * Utility to sync preferences across browser tabs
 */
export function addStorageEventListener(callback: (preferences: UserPreferences) => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === PREFERENCES_KEY && event.newValue) {
      try {
        const newPreferences = JSON.parse(event.newValue) as UserPreferences;
        callback(newPreferences);
      } catch (error) {
        console.warn("Failed to parse preferences from storage event:", error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}