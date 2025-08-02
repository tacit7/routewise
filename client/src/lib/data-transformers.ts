import type {
  InterestCategory,
  UserInterest,
  SuggestedTrip,
  FrontendInterestCategory,
  FrontendSuggestedTrip,
} from "@/types/interests";
import { MOCK_INTEREST_CATEGORIES } from "@/mocks/interests-data";

/**
 * Image mapping for interest categories
 * Maps backend category names to appropriate Unsplash images
 */
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  restaurants: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop&crop=center",
  attractions: "https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=400&h=400&fit=crop&crop=center",
  parks: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop&crop=center",
  scenic_spots: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop&crop=center",
  historic_sites: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop&crop=center",
  markets: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center",
  outdoor_activities: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop&crop=center",
  cultural_sites: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center",
  shopping: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center",
  nightlife: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop&crop=center",
  landmarks: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop&crop=center",
  entertainment: "https://images.unsplash.com/photo-1489599849926-2ee91cede3ba?w=400&h=400&fit=crop&crop=center",
  architecture: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop&crop=center",
  wellness: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop&crop=center",
  beaches: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop&crop=center",
};

/**
 * Get appropriate image URL for an interest category
 */
function getCategoryImageUrl(categoryName: string): string {
  return CATEGORY_IMAGE_MAP[categoryName] || CATEGORY_IMAGE_MAP.attractions;
}

/**
 * Transform backend InterestCategory to frontend FrontendInterestCategory
 */
export function transformInterestCategory(
  category: InterestCategory
): FrontendInterestCategory {
  return {
    id: category.name, // Use name as ID for frontend compatibility
    name: category.displayName,
    imageUrl: getCategoryImageUrl(category.name),
    description: category.description,
  };
}

/**
 * Transform array of backend interest categories to frontend format
 */
export function transformInterestCategories(
  categories: InterestCategory[]
): FrontendInterestCategory[] {
  return categories
    .filter(category => category.isActive)
    .map(transformInterestCategory);
}

/**
 * Transform backend SuggestedTrip to frontend FrontendSuggestedTrip
 */
export function transformSuggestedTrip(trip: SuggestedTrip): FrontendSuggestedTrip {
  // Extract highlights from POIs or use default highlights
  const highlights = trip.pois.length > 0 
    ? trip.pois.slice(0, 4).map(poi => poi.name)
    : [trip.startCity, trip.endCity, "Scenic Route", "Local Culture"];

  // Determine difficulty based on score and distance
  let difficulty: "easy" | "moderate" | "challenging" = "moderate";
  const distance = parseInt(trip.estimatedDistance);
  
  if (distance < 100) {
    difficulty = "easy";
  } else if (distance > 300) {
    difficulty = "challenging";
  }

  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    imageUrl: trip.imageUrl || getDefaultTripImage(trip.startCity, trip.endCity),
    duration: trip.estimatedDuration,
    highlights,
    difficulty,
    startLocation: trip.startCity,
    endLocation: trip.endCity,
  };
}

/**
 * Transform array of backend suggested trips to frontend format
 */
export function transformSuggestedTrips(trips: SuggestedTrip[]): FrontendSuggestedTrip[] {
  return trips.map(transformSuggestedTrip);
}

/**
 * Get default trip image based on start and end cities
 */
function getDefaultTripImage(startCity: string, endCity: string): string {
  // Simple heuristic to choose appropriate image based on cities
  const cityPair = `${startCity}-${endCity}`.toLowerCase();
  
  if (cityPair.includes('california') || cityPair.includes('los angeles') || cityPair.includes('san francisco')) {
    return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&crop=center";
  }
  
  if (cityPair.includes('texas') || cityPair.includes('austin') || cityPair.includes('san antonio')) {
    return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop&crop=center";
  }
  
  if (cityPair.includes('colorado') || cityPair.includes('denver') || cityPair.includes('aspen')) {
    return "https://images.unsplash.com/photo-1506097425191-7ad538b29e05?w=600&h=400&fit=crop&crop=center";
  }
  
  if (cityPair.includes('florida') || cityPair.includes('miami') || cityPair.includes('key west')) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&crop=center";
  }
  
  if (cityPair.includes('new england') || cityPair.includes('boston') || cityPair.includes('new york')) {
    return "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop&crop=center";
  }
  
  if (cityPair.includes('pacific') || cityPair.includes('seattle') || cityPair.includes('portland')) {
    return "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop&crop=center";
  }
  
  // Default scenic road image
  return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&crop=center";
}

/**
 * Extract enabled interest names from UserInterest array
 */
export function extractEnabledInterestNames(userInterests: UserInterest[]): string[] {
  return userInterests
    .filter(interest => interest.isEnabled)
    .map(interest => interest.category.name);
}

/**
 * Convert frontend interest selections to backend format
 */
export function transformInterestSelectionsToBackend(
  selectedInterestNames: string[],
  availableCategories: InterestCategory[]
): Array<{ categoryId: number; isEnabled: boolean; priority: number }> {
  return availableCategories.map(category => ({
    categoryId: category.id,
    isEnabled: selectedInterestNames.includes(category.name),
    priority: selectedInterestNames.includes(category.name) ? 1 : 0,
  }));
}

/**
 * Fallback to mock data when API is unavailable
 */
export function getFallbackInterestCategories(): FrontendInterestCategory[] {
  return MOCK_INTEREST_CATEGORIES;
}

/**
 * Validate and sanitize interest category data
 */
export function validateInterestCategory(category: any): category is InterestCategory {
  return (
    typeof category === 'object' &&
    typeof category.id === 'number' &&
    typeof category.name === 'string' &&
    typeof category.displayName === 'string' &&
    typeof category.isActive === 'boolean'
  );
}

/**
 * Validate and sanitize suggested trip data
 */
export function validateSuggestedTrip(trip: any): trip is SuggestedTrip {
  return (
    typeof trip === 'object' &&
    typeof trip.id === 'string' &&
    typeof trip.title === 'string' &&
    typeof trip.description === 'string' &&
    typeof trip.startCity === 'string' &&
    typeof trip.endCity === 'string' &&
    typeof trip.score === 'number' &&
    Array.isArray(trip.pois)
  );
}

/**
 * Data transformer utility class
 */
export class DataTransformer {
  /**
   * Transform API response with error handling
   */
  static safeTransformCategories(categories: unknown[]): FrontendInterestCategory[] {
    try {
      const validCategories = categories.filter(validateInterestCategory);
      return transformInterestCategories(validCategories);
    } catch (error) {
      console.warn("Failed to transform interest categories, using fallback:", error);
      return getFallbackInterestCategories();
    }
  }

  /**
   * Transform suggested trips with error handling
   */
  static safeTransformTrips(trips: unknown[]): FrontendSuggestedTrip[] {
    try {
      const validTrips = trips.filter(validateSuggestedTrip);
      return transformSuggestedTrips(validTrips);
    } catch (error) {
      console.warn("Failed to transform suggested trips:", error);
      return [];
    }
  }
}