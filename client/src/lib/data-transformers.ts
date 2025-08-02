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
): Array<{ categoryId: number; isEnabled: boolean; priority?: number }> {
  return availableCategories.map(category => {
    const isEnabled = selectedInterestNames.includes(category.name);
    return {
      categoryId: category.id,
      isEnabled: isEnabled,
      // Only set priority for enabled interests, let the backend use default (1) for disabled ones
      ...(isEnabled && { priority: 1 })
    };
  });
}

/**
 * Fallback to mock data when API is unavailable
 */
export function getFallbackInterestCategories(): FrontendInterestCategory[] {
  return MOCK_INTEREST_CATEGORIES;
}

/**
 * Enhanced validation with detailed error reporting
 */
interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
}

/**
 * Validate and sanitize interest category data with detailed error reporting
 */
export function validateInterestCategory(category: any): ValidationResult<InterestCategory> {
  const errors: string[] = [];

  if (!category || typeof category !== 'object') {
    return { isValid: false, errors: ['Category must be an object'] };
  }

  if (typeof category.id !== 'number' || category.id <= 0) {
    errors.push('Category ID must be a positive number');
  }

  if (typeof category.name !== 'string' || category.name.trim().length === 0) {
    errors.push('Category name must be a non-empty string');
  }

  if (typeof category.displayName !== 'string' || category.displayName.trim().length === 0) {
    errors.push('Category display name must be a non-empty string');
  }

  if (typeof category.isActive !== 'boolean') {
    errors.push('Category isActive must be a boolean');
  }

  // Validate optional fields
  if (category.description !== undefined && typeof category.description !== 'string') {
    errors.push('Category description must be a string if provided');
  }

  if (category.iconName !== undefined && typeof category.iconName !== 'string') {
    errors.push('Category iconName must be a string if provided');
  }

  if (category.createdAt !== undefined) {
    const date = new Date(category.createdAt);
    if (isNaN(date.getTime())) {
      errors.push('Category createdAt must be a valid date if provided');
    }
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    data: isValid ? category as InterestCategory : undefined,
    errors
  };
}

/**
 * Validate and sanitize suggested trip data with detailed error reporting
 */
export function validateSuggestedTrip(trip: any): ValidationResult<SuggestedTrip> {
  const errors: string[] = [];

  if (!trip || typeof trip !== 'object') {
    return { isValid: false, errors: ['Trip must be an object'] };
  }

  if (typeof trip.id !== 'string' || trip.id.trim().length === 0) {
    errors.push('Trip ID must be a non-empty string');
  }

  if (typeof trip.title !== 'string' || trip.title.trim().length === 0) {
    errors.push('Trip title must be a non-empty string');
  }

  if (typeof trip.description !== 'string' || trip.description.trim().length === 0) {
    errors.push('Trip description must be a non-empty string');
  }

  if (typeof trip.startCity !== 'string' || trip.startCity.trim().length === 0) {
    errors.push('Trip start city must be a non-empty string');
  }

  if (typeof trip.endCity !== 'string' || trip.endCity.trim().length === 0) {
    errors.push('Trip end city must be a non-empty string');
  }

  if (typeof trip.score !== 'number' || trip.score < 0 || trip.score > 100) {
    errors.push('Trip score must be a number between 0 and 100');
  }

  if (!Array.isArray(trip.pois)) {
    errors.push('Trip POIs must be an array');
  } else {
    // Validate POI structure
    trip.pois.forEach((poi: any, index: number) => {
      if (!poi || typeof poi !== 'object') {
        errors.push(`POI at index ${index} must be an object`);
        return;
      }

      if (typeof poi.id !== 'number') {
        errors.push(`POI at index ${index} must have a numeric ID`);
      }

      if (typeof poi.name !== 'string' || poi.name.trim().length === 0) {
        errors.push(`POI at index ${index} must have a non-empty name`);
      }

      if (typeof poi.category !== 'string') {
        errors.push(`POI at index ${index} must have a category`);
      }
    });
  }

  // Validate optional fields
  if (trip.estimatedDuration !== undefined && typeof trip.estimatedDuration !== 'string') {
    errors.push('Trip estimated duration must be a string if provided');
  }

  if (trip.estimatedDistance !== undefined && typeof trip.estimatedDistance !== 'string') {
    errors.push('Trip estimated distance must be a string if provided');
  }

  if (trip.matchingInterests !== undefined && !Array.isArray(trip.matchingInterests)) {
    errors.push('Trip matching interests must be an array if provided');
  }

  if (trip.imageUrl !== undefined && typeof trip.imageUrl !== 'string') {
    errors.push('Trip image URL must be a string if provided');
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    data: isValid ? trip as SuggestedTrip : undefined,
    errors
  };
}

/**
 * Legacy validation functions for backward compatibility
 */
export function validateInterestCategoryLegacy(category: any): category is InterestCategory {
  const result = validateInterestCategory(category);
  return result.isValid;
}

export function validateSuggestedTripLegacy(trip: any): trip is SuggestedTrip {
  const result = validateSuggestedTrip(trip);
  return result.isValid;
}

/**
 * Enhanced data transformer utility class with comprehensive error handling
 */
export class DataTransformer {
  private static logValidationErrors(entityType: string, errors: string[], data?: any) {
    console.warn(`Validation failed for ${entityType}:`, {
      errors,
      data: data ? JSON.stringify(data, null, 2) : 'No data provided'
    });
  }

  /**
   * Transform API response with comprehensive error handling and recovery
   */
  static safeTransformCategories(
    categories: unknown[], 
    options: {
      strict?: boolean;
      logErrors?: boolean;
      useValidPartial?: boolean;
    } = {}
  ): FrontendInterestCategory[] {
    const { strict = false, logErrors = true, useValidPartial = true } = options;

    if (!Array.isArray(categories)) {
      if (logErrors) {
        console.warn("Categories data is not an array, using fallback");
      }
      return getFallbackInterestCategories();
    }

    const validCategories: InterestCategory[] = [];
    const errors: Array<{ index: number; errors: string[]; data: any }> = [];

    categories.forEach((category, index) => {
      const validation = validateInterestCategory(category);
      
      if (validation.isValid && validation.data) {
        validCategories.push(validation.data);
      } else {
        errors.push({ index, errors: validation.errors, data: category });
        
        if (logErrors) {
          this.logValidationErrors(`category at index ${index}`, validation.errors, category);
        }
      }
    });

    // In strict mode, fail completely if any validation errors
    if (strict && errors.length > 0) {
      if (logErrors) {
        console.error(`Strict mode: ${errors.length} validation errors found, using fallback`);
      }
      return getFallbackInterestCategories();
    }

    // If no valid categories found, use fallback
    if (validCategories.length === 0) {
      if (logErrors) {
        console.warn("No valid categories found, using fallback");
      }
      return getFallbackInterestCategories();
    }

    try {
      const transformed = transformInterestCategories(validCategories);
      
      if (logErrors && errors.length > 0) {
        console.info(`Successfully transformed ${transformed.length} categories, ${errors.length} invalid items skipped`);
      }
      
      return transformed;
    } catch (error) {
      if (logErrors) {
        console.error("Failed to transform valid categories, using fallback:", error);
      }
      return getFallbackInterestCategories();
    }
  }

  /**
   * Transform suggested trips with comprehensive error handling
   */
  static safeTransformTrips(
    trips: unknown[],
    options: {
      strict?: boolean;
      logErrors?: boolean;
      useValidPartial?: boolean;
      fallbackTrips?: FrontendSuggestedTrip[];
    } = {}
  ): FrontendSuggestedTrip[] {
    const { strict = false, logErrors = true, useValidPartial = true, fallbackTrips = [] } = options;

    if (!Array.isArray(trips)) {
      if (logErrors) {
        console.warn("Trips data is not an array, returning fallback");
      }
      return fallbackTrips;
    }

    const validTrips: SuggestedTrip[] = [];
    const errors: Array<{ index: number; errors: string[]; data: any }> = [];

    trips.forEach((trip, index) => {
      const validation = validateSuggestedTrip(trip);
      
      if (validation.isValid && validation.data) {
        validTrips.push(validation.data);
      } else {
        errors.push({ index, errors: validation.errors, data: trip });
        
        if (logErrors) {
          this.logValidationErrors(`trip at index ${index}`, validation.errors, trip);
        }
      }
    });

    // In strict mode, fail completely if any validation errors
    if (strict && errors.length > 0) {
      if (logErrors) {
        console.error(`Strict mode: ${errors.length} validation errors found, returning fallback`);
      }
      return fallbackTrips;
    }

    try {
      const transformed = transformSuggestedTrips(validTrips);
      
      if (logErrors && errors.length > 0) {
        console.info(`Successfully transformed ${transformed.length} trips, ${errors.length} invalid items skipped`);
      }
      
      return transformed;
    } catch (error) {
      if (logErrors) {
        console.error("Failed to transform valid trips, returning fallback:", error);
      }
      return fallbackTrips;
    }
  }

  /**
   * Validate and transform single category with error recovery
   */
  static safeSingleCategory(category: unknown): FrontendInterestCategory | null {
    const validation = validateInterestCategory(category);
    
    if (!validation.isValid || !validation.data) {
      console.warn("Invalid category data:", validation.errors);
      return null;
    }

    try {
      return transformInterestCategory(validation.data);
    } catch (error) {
      console.error("Failed to transform category:", error);
      return null;
    }
  }

  /**
   * Validate and transform single trip with error recovery
   */
  static safeSingleTrip(trip: unknown): FrontendSuggestedTrip | null {
    const validation = validateSuggestedTrip(trip);
    
    if (!validation.isValid || !validation.data) {
      console.warn("Invalid trip data:", validation.errors);
      return null;
    }

    try {
      return transformSuggestedTrip(validation.data);
    } catch (error) {
      console.error("Failed to transform trip:", error);
      return null;
    }
  }

  /**
   * Get validation statistics for debugging
   */
  static getValidationStats(data: unknown[]): {
    total: number;
    valid: number;
    invalid: number;
    validationRate: number;
  } {
    if (!Array.isArray(data)) {
      return { total: 0, valid: 0, invalid: 0, validationRate: 0 };
    }

    let valid = 0;
    let invalid = 0;

    data.forEach(item => {
      // Try to determine if it's a category or trip based on structure
      const categoryValidation = validateInterestCategory(item);
      const tripValidation = validateSuggestedTrip(item);
      
      if (categoryValidation.isValid || tripValidation.isValid) {
        valid++;
      } else {
        invalid++;
      }
    });

    const total = valid + invalid;
    const validationRate = total > 0 ? (valid / total) * 100 : 0;

    return { total, valid, invalid, validationRate };
  }
}