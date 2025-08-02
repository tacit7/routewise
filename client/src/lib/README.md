# RouteWise Frontend Data Integration Layer

This document describes the complete data integration layer for the RouteWise interests feature, providing robust API integration, state management, and data flow orchestration.

## Architecture Overview

The data integration layer consists of several interconnected components:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                         │
├─────────────────────────────────────────────────────────────┤
│                    Custom Hooks                            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │ useUserInterests│ │ useSuggestedTrips│ │ useFirstTime  │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                Data Transformation Layer                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │ DataTransformer │ │ API Client      │ │ LocalStorage  │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    TanStack Query                          │
│            (Caching, Background Refresh, Sync)             │
├─────────────────────────────────────────────────────────────┤
│                    Backend API                             │
│  /api/interests/categories | /api/users/:id/interests      │
│  /api/trips/suggested     | /api/trips/suggested/:id       │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
client/src/
├── lib/
│   ├── interests-api.ts          # API client implementation
│   ├── data-transformers.ts      # Data transformation utilities
│   ├── user-preferences.ts       # localStorage management
│   └── queryClient.ts           # Enhanced TanStack Query config
├── hooks/
│   ├── use-user-interests.ts     # User interests state management
│   ├── use-suggested-trips.ts    # Suggested trips data fetching
│   ├── use-first-time-user.ts    # First-time user experience
│   └── use-interests.ts          # Unified export
├── types/
│   └── interests.ts              # TypeScript interfaces
└── components/
    └── interests-api-demo.tsx    # Integration testing component
```

## API Client (`interests-api.ts`)

### Features
- **Type-safe API access** for all interests endpoints
- **Comprehensive error handling** with custom error types
- **Retry logic** with exponential backoff
- **Request/response transformation** and validation

### Usage
```typescript
import { interestsApi } from '@/lib/interests-api';

// Get all interest categories
const categories = await interestsApi.getInterestCategories();

// Get user's current interests
const userInterests = await interestsApi.getUserInterests(userId);

// Update user interests
await interestsApi.updateUserInterests(userId, {
  interests: [{ categoryId: 1, isEnabled: true, priority: 1 }]
});

// Get suggested trips
const trips = await interestsApi.getSuggestedTrips(userId, 5);
```

### Error Handling
- `InterestsAPIError` with status codes and endpoint information
- Automatic retry for network errors (not client errors)
- Graceful fallback strategies

## Custom Hooks

### `useUserInterests()`

Manages user interests with TanStack Query integration.

**Features:**
- Automatic data fetching and caching
- Optimistic updates for better UX
- Real-time invalidation of related queries
- localStorage synchronization

**Usage:**
```typescript
const {
  availableCategories,      // Transformed frontend categories
  enabledInterestNames,     // Array of enabled interest names
  isLoading,               // Loading state
  updateInterests,         // Update function
  toggleInterest,          // Toggle specific interest
  enableAllInterests,      // Enable all interests
} = useUserInterests();
```

### `useSuggestedTrips(limit?)`

Fetches and manages suggested trips based on user interests.

**Features:**
- Interest-based trip suggestions
- Background refresh capabilities
- localStorage caching with expiration
- Automatic invalidation on interest changes

**Usage:**
```typescript
const {
  trips,              // Transformed frontend trips
  isLoading,          // Loading state
  backgroundRefresh,  // Refresh without loading state
  forceRefresh,       // Clear cache and refresh
} = useSuggestedTrips(5);
```

### `useFirstTimeUser()`

Manages first-time user experience and onboarding flow.

**Features:**
- First visit detection
- Onboarding completion tracking
- Cross-tab synchronization
- Default interest setup

**Usage:**
```typescript
const {
  isFirstVisit,
  shouldShowFirstTimeExperience,
  completeOnboarding,
  skipOnboarding,
} = useFirstTimeUser();
```

## Data Transformation (`data-transformers.ts`)

### Purpose
Converts between backend API formats and frontend component formats for seamless integration.

### Key Functions
- `transformInterestCategories()` - Backend → Frontend format
- `transformSuggestedTrips()` - API trips → Component-ready trips
- `extractEnabledInterestNames()` - Extract enabled interests
- `transformInterestSelectionsToBackend()` - Frontend → API format

### Error Handling
- Safe transformation with fallback data
- Data validation before transformation
- Graceful degradation on invalid data

## User Preferences (`user-preferences.ts`)

### Features
- **First visit tracking** with persistent storage
- **Suggested trips caching** with automatic expiration
- **Cross-tab synchronization** via storage events
- **Cache management** with statistics and cleanup

### Usage
```typescript
import { userPreferences } from '@/lib/user-preferences';

// Check first visit
const isFirst = userPreferences.isFirstVisit();

// Cache suggested trips
userPreferences.cacheSuggestedTrips(trips, userId);

// Get cached trips (null if expired)
const cached = userPreferences.getCachedSuggestedTrips(userId);
```

### Cache Strategy
- **Duration**: 30 minutes for suggested trips
- **Validation**: User ID matching and timestamp checking
- **Cleanup**: Automatic expiration on access
- **Statistics**: Built-in cache analytics

## TanStack Query Configuration

### Enhanced Features
- **Smart retry logic** - No retries on 4xx errors
- **Exponential backoff** with jitter
- **Error categorization** - Different handling for client vs server errors
- **Optimized caching** - Appropriate stale times for different data types

### Query Keys
```typescript
// Interest categories (long-lived)
["interests", "categories"]

// User interests (medium-lived)
["interests", "user", userId]

// Suggested trips (short-lived)
["trips", "suggested", "user", userId, limit]

// Specific trip (long-lived)
["trips", "suggested", "trip", tripId, userId]
```

## Performance Optimizations

### Caching Strategy
- **Interest Categories**: 30 min stale, 1 hour cache
- **User Interests**: 5 min stale, 15 min cache
- **Suggested Trips**: 15 min stale, 30 min cache + localStorage

### Background Operations
- **Background refresh** for suggested trips
- **Preloading** on user interactions
- **Optimistic updates** for interest toggles
- **Debounced updates** to prevent API spam

### Data Flow Optimization
- **Parallel queries** when data is independent
- **Query invalidation** only when necessary
- **Selective re-renders** with React.memo
- **Efficient transformations** with memoization

## Error Handling Strategy

### API Errors
1. **Network Errors**: Retry with exponential backoff
2. **Authentication Errors (401)**: No retry, redirect to login
3. **Authorization Errors (403)**: No retry, show error message
4. **Not Found (404)**: No retry, handle gracefully
5. **Server Errors (5xx)**: Limited retries

### Data Errors
1. **Invalid API Response**: Fallback to mock data
2. **Transformation Errors**: Log warning, use defaults
3. **Cache Corruption**: Clear cache, refetch data

### User Experience
- **Loading states** for all async operations
- **Error boundaries** for component-level errors
- **Toast notifications** for user actions
- **Graceful degradation** when services unavailable

## Integration with Existing Components

### Component Props Transformation
```typescript
// Backend API format
interface InterestCategory {
  id: number;
  name: string;
  displayName: string;
  // ... other fields
}

// Frontend component format
interface FrontendInterestCategory {
  id: string;        // name as string ID
  name: string;      // displayName
  imageUrl: string;  // mapped from category name
  description?: string;
}
```

### Hook Integration Pattern
```typescript
// In your React component
function InterestsPage() {
  const {
    availableCategories,
    enabledInterestNames,
    toggleInterest,
    isLoading,
  } = useUserInterests();

  const {
    trips,
    isLoading: isLoadingTrips,
  } = useSuggestedTrips();

  // Component logic using transformed data
}
```

## Testing and Validation

### Demo Component
Use `InterestsAPIDemo` component to test all functionality:
- API client operations
- Hook state management
- Data transformations
- Cache behavior
- Error handling

### Manual Testing Checklist
- [ ] Interest categories load correctly
- [ ] User interests update properly
- [ ] Suggested trips reflect interest changes
- [ ] First-time user flow works
- [ ] Cache expiration functions
- [ ] Error states display appropriately
- [ ] Cross-tab synchronization works

## Future Enhancements

### Performance
- [ ] Implement request deduplication
- [ ] Add service worker for offline support
- [ ] Optimize bundle size with tree shaking

### Features
- [ ] Real-time updates via WebSocket
- [ ] Advanced trip filtering
- [ ] Interest priority weighting
- [ ] Social features integration

### Monitoring
- [ ] Add analytics for API usage
- [ ] Performance monitoring
- [ ] Error tracking integration

## Troubleshooting

### Common Issues

**Interests not loading**
1. Check authentication status
2. Verify API endpoints are available
3. Check browser network tab for errors
4. Validate user permissions

**Suggested trips empty**
1. Ensure user has interests enabled
2. Check trip generation algorithm
3. Verify POI data availability
4. Check cache expiration

**Cache not working**
1. Verify localStorage availability
2. Check quota limits
3. Validate user ID consistency
4. Clear corrupted cache data

### Debug Tools
```typescript
// Enable in development
import { userPreferences } from '@/lib/user-preferences';

// Get cache statistics
console.log(userPreferences.getCacheStats());

// Clear all data for fresh start
userPreferences.clearAllPreferences();
```

This data integration layer provides a robust foundation for the RouteWise interests feature, ensuring reliable data flow, optimal performance, and excellent user experience.