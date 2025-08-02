import { apiRequest } from "./queryClient";
import type {
  InterestCategory,
  UserInterest,
  SuggestedTrip,
  UpdateUserInterestsRequest,
  InterestsAPI
} from "@/types/interests";

/**
 * API client configuration
 */
const API_CONFIG = {
  DEFAULT_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: 1000 * 60 * 5, // 5 minutes
  RATE_LIMIT_WINDOW: 1000 * 60 * 5, // 5 minutes
  MAX_REQUESTS_PER_WINDOW: 10,
} as const;

/**
 * Rate limiting tracker
 */
class RateLimiter {
  private requests: number[] = [];

  canMakeRequest(): boolean {
    const now = Date.now();
    const windowStart = now - API_CONFIG.RATE_LIMIT_WINDOW;
    
    // Clean old requests
    this.requests = this.requests.filter(time => time > windowStart);
    
    return this.requests.length < API_CONFIG.MAX_REQUESTS_PER_WINDOW;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    return API_CONFIG.RATE_LIMIT_WINDOW - (Date.now() - oldestRequest);
  }
}

/**
 * Memory cache for API responses
 */
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = API_CONFIG.CACHE_TTL): void {
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return JSON.parse(JSON.stringify(entry.data)); // Deep clone
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

/**
 * Enhanced API request with timeout support
 */
async function enhancedApiRequest(
  method: string,
  url: string,
  data?: unknown,
  timeout: number = API_CONFIG.DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await apiRequest(method, url, data);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new InterestsAPIError(`Request timeout after ${timeout}ms`, 408, url);
    }
    throw error;
  }
}

/**
 * Interests API client implementation
 * Enhanced with comprehensive error handling, retry logic, and caching
 */
class InterestsAPIClient implements InterestsAPI {
  private rateLimiter = new RateLimiter();
  private cache = new MemoryCache();
  private pendingRequests = new Map<string, Promise<any>>();
  /**
   * Generic request handler with caching, deduplication, and retry logic
   */
  private async makeRequest<T>(
    cacheKey: string,
    requestFn: () => Promise<T>,
    cacheTtl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Check for pending request to avoid duplication
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Check rate limiting
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.getTimeUntilNextRequest();
      throw new InterestsAPIError(
        `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
        429
      );
    }

    const promise = retryApiCall(requestFn, API_CONFIG.MAX_RETRIES, API_CONFIG.RETRY_DELAY);
    this.pendingRequests.set(cacheKey, promise);

    try {
      this.rateLimiter.recordRequest();
      const result = await promise;
      
      // Cache successful results
      this.cache.set(cacheKey, result, cacheTtl);
      
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Get all available interest categories with enhanced caching
   */
  async getInterestCategories(): Promise<InterestCategory[]> {
    return this.makeRequest(
      'categories',
      async () => {
        const response = await enhancedApiRequest("GET", "/api/interests/categories");
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new InterestsAPIError("Invalid response format for categories", 500);
        }
        
        return data;
      },
      1000 * 60 * 30 // Cache for 30 minutes
    );
  }

  /**
   * Get user's current interest preferences with caching
   */
  async getUserInterests(userId: number): Promise<UserInterest[]> {
    if (!userId || userId <= 0) {
      throw new InterestsAPIError("Invalid user ID provided", 400);
    }

    return this.makeRequest(
      `user-interests-${userId}`,
      async () => {
        const response = await enhancedApiRequest("GET", `/api/users/${userId}/interests`);
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new InterestsAPIError("Invalid response format for user interests", 500);
        }
        
        return data;
      },
      1000 * 60 * 5 // Cache for 5 minutes
    );
  }

  /**
   * Update user's interest preferences with validation and cache invalidation
   */
  async updateUserInterests(
    userId: number, 
    data: UpdateUserInterestsRequest
  ): Promise<UserInterest[]> {
    if (!userId || userId <= 0) {
      throw new InterestsAPIError("Invalid user ID provided", 400);
    }

    if (!data || (typeof data !== 'object')) {
      throw new InterestsAPIError("Invalid update data provided", 400);
    }

    // Validate the request data
    if (data.interests && !Array.isArray(data.interests)) {
      throw new InterestsAPIError("Interests must be an array", 400);
    }

    if (data.interests) {
      for (const interest of data.interests) {
        if (!interest.categoryId || typeof interest.isEnabled !== 'boolean') {
          throw new InterestsAPIError("Invalid interest format", 400);
        }
      }
    }

    try {
      const response = await enhancedApiRequest("PUT", `/api/users/${userId}/interests`, data);
      const responseData = await response.json();
      
      if (!Array.isArray(responseData)) {
        throw new InterestsAPIError("Invalid response format for updated interests", 500);
      }

      // Invalidate cached user interests and suggested trips
      this.cache.clear(); // Clear all cache for now - could be more selective
      
      return responseData;
    } catch (error) {
      if (error instanceof InterestsAPIError) {
        throw error;
      }
      
      console.error("Failed to update user interests:", error);
      throw new InterestsAPIError(
        "Failed to update user interests. Please try again.",
        500,
        `/api/users/${userId}/interests`
      );
    }
  }

  /**
   * Get suggested trips based on user interests with enhanced caching
   */
  async getSuggestedTrips(userId: number, limit: number = 5): Promise<SuggestedTrip[]> {
    if (!userId || userId <= 0) {
      throw new InterestsAPIError("Invalid user ID provided", 400);
    }

    if (limit < 1 || limit > 20) {
      throw new InterestsAPIError("Limit must be between 1 and 20", 400);
    }

    return this.makeRequest(
      `suggested-trips-${userId}-${limit}`,
      async () => {
        const params = new URLSearchParams({ limit: limit.toString() });
        const response = await enhancedApiRequest("GET", `/api/trips/suggested?${params}`);
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new InterestsAPIError("Invalid response format for suggested trips", 500);
        }

        return data;
      },
      1000 * 60 * 15 // Cache for 15 minutes
    );
  }

  /**
   * Get a specific suggested trip by ID with caching
   */
  async getSuggestedTripById(tripId: string, userId?: number): Promise<SuggestedTrip | null> {
    if (!tripId || typeof tripId !== 'string') {
      throw new InterestsAPIError("Invalid trip ID provided", 400);
    }

    return this.makeRequest(
      `trip-${tripId}-${userId || 'anonymous'}`,
      async () => {
        try {
          const response = await enhancedApiRequest("GET", `/api/trips/suggested/${tripId}`);
          const data = await response.json();
          
          if (data && typeof data === 'object') {
            return data;
          }
          
          throw new InterestsAPIError("Invalid trip data received", 500);
        } catch (error) {
          if (error instanceof Error && error.message.includes("404")) {
            return null;
          }
          throw error;
        }
      },
      1000 * 60 * 30 // Cache for 30 minutes
    );
  }

  /**
   * Enable all available interests for a user (convenience method)
   */
  async enableAllInterests(userId: number): Promise<UserInterest[]> {
    return this.updateUserInterests(userId, { enableAll: true });
  }

  /**
   * Toggle a specific interest for a user (convenience method)
   */
  async toggleInterest(
    userId: number, 
    categoryId: number, 
    isEnabled: boolean,
    priority: number = 1
  ): Promise<UserInterest[]> {
    if (!userId || userId <= 0) {
      throw new InterestsAPIError("Invalid user ID provided", 400);
    }

    if (!categoryId || categoryId <= 0) {
      throw new InterestsAPIError("Invalid category ID provided", 400);
    }

    // Get current interests first
    const currentInterests = await this.getUserInterests(userId);
    
    // Update the specific interest
    const updatedInterests = currentInterests.map(interest => {
      if (interest.categoryId === categoryId) {
        return { categoryId, isEnabled, priority };
      }
      return { 
        categoryId: interest.categoryId, 
        isEnabled: interest.isEnabled, 
        priority: interest.priority 
      };
    });

    // If the interest doesn't exist, add it
    if (!currentInterests.find(i => i.categoryId === categoryId)) {
      updatedInterests.push({ categoryId, isEnabled, priority });
    }

    return this.updateUserInterests(userId, { interests: updatedInterests });
  }

  /**
   * Batch update multiple interests efficiently
   */
  async batchUpdateInterests(
    userId: number,
    updates: Array<{ categoryId: number; isEnabled: boolean; priority?: number }>
  ): Promise<UserInterest[]> {
    if (!userId || userId <= 0) {
      throw new InterestsAPIError("Invalid user ID provided", 400);
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new InterestsAPIError("Updates array is required", 400);
    }

    const interests = updates.map(update => ({
      categoryId: update.categoryId,
      isEnabled: update.isEnabled,
      priority: update.priority || 1
    }));

    return this.updateUserInterests(userId, { interests });
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    const keys = Array.from(this.cache['cache'].keys());
    return {
      size: keys.length,
      keys
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Prefetch user data for better UX
   */
  async prefetchUserData(userId: number): Promise<void> {
    try {
      await Promise.allSettled([
        this.getInterestCategories(),
        this.getUserInterests(userId),
        this.getSuggestedTrips(userId, 5)
      ]);
    } catch (error) {
      console.warn("Failed to prefetch some user data:", error);
    }
  }
}

/**
 * Singleton instance of the interests API client
 */
export const interestsApi = new InterestsAPIClient();

/**
 * Error types for better error handling
 */
export class InterestsAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = "InterestsAPIError";
  }
}

/**
 * Enhanced error handler for API requests
 */
export function handleInterestsAPIError(error: unknown, endpoint: string): never {
  if (error instanceof Response) {
    throw new InterestsAPIError(
      `API request failed: ${error.statusText}`,
      error.status,
      endpoint
    );
  }

  if (error instanceof Error) {
    throw new InterestsAPIError(
      `API request failed: ${error.message}`,
      undefined,
      endpoint
    );
  }

  throw new InterestsAPIError(
    "Unknown API error occurred",
    undefined,
    endpoint
  );
}

/**
 * Retry wrapper for API calls with exponential backoff
 */
export async function retryApiCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}