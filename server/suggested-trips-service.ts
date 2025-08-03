import { getStorage } from "./storage";
import { interestsService } from "./interests-service";
import { GooglePlacesService } from "./google-places";
import type { Poi, InsertPoi } from "@shared/schema";

export interface SuggestedTrip {
  id: string;
  title: string;
  description: string;
  startCity: string;
  endCity: string;
  estimatedDuration: string;
  estimatedDistance: string;
  matchingInterests: string[];
  pois: Poi[];
  score: number; // 0-100 based on interest matching
  imageUrl?: string;
}

export class SuggestedTripsService {
  private placesService: GooglePlacesService | null = null;

  constructor(placesService?: GooglePlacesService) {
    this.placesService = placesService || null;
  }

  /**
   * Generate suggested trips based on user's interests
   */
  async generateSuggestedTrips(userId: number, limit: number = 5): Promise<SuggestedTrip[]> {
    try {
      const userInterests = await interestsService.getUserEnabledInterestNames(userId);
      
      if (userInterests.length === 0) {
        // If no interests set, return popular general trips
        return this.getPopularTrips(limit);
      }

      // Get base trip templates
      const tripTemplates = this.getTripTemplates();
      
      // Score and filter trips based on user interests
      const scoredTrips = await Promise.all(
        tripTemplates.map(async (template) => {
          const score = this.calculateInterestScore(template.categories, userInterests);
          if (score < 30) return null; // Filter out low-scoring trips
          
          const pois = await this.getRelevantPois(template, userInterests);
          const matchingInterests = this.getMatchingInterests(template.categories, userInterests);
          
          // Remove categories property and return SuggestedTrip
          const { categories, ...templateWithoutCategories } = template;
          return {
            ...templateWithoutCategories,
            score,
            pois,
            matchingInterests
          };
        })
      );

      // Filter out null results and sort by score
      const validTrips = scoredTrips
        .filter((trip): trip is SuggestedTrip => trip !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return validTrips;
    } catch (error) {
      console.error("Error generating suggested trips:", error);
      return this.getPopularTrips(limit);
    }
  }

  /**
   * Get popular trips when no user interests are available
   */
  private getPopularTrips(limit: number): SuggestedTrip[] {
    const popularTrips = this.getTripTemplates()
      .slice(0, limit)
      .map(template => {
        const { categories, ...templateWithoutCategories } = template;
        return {
          ...templateWithoutCategories,
          score: 75, // Default good score
          pois: [],
          matchingInterests: []
        };
      });

    return popularTrips;
  }

  /**
   * Get trip templates with predefined routes and categories
   */
  private getTripTemplates(): (Omit<SuggestedTrip, 'score' | 'pois' | 'matchingInterests'> & { categories: string[] })[] {
    return [
      {
        id: 'austin-san-antonio',
        title: 'Texas Hill Country Adventure',
        description: 'Explore the beautiful Hill Country between Austin and San Antonio',
        startCity: 'Austin',
        endCity: 'San Antonio',
        estimatedDuration: '3-4 hours',
        estimatedDistance: '80 miles',
        categories: ['restaurants', 'scenic_spots', 'historic_sites', 'outdoor_activities'],
        imageUrl: 'https://images.unsplash.com/photo-1534330980078-e5f9e68a1ac1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
      },
      {
        id: 'los-angeles-san-francisco',
        title: 'California Coast Classic',
        description: 'Scenic coastal drive along the famous Pacific Coast Highway',
        startCity: 'Los Angeles',
        endCity: 'San Francisco',
        estimatedDuration: '6-8 hours',
        estimatedDistance: '380 miles',
        categories: ['scenic_spots', 'restaurants', 'attractions', 'outdoor_activities'],
        imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
      },
      {
        id: 'denver-aspen',
        title: 'Rocky Mountain High',
        description: 'Mountain adventure through Colorado\'s stunning landscapes',
        startCity: 'Denver',
        endCity: 'Aspen',
        estimatedDuration: '4-5 hours',
        estimatedDistance: '160 miles',
        categories: ['outdoor_activities', 'scenic_spots', 'parks'],
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
      },
      {
        id: 'new-orleans-nashville',
        title: 'Southern Music & Culture Trail',
        description: 'Experience the rich musical heritage and culture of the South',
        startCity: 'New Orleans',
        endCity: 'Nashville',
        estimatedDuration: '5-6 hours',
        estimatedDistance: '300 miles',
        categories: ['cultural_sites', 'restaurants', 'nightlife', 'historic_sites'],
        imageUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
      },
      {
        id: 'miami-key-west',
        title: 'Florida Keys Paradise',
        description: 'Tropical island hopping through the beautiful Florida Keys',
        startCity: 'Miami',
        endCity: 'Key West',
        estimatedDuration: '4-5 hours',
        estimatedDistance: '160 miles',
        categories: ['outdoor_activities', 'restaurants', 'scenic_spots', 'attractions'],
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
      },
      {
        id: 'boston-new-york',
        title: 'Northeast Urban Explorer',
        description: 'Historic cities and cultural landmarks of the Northeast',
        startCity: 'Boston',
        endCity: 'New York',
        estimatedDuration: '4-5 hours',
        estimatedDistance: '215 miles',
        categories: ['historic_sites', 'cultural_sites', 'restaurants', 'shopping'],
        imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
      },
      {
        id: 'seattle-portland',
        title: 'Pacific Northwest Discovery',
        description: 'Coffee culture, nature, and urban vibes of the Pacific Northwest',
        startCity: 'Seattle',
        endCity: 'Portland',
        estimatedDuration: '3-4 hours',
        estimatedDistance: '173 miles',
        categories: ['restaurants', 'parks', 'cultural_sites', 'outdoor_activities'],
        imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
      },
      {
        id: 'las-vegas-grand-canyon',
        title: 'Desert Wonder Adventure',
        description: 'From the entertainment capital to one of the world\'s natural wonders',
        startCity: 'Las Vegas',
        endCity: 'Grand Canyon',
        estimatedDuration: '4-5 hours',
        estimatedDistance: '280 miles',
        categories: ['scenic_spots', 'outdoor_activities', 'attractions', 'parks'],
        imageUrl: 'https://images.unsplash.com/photo-1474692295473-66ba4d54e0d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
      }
    ];
  }

  /**
   * Calculate how well a trip matches user interests (0-100 score)
   */
  private calculateInterestScore(tripCategories: string[], userInterests: string[]): number {
    if (userInterests.length === 0) return 50; // Default score
    
    const matches = tripCategories.filter(category => userInterests.includes(category));
    const matchPercentage = matches.length / tripCategories.length;
    const interestCoverage = matches.length / userInterests.length;
    
    // Weighted score: 70% match percentage, 30% interest coverage
    return Math.round((matchPercentage * 70) + (interestCoverage * 30));
  }

  /**
   * Get matching interests between trip and user
   */
  private getMatchingInterests(tripCategories: string[], userInterests: string[]): string[] {
    return tripCategories.filter(category => userInterests.includes(category));
  }

  /**
   * Get relevant POIs for a trip based on user interests
   */
  private async getRelevantPois(
    trip: Omit<SuggestedTrip, 'score' | 'pois' | 'matchingInterests'>, 
    userInterests: string[]
  ): Promise<Poi[]> {
    try {
      // Get existing POIs from storage
      const storage = getStorage();
      const allPois = await storage.getAllPois();
      
      // Filter POIs by user interests using the mapping
      const filteredPois = interestsService.filterPoisByUserInterests(allPois, userInterests);
      
      // Return a sample of relevant POIs (limit to 6 per trip for performance)
      return filteredPois.slice(0, 6);
    } catch (error) {
      console.error("Error fetching relevant POIs:", error);
      return [];
    }
  }

  /**
   * Get trip suggestions with rate limiting
   */
  async getSuggestedTripsWithRateLimit(userId: number, limit: number = 5): Promise<SuggestedTrip[]> {
    // Simple rate limiting - could be enhanced with Redis in production
    const cacheKey = `suggested-trips-${userId}`;
    
    // For now, just generate fresh suggestions
    // In production, you'd want to cache this for a few hours
    return this.generateSuggestedTrips(userId, limit);
  }

  /**
   * Get a specific suggested trip by ID
   */
  async getSuggestedTripById(tripId: string, userId?: number): Promise<SuggestedTrip | null> {
    const templates = this.getTripTemplates();
    const template = templates.find(t => t.id === tripId);
    
    if (!template) {
      return null;
    }

    let userInterests: string[] = [];
    if (userId) {
      userInterests = await interestsService.getUserEnabledInterestNames(userId);
    }

    const score = userId ? this.calculateInterestScore(template.categories, userInterests) : 75;
    const pois = await this.getRelevantPois(template, userInterests);
    const matchingInterests = userId ? this.getMatchingInterests(template.categories, userInterests) : [];

    // Remove categories property and return SuggestedTrip
    const { categories, ...templateWithoutCategories } = template;
    return {
      ...templateWithoutCategories,
      score,
      pois,
      matchingInterests
    };
  }
}

export const suggestedTripsService = new SuggestedTripsService();