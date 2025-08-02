/**
 * Interest category definition (backend API format)
 */
export interface InterestCategory {
  /** Unique identifier for the category */
  id: number;
  /** Display name of the category */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Optional description for accessibility and context */
  description?: string;
  /** Icon identifier for UI */
  iconName?: string;
  /** Whether category is active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Frontend Interest Category (for components)
 */
export interface FrontendInterestCategory {
  /** Unique identifier for the category */
  id: string;
  /** Display name of the category */
  name: string;
  /** URL to category image (preferably 400x400px) */
  imageUrl: string;
  /** Optional description for accessibility and context */
  description?: string;
}

/**
 * Props for InterestTile component
 * @template Pure controlled component for selecting interest categories
 */
export interface InterestTileProps {
  /** Category data to display */
  category: FrontendInterestCategory;
  /** Whether this category is currently selected */
  isSelected: boolean;
  /** Callback fired when tile is toggled */
  onToggle: (categoryId: string) => void;
  /** Whether to show first-visit animation */
  isFirstVisit?: boolean;
  /** Whether the tile is disabled for interaction */
  disabled?: boolean;
}

/**
 * User Interest (backend API format)
 */
export interface UserInterest {
  id: number;
  userId: number;
  categoryId: number;
  isEnabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  category: InterestCategory;
}

/**
 * Suggested trip definition (backend API format)
 */
export interface SuggestedTrip {
  /** Unique identifier for the trip */
  id: string;
  /** Trip title/name */
  title: string;
  /** Detailed trip description */
  description: string;
  /** Starting city */
  startCity: string;
  /** Ending city */
  endCity: string;
  /** Estimated trip duration */
  estimatedDuration: string;
  /** Estimated distance */
  estimatedDistance: string;
  /** Matching user interests */
  matchingInterests: string[];
  /** Associated POIs */
  pois: Array<{
    id: number;
    name: string;
    description: string;
    category: string;
    rating: string;
    reviewCount: number;
    timeFromStart: string;
    imageUrl: string;
    placeId: string | null;
    address: string | null;
    priceLevel: number | null;
    isOpen: boolean | null;
  }>;
  /** Match score (0-100) */
  score: number;
  /** Hero image URL */
  imageUrl?: string;
}

/**
 * Frontend Suggested Trip (for components)
 */
export interface FrontendSuggestedTrip {
  /** Unique identifier for the trip */
  id: string;
  /** Trip title/name */
  title: string;
  /** Detailed trip description */
  description: string;
  /** Hero image URL (preferably 600x400px) */
  imageUrl: string;
  /** Trip duration (e.g., "5 days") */
  duration: string;
  /** Array of trip highlights/features */
  highlights: string[];
  /** Trip difficulty level */
  difficulty?: 'easy' | 'moderate' | 'challenging';
  /** Starting location */
  startLocation: string;
  /** Ending location */
  endLocation: string;
}

/**
 * Props for SuggestedTrips component
 * @template Pure controlled component for displaying trip suggestions
 */
export interface SuggestedTripsProps {
  /** Array of trips to display */
  trips: FrontendSuggestedTrip[];
  /** Callback fired when user wants to plan a trip */
  onPlanTrip: (trip: FrontendSuggestedTrip) => void;
  /** Whether component is in loading state */
  isLoading?: boolean;
}

/**
 * Props for CustomizeInterestsModal component
 * @template Pure controlled modal component for interest customization
 */
export interface CustomizeInterestsModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Currently selected interest IDs */
  selectedInterests: string[];
  /** Callback fired when user saves selections */
  onSave: (selectedInterests: string[]) => void;
  /** Available categories to choose from */
  availableCategories: FrontendInterestCategory[];
}

// Re-export from mock data for consistency
export { MOCK_INTEREST_CATEGORIES as DEFAULT_INTEREST_CATEGORIES } from '@/mocks/interests-data';

// API Request/Response Types

/**
 * API request to update user interests
 */
export interface UpdateUserInterestsRequest {
  interests?: Array<{
    categoryId: number;
    isEnabled: boolean;
    priority?: number;
  }>;
  enableAll?: boolean;
}

/**
 * API response for getting user interests
 */
export interface GetUserInterestsResponse {
  interests: UserInterest[];
}

/**
 * API response for getting interest categories
 */
export interface GetInterestCategoriesResponse {
  categories: InterestCategory[];
}

/**
 * API response for getting suggested trips
 */
export interface GetSuggestedTripsResponse {
  trips: SuggestedTrip[];
}

/**
 * API client interface for interests endpoints
 */
export interface InterestsAPI {
  getInterestCategories(): Promise<InterestCategory[]>;
  getUserInterests(userId: number): Promise<UserInterest[]>;
  updateUserInterests(userId: number, data: UpdateUserInterestsRequest): Promise<UserInterest[]>;
  getSuggestedTrips(userId: number, limit?: number): Promise<SuggestedTrip[]>;
  getSuggestedTripById(tripId: string, userId?: number): Promise<SuggestedTrip | null>;
}

/**
 * User preferences for localStorage
 */
export interface UserPreferences {
  isFirstVisit: boolean;
  lastSelectedInterests: string[];
  suggestedTripsCache?: {
    data: SuggestedTrip[];
    timestamp: number;
    userId: number;
  };
}