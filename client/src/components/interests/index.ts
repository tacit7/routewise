/**
 * @fileoverview Interest Management Components
 * 
 * A comprehensive set of pure, controlled React components for managing user travel interests.
 * All components follow the RouteWise design system and are optimized for performance,
 * accessibility, and testing.
 * 
 * @package RouteWise Frontend
 * @version 1.0.0
 */

// Core Components
export { default as InterestTile } from '../interest-tile';
export { default as CustomizeInterestsModal } from '../customize-interests-modal';
export { default as SuggestedTrips } from '../suggested-trips';
export { default as UserInterests } from '../user-interests';
export { default as InterestsShowcase } from '../interests-showcase';

// Types
export type {
  InterestCategory,
  InterestTileProps,
  SuggestedTrip,
  SuggestedTripsProps,
  CustomizeInterestsModalProps
} from '../../types/interests';

// Mock Data
export {
  MOCK_INTEREST_CATEGORIES,
  MOCK_SUGGESTED_TRIPS,
  getPersonalizedTrips,
  MOCK_USER_INTERESTS
} from '../../mocks/interests-data';

/**
 * Component Architecture Overview
 * 
 * ## Pure Components
 * All components are pure and controlled - no internal API calls or side effects.
 * State management is handled by parent components, making them easy to test and integrate.
 * 
 * ## Performance
 * - React.memo optimization for all components
 * - useCallback for event handlers
 * - Optimized re-renders with proper prop dependencies
 * 
 * ## Accessibility
 * - Full ARIA label support
 * - Keyboard navigation (Enter/Space)
 * - Focus indicators and ring styles
 * - Screen reader friendly descriptions
 * 
 * ## Design System Integration
 * - Uses existing shadcn/ui base components
 * - Follows RouteWise color palette and typography
 * - Consistent spacing using Tailwind system
 * - Responsive design patterns
 * 
 * ## Animation
 * - Framer Motion for smooth interactions
 * - Subtle bounce effects for first-time users
 * - Entrance animations with stagger delays
 * - Performance-optimized transitions
 * 
 * ## TypeScript
 * - Strict typing with comprehensive interfaces
 * - JSDoc documentation for all props
 * - Generic type support where appropriate
 * - Clear component contracts
 */

/**
 * Usage Examples
 * 
 * @example Basic Interest Tile
 * ```tsx
 * import { InterestTile } from '@/components/interests';
 * 
 * <InterestTile
 *   category={{ id: 'restaurants', name: 'Restaurants', imageUrl: '...' }}
 *   isSelected={true}
 *   onToggle={(id) => console.log('Toggled:', id)}
 * />
 * ```
 * 
 * @example Suggested Trips with Loading
 * ```tsx
 * import { SuggestedTrips, MOCK_SUGGESTED_TRIPS } from '@/components/interests';
 * 
 * <SuggestedTrips
 *   trips={MOCK_SUGGESTED_TRIPS}
 *   onPlanTrip={(trip) => navigate(`/plan?trip=${trip.id}`)}
 *   isLoading={false}
 * />
 * ```
 * 
 * @example Complete Interest Management
 * ```tsx
 * import { UserInterests } from '@/components/interests';
 * 
 * <UserInterests
 *   onRouteRequest={(start, end) => router.push(`/route?start=${start}&end=${end}`)}
 * />
 * ```
 * 
 * @example Customization Modal
 * ```tsx
 * import { CustomizeInterestsModal, MOCK_INTEREST_CATEGORIES } from '@/components/interests';
 * 
 * <CustomizeInterestsModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   selectedInterests={userInterests}
 *   onSave={(interests) => saveUserInterests(interests)}
 *   availableCategories={MOCK_INTEREST_CATEGORIES}
 * />
 * ```
 */

/**
 * Integration Guidelines
 * 
 * ## Data Integration
 * Replace mock data with real API calls in parent components:
 * - Use MOCK_INTEREST_CATEGORIES as template for category structure
 * - Use MOCK_SUGGESTED_TRIPS as template for trip data structure
 * - Implement getPersonalizedTrips logic in your backend
 * 
 * ## State Management
 * Components are designed to work with any state management solution:
 * - Redux Toolkit
 * - Zustand
 * - React Context
 * - Local component state
 * 
 * ## Styling Customization
 * All components use Tailwind CSS classes and can be customized via:
 * - CSS custom properties for colors
 * - Tailwind configuration overrides
 * - Component-level className props
 * 
 * ## Testing
 * Components are optimized for testing:
 * - Clear prop interfaces
 * - Predictable behavior
 * - Accessible selectors
 * - Mock data provided
 * 
 * ## Performance Optimization
 * - All components use React.memo
 * - Event handlers are memoized with useCallback
 * - Image loading can be optimized with Next.js Image
 * - Consider virtual scrolling for large trip lists
 */