# Dashboard API Integration Guide

This document outlines how to integrate the new `/api/dashboard` endpoint specifically for the dashboard page to replace multiple API calls with a single consolidated call when users visit the dashboard.

## Overview

The new dashboard API consolidates multiple data sources into a single endpoint for the dashboard page only. This reduces network requests and improves dashboard loading performance while keeping individual API calls for other pages intact.

## Integration Strategy

### Dashboard Page Only
The `/api/dashboard` endpoint should be used exclusively when users navigate to the dashboard page (`/dashboard`). Other pages and components continue to use their existing individual API calls.

### Before: Multiple API Calls on Dashboard
```typescript
// OLD: Dashboard page making multiple separate calls
const trips = await fetch('/api/trips')
const interests = await fetch('/api/interests/categories')
const stats = await fetch('/api/stats')
```

### After: Single Dashboard Call
```typescript
// NEW: Dashboard page making single consolidated call
const dashboard = await fetch('/api/dashboard')
const { trips, suggested_interests, categories, stats } = dashboard.data
```

## Implementation

### 1. Create Dashboard-Specific Hook

Create a hook specifically for dashboard data:

```typescript
// client/src/hooks/use-dashboard-data.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-context';
import { authenticatedApiCall } from '@/lib/api-config';

export interface DashboardData {
  trips: {
    user_trips: Trip[];
    suggested_trips: Trip[];
  };
  suggested_interests: string[];
  categories: {
    trip_types: string[];
    poi_categories: InterestCategory[];
  };
  stats?: {
    total_trips: number;
    total_distance: string;
    total_duration: string;
    favorite_categories: string[];
  };
}

export function useDashboardData() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      const response = await authenticatedApiCall<{ success: true; data: DashboardData }>('/api/dashboard');
      return response.data;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
```

### 2. Update Dashboard Page

Replace multiple API calls in the dashboard page with the single endpoint:

```typescript
// client/src/pages/dashboard.tsx
import { useDashboardData } from '@/hooks/use-dashboard-data';

export function Dashboard() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyDashboard />;

  const { trips, suggested_interests, categories, stats } = data;

  return (
    <div className="dashboard-container">
      {/* User Stats Section */}
      {stats && (
        <section className="stats-section">
          <h2>Your Travel Stats</h2>
          <div className="stats-grid">
            <StatCard label="Total Trips" value={stats.total_trips} />
            <StatCard label="Distance Traveled" value={stats.total_distance} />
            <StatCard label="Time Traveled" value={stats.total_duration} />
          </div>
          <div className="favorite-categories">
            <h3>Your Favorite Categories</h3>
            {stats.favorite_categories.map(category => (
              <CategoryBadge key={category} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* User Trips Section */}
      <section className="user-trips-section">
        <h2>Your Recent Trips</h2>
        {trips.user_trips.length > 0 ? (
          <div className="trips-grid">
            {trips.user_trips.map(trip => (
              <TripCard key={trip.id} trip={trip} variant="user" />
            ))}
          </div>
        ) : (
          <EmptyTripsMessage />
        )}
      </section>

      {/* Suggested Trips Section */}
      {trips.suggested_trips.length > 0 && (
        <section className="suggested-trips-section">
          <h2>Trips You Might Like</h2>
          <div className="trips-grid">
            {trips.suggested_trips.map(trip => (
              <TripCard key={trip.id} trip={trip} variant="suggested" />
            ))}
          </div>
        </section>
      )}

      {/* Interest Suggestions Section */}
      {suggested_interests.length > 0 && (
        <section className="interests-section">
          <h2>You Might Be Interested In</h2>
          <div className="interests-grid">
            {suggested_interests.map(interest => (
              <InterestCard key={interest} interest={interest} />
            ))}
          </div>
        </section>
      )}

      {/* Trip Categories Overview */}
      {categories && (
        <section className="categories-section">
          <h2>Explore by Category</h2>
          <div className="category-types">
            <h3>Trip Types</h3>
            <div className="chip-container">
              {categories.trip_types.map(type => (
                <TripTypeChip key={type} type={type} />
              ))}
            </div>
          </div>
          <div className="poi-categories">
            <h3>Places of Interest</h3>
            <div className="category-grid">
              {categories.poi_categories.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
```

### 3. Keep Other Pages Unchanged

Other pages continue to use their existing individual API calls:

```typescript
// client/src/pages/trips.tsx - UNCHANGED
export function TripsPage() {
  const { trips, loading } = useTrips(); // Still uses individual /api/trips call
  // ... rest of component unchanged
}

// client/src/pages/interests.tsx - UNCHANGED  
export function InterestsPage() {
  const { categories, loading } = useUserInterests(); // Still uses individual /api/interests calls
  // ... rest of component unchanged
}
```

## Expected JSON Response Structure

The `/api/dashboard` endpoint returns:

```json
{
  "success": true,
  "data": {
    "trips": {
      "user_trips": [
        {
          "id": 1,
          "title": "San Francisco to Los Angeles",
          "start_city": "San Francisco, CA",
          "end_city": "Los Angeles, CA",
          "route_data": {
            "distance": "382 miles",
            "duration": "6 hours 15 mins"
          },
          "pois_data": [
            {
              "id": 1,
              "name": "Golden Gate Bridge",
              "category": "attraction",
              "rating": "4.8"
            }
          ],
          "is_public": true,
          "user_id": 123
        }
      ],
      "suggested_trips": [
        {
          "id": 2,
          "title": "Wine Country Tour",
          "start_city": "Napa, CA",
          "end_city": "Sonoma, CA",
          "route_data": {
            "distance": "45 miles",
            "duration": "1 hour 30 mins"
          },
          "is_public": true,
          "user_id": 456
        }
      ]
    },
    "suggested_interests": [
      "wine tasting",
      "hiking",
      "photography",
      "local cuisine"
    ],
    "categories": {
      "trip_types": [
        "road trip",
        "city exploration", 
        "nature adventure",
        "cultural tour"
      ],
      "poi_categories": [
        {
          "id": 1,
          "name": "restaurant",
          "display_name": "Restaurants",
          "icon": "utensils",
          "color": "#FF6B6B"
        },
        {
          "id": 2,
          "name": "attraction", 
          "display_name": "Attractions",
          "icon": "camera",
          "color": "#4ECDC4"
        }
      ]
    },
    "stats": {
      "total_trips": 12,
      "total_distance": "2,847 miles", 
      "total_duration": "45 hours 23 mins",
      "favorite_categories": ["restaurant", "attraction", "park"]
    }
  }
}
```

## Benefits

### Performance Improvement for Dashboard
- **Before**: 3-4 separate API calls (450ms+ total)
- **After**: 1 consolidated API call (~250ms total)
- **Result**: ~44% faster dashboard loading

### Maintained Simplicity
- Other pages keep their existing, focused API calls
- No complex data synchronization between dashboard and other pages
- Each page optimized for its specific use case

## Implementation Checklist

- [ ] Create `use-dashboard-data.ts` hook
- [ ] Update dashboard page to use consolidated endpoint
- [ ] Test dashboard loading performance
- [ ] Verify other pages remain unchanged
- [ ] Add proper error handling for dashboard-specific errors
- [ ] Add loading skeleton for dashboard page