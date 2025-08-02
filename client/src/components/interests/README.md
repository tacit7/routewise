# Interest Management Components

A comprehensive, production-ready component library for managing user travel interests in RouteWise.

## 🎯 Overview

This component library provides a complete solution for interest-based travel planning, featuring:

- **Pure Components**: No side effects, fully controlled and testable
- **Accessibility First**: WCAG 2.1 AA compliant with full keyboard navigation
- **Performance Optimized**: React.memo, useCallback, optimized re-renders
- **Design System Integration**: Seamless shadcn/ui and Tailwind CSS integration
- **TypeScript Native**: Comprehensive type definitions with JSDoc

## 📦 Components

### InterestTile
Photographic tile component for selecting interest categories.

```tsx
<InterestTile
  category={{ id: 'restaurants', name: 'Restaurants', imageUrl: '...' }}
  isSelected={true}
  onToggle={(categoryId) => handleToggle(categoryId)}
  isFirstVisit={false}
  disabled={false}
/>
```

**Features:**
- Warm, photographic design with vibrant colors
- Smooth hover effects and selection feedback (blue ring + checkmark)
- Framer Motion animations with subtle bounce effects
- Full keyboard navigation (Enter/Space)
- ARIA labels and accessibility support

### CustomizeInterestsModal
Modal dialog for customizing interest selections.

```tsx
<CustomizeInterestsModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  selectedInterests={['restaurants', 'museums']}
  onSave={(interests) => saveInterests(interests)}
  availableCategories={categories}
/>
```

**Features:**
- Grid layout with responsive design
- Save/cancel functionality with validation
- Loading states and form validation
- Entrance animations with stagger delays
- Focus management and screen reader support

### SuggestedTrips
Horizontal scroll component displaying trip suggestions.

```tsx
<SuggestedTrips
  trips={personalizedTrips}
  onPlanTrip={(trip) => planTrip(trip)}
  isLoading={false}
/>
```

**Features:**
- Postcard-style trip cards with compelling imagery
- Horizontal scroll with touch/mouse support
- Loading skeletons and empty states
- Difficulty badges and trip highlights
- "Plan This Trip" CTAs with keyboard support

### UserInterests
Complete interest management system.

```tsx
<UserInterests
  onRouteRequest={(start, end) => navigate(`/route?start=${start}&end=${end}`)}
/>
```

**Features:**
- localStorage persistence for user preferences
- Floating "Customize Interests" CTA
- First-visit detection and animations
- Personalized trip recommendations
- Complete state management

## 🎨 Design System Compliance

### Visual Design
- **Colors**: Vibrant, warm photography with RouteWise brand colors
- **Typography**: Bold, readable text following existing patterns
- **Spacing**: Consistent Tailwind spacing system
- **Shadows**: Subtle elevation with hover enhancements

### Interactions
- **Hover Effects**: Smooth scale transforms and shadow changes
- **Selection Feedback**: Blue ring (4px) with checkmark indicator
- **Focus Indicators**: Accessible ring styles for keyboard navigation
- **Loading States**: Skeleton loaders and progressive disclosure

### Animations
- **Entrance**: Framer Motion spring animations with stagger
- **Interaction**: Scale transforms and opacity transitions
- **First Visit**: Subtle bounce effects for new users
- **Performance**: Optimized with transform and opacity only

## ♿ Accessibility Features

### ARIA Support
- Proper roles (`button`, `dialog`, `list`, `listitem`)
- Descriptive labels and descriptions
- Live regions for dynamic content
- Focus management for modals

### Keyboard Navigation
- **Enter/Space**: Activate tiles and buttons
- **Tab**: Navigate through interactive elements
- **Escape**: Close modals and overlays
- **Arrow Keys**: Navigate within components

### Screen Reader Support
- Meaningful alt text and descriptions
- Status announcements for state changes
- Clear hierarchy with heading structure
- Semantic HTML structure

## 🚀 Performance Optimizations

### React Optimizations
```tsx
// All components use React.memo
const InterestTile = React.memo<InterestTileProps>(({ ... }) => {
  // Memoized event handlers
  const handleToggle = useCallback((categoryId: string) => {
    onToggle(categoryId);
  }, [onToggle]);
  
  return (/* JSX */);
});
```

### Rendering Performance
- **Memoization**: React.memo for all components
- **Callbacks**: useCallback for event handlers
- **Dependencies**: Optimized useEffect dependencies
- **Animations**: GPU-accelerated transforms

### Image Optimization
- **Unsplash URLs**: Optimized with size parameters
- **Lazy Loading**: Ready for implementation
- **Responsive Images**: Multiple breakpoint support
- **Fallback States**: Graceful error handling

## 📱 Responsive Design

### Breakpoints
- **Mobile**: Grid adjusts to 2 columns
- **Tablet**: 3-column grid layout
- **Desktop**: 4+ column optimal layout
- **Large Screens**: Maximum width constraints

### Touch Support
- **Touch Targets**: Minimum 44px touch areas
- **Gesture Support**: Horizontal scroll on mobile
- **Hover States**: Disabled on touch devices
- **Safe Areas**: Respect device safe areas

## 🧪 Testing Strategy

### Unit Testing
```tsx
import { render, fireEvent, screen } from '@testing-library/react';
import { InterestTile } from '@/components/interests';

test('calls onToggle when clicked', () => {
  const handleToggle = jest.fn();
  render(
    <InterestTile
      category={mockCategory}
      isSelected={false}
      onToggle={handleToggle}
    />
  );
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleToggle).toHaveBeenCalledWith('restaurants');
});
```

### Integration Testing
- Component interaction workflows
- State management integration
- API integration patterns
- Error boundary testing

### Accessibility Testing
- Automated ARIA validation
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast verification

## 🔧 Integration Guide

### Basic Setup
```tsx
import { 
  UserInterests,
  MOCK_INTEREST_CATEGORIES,
  MOCK_SUGGESTED_TRIPS 
} from '@/components/interests';

function App() {
  return (
    <UserInterests
      onRouteRequest={(start, end) => {
        // Handle route planning
        router.push(`/route?start=${start}&end=${end}`);
      }}
    />
  );
}
```

### Custom State Management
```tsx
function CustomInterestManager() {
  const [interests, setInterests] = useInterests();
  const [trips] = usePersonalizedTrips(interests);
  
  return (
    <>
      <InterestTile
        category={category}
        isSelected={interests.includes(category.id)}
        onToggle={(id) => toggleInterest(id)}
      />
      
      <SuggestedTrips
        trips={trips}
        onPlanTrip={handlePlanTrip}
      />
    </>
  );
}
```

### API Integration
```tsx
// Replace mock data with real API calls
const { data: categories } = useSWR('/api/interests/categories');
const { data: trips } = useSWR(`/api/trips/suggested?interests=${interests.join(',')}`);
```

## 🎯 Migration from Mock Data

### Categories API
```typescript
// Expected API structure
interface CategoryAPI {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}
```

### Trips API
```typescript
// Expected API structure
interface TripAPI {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: string;
  highlights: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  startLocation: string;
  endLocation: string;
  categories: string[]; // Interest category IDs
  score?: number; // Personalization score
}
```

### User Preferences API
```typescript
// Expected API structure
interface UserPreferencesAPI {
  userId: string;
  interests: string[];
  lastUpdated: string;
  preferences: {
    difficulty: string[];
    duration: string[];
    regions: string[];
  };
}
```

## 📊 Analytics & Tracking

### Recommended Events
```typescript
// Interest selection tracking
analytics.track('Interest Selected', {
  categoryId: 'restaurants',
  categoryName: 'Restaurants',
  selectionCount: 5,
  isFirstTime: false
});

// Trip planning initiation
analytics.track('Trip Planning Started', {
  tripId: 'california-coast',
  tripTitle: 'California Coastal Adventure',
  source: 'suggested_trips',
  userInterests: ['restaurants', 'beaches', 'outdoors']
});
```

## 🔒 Security Considerations

### Data Handling
- Sanitize user input for interest descriptions
- Validate image URLs to prevent XSS
- Implement CSP for external image loading
- Rate limiting for API requests

### Privacy
- Store minimal user data locally
- Implement data retention policies
- Provide clear data deletion options
- GDPR compliance for European users

## 🚀 Deployment Checklist

- [ ] Component library built and tested
- [ ] Mock data replaced with real APIs
- [ ] Analytics tracking implemented
- [ ] Accessibility audit completed
- [ ] Performance benchmarks met
- [ ] Cross-browser testing passed
- [ ] Mobile device testing completed
- [ ] SEO optimization implemented

## 📚 Additional Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Framer Motion API](https://www.framer.com/motion/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)