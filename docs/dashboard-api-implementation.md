🚀 Dashboard API Integration Guide

Create: docs/api/dashboard-integration.md

# Dashboard API Integration Guide

## Overview

The `/api/dashboard` endpoint provides aggregated dashboard data with intelligent caching for optimal performance. The endpoint adapts its
response based on authentication status and caches data appropriately.

## Endpoint Details

**URL:** `GET /api/dashboard`
**Authentication:** Optional (different data for authenticated vs anonymous users)
**Cache TTL:** 15 minutes (authenticated), 1 hour (anonymous)
**Content-Type:** `application/json`

## Request Examples

### Authenticated Request

```javascript
const response = await fetch('/api/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  }
});

const dashboardData = await response.json();

Anonymous Request

const response = await fetch('/api/dashboard', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

const dashboardData = await response.json();

Response Structure

Success Response (200 OK)

{
  "success": true,
  "data": {
    "trips": {
      "user_trips": [...],
      "suggested_trips": [...],
      "recent_trips": [...],
      "trip_count": 5
    },
    "suggested_interests": [
      {
        "id": "adventure",
        "name": "Adventure",
        "category": "activity",
        "popularity": 85
      }
    ],
    "categories": {
      "trip_types": [...],
      "poi_categories": [...],
      "interest_categories": [...]
    },
    "user": {
      "id": 123,
      "username": "johndoe",
      "email": "john@example.com",
      "profile_complete": true,
      "member_since": "2024-01-15T10:30:00Z",
      "preferences": {...}
    },
    "stats": {
      "user_trips": 5,
      "saved_places": 12,
      "total_destinations": 247,
      "total_pois": 1540,
      "popular_destinations": [...]
    }
  },
  "timestamp": "2025-08-06T12:34:56.789Z"
}

Anonymous User Response

{
  "success": true,
  "data": {
    "trips": {
      "user_trips": [],
      "suggested_trips": [
        {
          "id": "featured-1",
          "title": "Pacific Coast Highway",
          "description": "Scenic coastal drive from San Francisco to Los Angeles",
          "duration": "7 days",
          "distance": "500 miles",
          "image_url": "/images/pch.jpg",
          "featured": true
        }
      ],
      "recent_trips": [],
      "trip_count": 0
    },
    "suggested_interests": [
      {
        "id": "adventure",
        "name": "Adventure",
        "category": "activity",
        "popularity": 85
      }
    ],
    "categories": {
      "trip_types": [...],
      "poi_categories": [...],
      "interest_categories": [...]
    },
    "user": null,
    "stats": {
      "total_destinations": 247,
      "total_pois": 1540,
      "popular_destinations": [...]
    }
  },
  "timestamp": "2025-08-06T12:34:56.789Z"
}

Data Structure Details

Trip Data Structure

interface TripData {
  user_trips: Trip[];           // User's personal trips (empty for anonymous)
  suggested_trips: Trip[];      // Recommended/featured trips
  recent_trips: Trip[];         // Recently accessed trips (empty for anonymous)
  trip_count: number;          // Total user trips (0 for anonymous)
}

interface Trip {
  id: string;
  title: string;
  description: string;
  duration?: string;           // e.g., "7 days"
  distance?: string;          // e.g., "500 miles"
  image_url?: string;
  featured?: boolean;
  start_date?: string;        // ISO 8601 format
  end_date?: string;          // ISO 8601 format
  status?: string;            // "planned" | "active" | "completed"
  created_at?: string;        // ISO 8601 format
  updated_at?: string;        // ISO 8601 format
}

Interest Data Structure

interface Interest {
  id: string;                 // e.g., "adventure", "culture"
  name: string;              // Display name
  category: string;          // "activity" | "cuisine" | "accommodation"
  popularity: number;        // 0-100 popularity score
}

Categories Structure

interface Categories {
  trip_types: TripType[];
  poi_categories: POICategory[];
  interest_categories: InterestCategory[];
}

interface TripType {
  id: string;
  name: string;
  icon: string;              // Emoji or icon identifier
}

interface POICategory {
  id: string;
  name: string;
  icon: string;              // Emoji or icon identifier
  count: number;             // Number of POIs in this category
}

interface InterestCategory {
  id: string;
  name: string;
}

User Data Structure (Authenticated Only)

interface User {
  id: number;
  username: string;
  email: string;
  profile_complete: boolean;
  member_since: string;      // ISO 8601 format
  preferences: UserPreferences;
}

interface UserPreferences {
  preferred_trip_length: string;  // "day" | "weekend" | "week" | "extended"
  budget_range: string;          // "budget" | "moderate" | "luxury"
  travel_style: string;          // "adventure" | "relaxation" | "balanced"
}

Statistics Structure

interface Stats {
  // Authenticated users get personal stats
  user_trips?: number;
  saved_places?: number;

  // All users get global stats
  total_destinations: number;
  total_pois: number;
  popular_destinations: PopularDestination[];
}

interface PopularDestination {
  name: string;              // e.g., "San Francisco, CA"
  trip_count: number;        // Number of trips to this destination
}

Frontend Implementation Examples

React Hook Example

import { useState, useEffect } from 'react';

export const useDashboard = (authToken) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = {
          'Content-Type': 'application/json'
        };

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch('/api/dashboard', {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          throw new Error(`Dashboard fetch failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setDashboard(result.data);
        } else {
          throw new Error('Dashboard API returned success: false');
        }

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [authToken]);

  return { dashboard, loading, error };
};

Vue Composable Example

import { ref, computed, onMounted } from 'vue';

export function useDashboard(authToken) {
  const dashboard = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const isAuthenticated = computed(() => !!authToken.value);

  const fetchDashboard = async () => {
    try {
      loading.value = true;
      error.value = null;

      const headers = {
        'Content-Type': 'application/json'
      };

      if (authToken.value) {
        headers['Authorization'] = `Bearer ${authToken.value}`;
      }

      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers
      });

      const result = await response.json();

      if (response.ok && result.success) {
        dashboard.value = result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch dashboard');
      }

    } catch (err) {
      console.error('Dashboard error:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchDashboard);

  return {
    dashboard,
    loading,
    error,
    isAuthenticated,
    refetch: fetchDashboard
  };
}

Component Usage Examples

React Component

import React from 'react';
import { useDashboard } from './hooks/useDashboard';

const Dashboard = ({ authToken }) => {
  const { dashboard, loading, error } = useDashboard(authToken);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!dashboard) return <div className="no-data">No dashboard data</div>;

  return (
    <div className="dashboard">
      {/* User Section - Only show if authenticated */}
      {dashboard.user && (
        <section className="user-section">
          <h2>Welcome back, {dashboard.user.username}!</h2>
          <div className="user-stats">
            <div>Total Trips: {dashboard.stats.user_trips || 0}</div>
            <div>Saved Places: {dashboard.stats.saved_places || 0}</div>
          </div>
        </section>
      )}

      {/* Trips Section */}
      <section className="trips-section">
        <h3>Your Trips ({dashboard.trips.trip_count})</h3>

        {dashboard.trips.user_trips.length > 0 && (
          <div className="user-trips">
            {dashboard.trips.user_trips.map(trip => (
              <div key={trip.id} className="trip-card">
                <h4>{trip.title}</h4>
                <p>{trip.description}</p>
                <span>Status: {trip.status}</span>
              </div>
            ))}
          </div>
        )}

        <div className="suggested-trips">
          <h4>Suggested for You</h4>
          {dashboard.trips.suggested_trips.map(trip => (
            <div key={trip.id} className="suggested-trip">
              <h5>{trip.title}</h5>
              <p>{trip.description}</p>
              {trip.duration && <span>Duration: {trip.duration}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Interests Section */}
      <section className="interests-section">
        <h3>Suggested Interests</h3>
        <div className="interests-grid">
          {dashboard.suggested_interests.map(interest => (
            <div key={interest.id} className="interest-card">
              <h4>{interest.name}</h4>
              <span className="popularity">{interest.popularity}% popular</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="trip-types">
          <h4>Trip Types</h4>
          {dashboard.categories.trip_types.map(type => (
            <div key={type.id} className="category-item">
              <span className="icon">{type.icon}</span>
              <span className="name">{type.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Global Stats */}
      <section className="stats-section">
        <h3>Platform Statistics</h3>
        <div className="stats-grid">
          <div>Total Destinations: {dashboard.stats.total_destinations}</div>
          <div>Points of Interest: {dashboard.stats.total_pois}</div>
        </div>

        <div className="popular-destinations">
          <h4>Popular Destinations</h4>
          {dashboard.stats.popular_destinations.map((dest, index) => (
            <div key={index} className="destination">
              {dest.name} ({dest.trip_count} trips)
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

Performance & Caching Notes

Client-Side Caching

- Authenticated users: Cache for 10-15 minutes (data changes more frequently)
- Anonymous users: Cache for 30+ minutes (more static content)
- Invalidate cache when user logs in/out

Request Optimization

- The endpoint is already optimized with server-side caching
- No need for frequent polling - data doesn't change often
- Consider using the timestamp field to implement conditional requests

Error Handling

- Handle 401 errors for expired authentication
- Implement retry logic for network failures
- Provide meaningful fallback UI for error states

Testing the Endpoint

# Test anonymous access
curl -H "Content-Type: application/json" http://localhost:4001/api/dashboard

# Test authenticated access
curl -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:4001/api/dashboard

Cache Management

The dashboard uses intelligent caching:
- Cache Key: dashboard:user:{user_id} or dashboard:anonymous
- TTL: 15 minutes (auth) / 1 hour (anonymous)
- Invalidation: Automatic on user data changes

You can also use Mix tasks for cache management:
mix cache.stats           # View cache statistics
mix cache.clear           # Clear all cache
mix cache.invalidate 123  # Clear specific user cache

Questions?

If you need additional endpoints or modifications to the data structure, let the backend team know!

This guide gives your frontend team everything they need to implement the dashboard integratio
```
