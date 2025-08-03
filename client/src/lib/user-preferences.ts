import type { UserPreferences, SuggestedTrip } from "@/types/interests";

const PREFERENCES_KEY = "routewise_user_preferences";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const PREFERENCES_VERSION = "1.1.0"; // For migration purposes
const SYNC_DEBOUNCE_DELAY = 100; // Debounce cross-tab sync

/**
 * Extended user preferences with metadata
 */
interface ExtendedUserPreferences extends UserPreferences {
  version?: string;
  lastModified?: number;
  syncId?: string;
}

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: ExtendedUserPreferences = {
  isFirstVisit: true,
  lastSelectedInterests: [],
  version: PREFERENCES_VERSION,
  lastModified: Date.now(),
  syncId: generateSyncId(),
};

/**
 * Generate unique sync ID for change tracking
 */
function generateSyncId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Enhanced user preferences manager with cross-tab sync and data integrity
 */
export class UserPreferencesManager {
  private syncListeners: Array<(preferences: UserPreferences) => void> = [];
  private lastSyncId = '';
  private syncDebounceTimer: NodeJS.Timeout | null = null;
  private isLocalStorage = typeof window !== 'undefined' && window.localStorage;

  constructor() {
    // Set up cross-tab synchronization
    if (this.isLocalStorage) {
      this.setupCrossTabSync();
    }
  }

  /**
   * Migrate preferences to newer version if needed
   */
  private migratePreferences(preferences: any): ExtendedUserPreferences {
    const version = preferences.version || "1.0.0";
    
    if (version === PREFERENCES_VERSION) {
      return preferences;
    }

    // Migration logic for different versions
    let migrated = { ...preferences };
    
    if (!migrated.version) {
      // Migrate from pre-versioned format
      migrated.version = PREFERENCES_VERSION;
      migrated.lastModified = Date.now();
      migrated.syncId = generateSyncId();
    }

    // Future migrations can be added here
    
    console.info(`Migrated preferences from ${version} to ${PREFERENCES_VERSION}`);
    return migrated;
  }

  /**
   * Validate preferences data structure
   */
  private validatePreferences(preferences: any): boolean {
    if (!preferences || typeof preferences !== 'object') {
      return false;
    }

    // Check required fields
    if (typeof preferences.isFirstVisit !== 'boolean') {
      return false;
    }

    if (!Array.isArray(preferences.lastSelectedInterests)) {
      return false;
    }

    // Validate suggested trips cache if present
    if (preferences.suggestedTripsCache) {
      const cache = preferences.suggestedTripsCache;
      if (!Array.isArray(cache.data) || typeof cache.timestamp !== 'number' || typeof cache.userId !== 'number') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get user preferences from localStorage with migration and validation
   */
  getPreferences(): UserPreferences {
    if (!this.isLocalStorage) {
      return DEFAULT_PREFERENCES;
    }

    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (!stored) {
        const defaultPrefs = { ...DEFAULT_PREFERENCES };
        this.setPreferences(defaultPrefs, false); // Don't trigger sync for default
        return defaultPrefs;
      }

      const parsed = JSON.parse(stored);
      
      // Validate structure
      if (!this.validatePreferences(parsed)) {
        console.warn('Invalid preferences structure, resetting to defaults');
        const defaultPrefs = { ...DEFAULT_PREFERENCES };
        this.setPreferences(defaultPrefs, false);
        return defaultPrefs;
      }

      // Migrate if needed
      const migrated = this.migratePreferences(parsed);
      
      // Clean up expired cache
      if (migrated.suggestedTripsCache) {
        const now = Date.now();
        const cacheAge = now - migrated.suggestedTripsCache.timestamp;
        
        if (cacheAge > CACHE_DURATION) {
          delete migrated.suggestedTripsCache;
          this.setPreferences(migrated, false); // Save cleaned version
        }
      }

      return { ...DEFAULT_PREFERENCES, ...migrated };
    } catch (error) {
      console.error("Failed to load user preferences:", error);
      const defaultPrefs = { ...DEFAULT_PREFERENCES };
      this.setPreferences(defaultPrefs, false);
      return defaultPrefs;
    }
  }

  /**
   * Set up cross-tab synchronization
   */
  private setupCrossTabSync(): void {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === PREFERENCES_KEY && event.newValue) {
        this.handleCrossTabSync(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
  }

  /**
   * Handle synchronization from other tabs
   */
  private handleCrossTabSync(newValue: string): void {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(() => {
      try {
        const newPreferences = JSON.parse(newValue) as ExtendedUserPreferences;
        
        // Avoid infinite sync loops
        if (newPreferences.syncId && newPreferences.syncId !== this.lastSyncId) {
          this.lastSyncId = newPreferences.syncId;
          this.notifySyncListeners(newPreferences);
        }
      } catch (error) {
        console.warn("Failed to parse preferences from storage event:", error);
      }
    }, SYNC_DEBOUNCE_DELAY);
  }

  /**
   * Notify all sync listeners of preference changes
   */
  private notifySyncListeners(preferences: UserPreferences): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(preferences);
      } catch (error) {
        console.error("Error in sync listener:", error);
      }
    });
  }

  /**
   * Save user preferences to localStorage with conflict resolution
   */
  setPreferences(preferences: Partial<UserPreferences>, triggerSync: boolean = true): void {
    if (!this.isLocalStorage) {
      return;
    }

    try {
      // Get current preferences directly from localStorage to avoid circular reference
      let current: ExtendedUserPreferences;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        current = stored ? JSON.parse(stored) : { ...DEFAULT_PREFERENCES };
      } catch {
        current = { ...DEFAULT_PREFERENCES };
      }
      
      const updated: ExtendedUserPreferences = {
        ...current,
        ...preferences,
        lastModified: Date.now(),
        syncId: generateSyncId(),
      };

      // Store sync ID to avoid self-sync
      if (triggerSync) {
        this.lastSyncId = updated.syncId;
      }

      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));

      // Notify listeners if this is a local change
      if (triggerSync) {
        this.notifySyncListeners(updated);
      }
    } catch (error) {
      console.error("Failed to save user preferences:", error);
      
      // Attempt to free up space by clearing cache
      try {
        this.clearCache();
        const current = this.getPreferences() as ExtendedUserPreferences;
        const updated: ExtendedUserPreferences = {
          ...current,
          ...preferences,
          lastModified: Date.now(),
          syncId: generateSyncId(),
        };
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      } catch (retryError) {
        console.error("Failed to save preferences even after clearing cache:", retryError);
      }
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
    const preferences = this.getPreferences() as ExtendedUserPreferences;
    const cache = preferences.suggestedTripsCache;

    const stats = {
      hasCachedTrips: !!cache,
      version: preferences.version,
      lastModified: preferences.lastModified ? new Date(preferences.lastModified).toISOString() : null,
      syncId: preferences.syncId,
      storageSize: this.getStorageSize(),
    };

    if (!cache) {
      return stats;
    }

    const now = Date.now();
    const cacheAge = now - cache.timestamp;
    const isExpired = cacheAge > CACHE_DURATION;

    return {
      ...stats,
      cacheAge: cacheAge,
      isExpired: isExpired,
      userId: cache.userId,
      tripCount: cache.data.length,
      timestamp: new Date(cache.timestamp).toISOString(),
    };
  }

  /**
   * Get storage size for monitoring
   */
  private getStorageSize(): number {
    if (!this.isLocalStorage) return 0;
    
    try {
      const data = localStorage.getItem(PREFERENCES_KEY);
      return data ? new Blob([data]).size : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Add a listener for cross-tab synchronization
   */
  addStorageEventListener(callback: (preferences: UserPreferences) => void): () => void {
    this.syncListeners.push(callback);
    
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Force sync from localStorage (useful for error recovery)
   */
  forceSync(): void {
    if (!this.isLocalStorage) return;
    
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const preferences = JSON.parse(stored) as ExtendedUserPreferences;
        this.lastSyncId = preferences.syncId || '';
        this.notifySyncListeners(preferences);
      }
    } catch (error) {
      console.error("Failed to force sync:", error);
    }
  }

  /**
   * Export preferences for backup/debugging
   */
  exportPreferences(): string {
    const preferences = this.getPreferences();
    return JSON.stringify(preferences, null, 2);
  }

  /**
   * Import preferences from backup (with validation)
   */
  importPreferences(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      if (!this.validatePreferences(parsed)) {
        console.error("Invalid preferences data format");
        return false;
      }

      this.setPreferences(parsed);
      return true;
    } catch (error) {
      console.error("Failed to import preferences:", error);
      return false;
    }
  }

  /**
   * Get storage health status
   */
  getStorageHealth(): {
    isAvailable: boolean;
    canWrite: boolean;
    size: number;
    isHealthy: boolean;
  } {
    const health = {
      isAvailable: this.isLocalStorage,
      canWrite: false,
      size: this.getStorageSize(),
      isHealthy: false,
    };

    if (!this.isLocalStorage) {
      return health;
    }

    // Test write capability
    try {
      const testKey = `${PREFERENCES_KEY}_test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      health.canWrite = true;
    } catch {
      health.canWrite = false;
    }

    health.isHealthy = health.isAvailable && health.canWrite && health.size < 1024 * 1024; // 1MB limit

    return health;
  }
}

/**
 * Singleton instance of the user preferences manager
 */
export const userPreferences = new UserPreferencesManager();

/**
 * Enhanced React hook for reactive preferences with optimistic updates
 */
export function useLocalStoragePreferences() {
  const getPreferences = () => userPreferences.getPreferences();
  
  const setPreferences = (preferences: Partial<UserPreferences>) => {
    userPreferences.setPreferences(preferences, true);
  };

  const addSyncListener = (callback: (preferences: UserPreferences) => void) => {
    return userPreferences.addStorageEventListener(callback);
  };

  const getStorageHealth = () => userPreferences.getStorageHealth();
  
  const exportData = () => userPreferences.exportPreferences();
  
  const importData = (data: string) => userPreferences.importPreferences(data);

  return { 
    getPreferences, 
    setPreferences, 
    addSyncListener,
    getStorageHealth,
    exportData,
    importData
  };
}

/**
 * Legacy utility to sync preferences across browser tabs (backward compatibility)
 * @deprecated Use userPreferences.addStorageEventListener() instead
 */
export function addStorageEventListener(callback: (preferences: UserPreferences) => void) {
  return userPreferences.addStorageEventListener(callback);
}