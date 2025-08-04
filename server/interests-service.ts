import { getStorage } from "./storage";
import { cacheService, CacheService } from "./cache-service";
import type { 
  InterestCategory, 
  UserInterest, 
  InsertUserInterest, 
  UpdateUserInterest 
} from "@shared/schema";

export class InterestsService {
  private readonly CATEGORIES_CACHE_DURATION = 60 * 60 * 1000; // 1 hour - categories rarely change
  private readonly USER_INTERESTS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes - user data changes more frequently

  /**
   * Get all available interest categories
   */
  async getInterestCategories(): Promise<InterestCategory[]> {
    const cacheKey = "interests:categories";
    
    // Try to get from cache first
    const cached = await cacheService.get<InterestCategory[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // If not in cache, fetch from storage
    const storage = getStorage();
    const categories = await storage.getAllInterestCategories();
    
    // Store in cache for future requests
    await cacheService.set(cacheKey, categories, this.CATEGORIES_CACHE_DURATION);
    
    return categories;
  }

  /**
   * Get user's current interest preferences
   */
  async getUserInterests(userId: number): Promise<(UserInterest & { category: InterestCategory })[]> {
    const cacheKey = `interests:user:${userId}`;
    
    // Try to get from cache first
    const cached = await cacheService.get<(UserInterest & { category: InterestCategory })[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // If not in cache, fetch from storage
    const storage = getStorage();
    const interests = await storage.getUserInterests(userId);
    
    // Store in cache for future requests
    await cacheService.set(cacheKey, interests, this.USER_INTERESTS_CACHE_DURATION);
    
    return interests;
  }

  /**
   * Update user's interest preferences
   * Supports both enabling all by default or custom selection
   */
  async updateUserInterests(
    userId: number, 
    interests: { categoryId: number; isEnabled: boolean; priority?: number }[]
  ): Promise<(UserInterest & { category: InterestCategory })[]> {
    // Convert to InsertUserInterest format
    const insertInterests: InsertUserInterest[] = interests.map(interest => ({
      userId,
      categoryId: interest.categoryId,
      isEnabled: interest.isEnabled,
      priority: interest.priority || 1
    }));

    // Replace all user interests with new set
    const storage = getStorage();
    await storage.setUserInterests(userId, insertInterests);
    
    // Invalidate user's interests cache
    const cacheKey = `interests:user:${userId}`;
    await cacheService.del(cacheKey);
    
    // Return updated interests with category details
    return this.getUserInterests(userId);
  }

  /**
   * Enable all available interests for a user (default behavior)
   */
  async enableAllInterestsForUser(userId: number): Promise<(UserInterest & { category: InterestCategory })[]> {
    const categories = await this.getInterestCategories(); // Use cached version
    
    const allInterests: InsertUserInterest[] = categories.map(category => ({
      userId,
      categoryId: category.id,
      isEnabled: true,
      priority: 1
    }));

    const storage = getStorage();
    await storage.setUserInterests(userId, allInterests);
    
    // Invalidate user's interests cache
    const cacheKey = `interests:user:${userId}`;
    await cacheService.del(cacheKey);
    
    return this.getUserInterests(userId);
  }

  /**
   * Get interest categories by their names (for mapping POI categories)
   */
  async getInterestCategoriesByNames(names: string[]): Promise<InterestCategory[]> {
    const allCategories = await this.getInterestCategories(); // Use cached version
    return allCategories.filter(cat => names.includes(cat.name));
  }

  /**
   * Check if user has specific interests enabled
   */
  async hasUserInterests(userId: number, categoryNames: string[]): Promise<boolean> {
    const userInterests = await this.getUserInterests(userId);
    const enabledCategoryNames = userInterests
      .filter(ui => ui.isEnabled)
      .map(ui => ui.category.name);
    
    return categoryNames.some(name => enabledCategoryNames.includes(name));
  }

  /**
   * Get user's enabled interest categories for POI filtering
   */
  async getUserEnabledInterestNames(userId: number): Promise<string[]> {
    const userInterests = await this.getUserInterests(userId);
    return userInterests
      .filter(ui => ui.isEnabled)
      .map(ui => ui.category.name);
  }

  /**
   * Toggle a specific interest for a user
   */
  async toggleUserInterest(
    userId: number, 
    categoryId: number, 
    isEnabled: boolean,
    priority?: number
  ): Promise<UserInterest | null> {
    const storage = getStorage();
    const updated = await storage.updateUserInterest(userId, categoryId, {
      isEnabled,
      priority,
      updatedAt: new Date()
    });

    return updated || null;
  }

  /**
   * Map POI categories to interest categories
   */
  getPoiCategoryMapping(): Record<string, string> {
    return {
      'restaurant': 'restaurants',
      'attraction': 'attractions', 
      'park': 'parks',
      'scenic': 'scenic_spots',
      'historic': 'historic_sites',
      'market': 'markets',
      'outdoor': 'outdoor_activities',
      'cultural': 'cultural_sites',
      'shopping': 'shopping',
      'nightlife': 'nightlife'
    };
  }

  /**
   * Filter POIs based on user interests
   */
  filterPoisByUserInterests(pois: any[], userInterestNames: string[]): any[] {
    if (userInterestNames.length === 0) {
      return pois; // If no interests set, return all POIs
    }

    const mapping = this.getPoiCategoryMapping();
    const enabledPoiCategories = Object.keys(mapping)
      .filter(poiCategory => userInterestNames.includes(mapping[poiCategory]));

    return pois.filter(poi => enabledPoiCategories.includes(poi.category));
  }
}

export const interestsService = new InterestsService();