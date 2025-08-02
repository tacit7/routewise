/**
 * Interest category definition
 */
export interface InterestCategory {
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
  category: InterestCategory;
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
 * Suggested trip definition
 */
export interface SuggestedTrip {
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
  trips: SuggestedTrip[];
  /** Callback fired when user wants to plan a trip */
  onPlanTrip: (trip: SuggestedTrip) => void;
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
  availableCategories: InterestCategory[];
}

// Re-export from mock data for consistency
export { MOCK_INTEREST_CATEGORIES as DEFAULT_INTEREST_CATEGORIES } from '@/mocks/interests-data';