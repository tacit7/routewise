import { apiRequest } from "./queryClient";
import type {
  InterestCategory,
  UserInterest,
  SuggestedTrip,
  UpdateUserInterestsRequest,
  InterestsAPI
} from "@/types/interests";

/**
 * Interests API client implementation
 * Provides type-safe API access for all interests-related endpoints
 */
class InterestsAPIClient implements InterestsAPI {
  /**
   * Get all available interest categories
   */
  async getInterestCategories(): Promise<InterestCategory[]> {
    try {
      const response = await apiRequest("GET", "/api/interests/categories");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch interest categories:", error);
      throw new Error("Failed to fetch interest categories");
    }
  }

  /**
   * Get user's current interest preferences
   */
  async getUserInterests(userId: number): Promise<UserInterest[]> {
    try {
      const response = await apiRequest("GET", `/api/users/${userId}/interests`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch user interests:", error);
      throw new Error("Failed to fetch user interests");
    }
  }

  /**
   * Update user's interest preferences
   */
  async updateUserInterests(
    userId: number, 
    data: UpdateUserInterestsRequest
  ): Promise<UserInterest[]> {
    try {
      const response = await apiRequest("PUT", `/api/users/${userId}/interests`, data);
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error("Failed to update user interests:", error);
      throw new Error("Failed to update user interests");
    }
  }

  /**
   * Get suggested trips based on user interests
   */
  async getSuggestedTrips(userId: number, limit: number = 5): Promise<SuggestedTrip[]> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      const response = await apiRequest("GET", `/api/trips/suggested?${params}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch suggested trips:", error);
      throw new Error("Failed to fetch suggested trips");
    }
  }

  /**
   * Get a specific suggested trip by ID
   */
  async getSuggestedTripById(tripId: string, userId?: number): Promise<SuggestedTrip | null> {
    try {
      const response = await apiRequest("GET", `/api/trips/suggested/${tripId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch suggested trip:", error);
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw new Error("Failed to fetch suggested trip");
    }
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