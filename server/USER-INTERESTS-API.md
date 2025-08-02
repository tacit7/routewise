# User Interests API Documentation

## Overview

The User Interests API enables personalized trip recommendations by allowing users to specify their travel preferences. The system matches user interests with POI categories to generate customized trip suggestions.

## Base URL
All endpoints are prefixed with `/api`

## Authentication
- **Required**: JWT token in Authorization header (`Bearer <token>`) or auth_token cookie
- **Error Response**: `401 Unauthorized` if token missing/invalid

## API Endpoints

### 1. Get Interest Categories
Get all available interest categories that users can select.

```http
GET /api/interests/categories
```

**Authentication**: None required

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "restaurants",
    "displayName": "Restaurants",
    "description": "Dining establishments and food venues",
    "iconName": "utensils",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "name": "attractions",
    "displayName": "Tourist Attractions", 
    "description": "Must-see attractions and points of interest",
    "iconName": "camera",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Available Categories**:
- `restaurants` - Dining establishments and food venues
- `attractions` - Tourist attractions and points of interest  
- `parks` - Parks, gardens, and natural areas
- `scenic_spots` - Beautiful views and scenic locations
- `historic_sites` - Historical landmarks and cultural sites
- `markets` - Shopping areas, markets, and stores
- `outdoor_activities` - Outdoor recreation and adventure spots
- `cultural_sites` - Museums, galleries, and cultural venues
- `shopping` - Malls, retail centers, and shopping districts
- `nightlife` - Bars, clubs, and entertainment venues

### 2. Get User Interests
Get the current user's interest preferences.

```http
GET /api/users/{userId}/interests
```

**Authentication**: Required (must be requesting user's own interests)

**Parameters**:
- `userId` (path) - User ID (must match authenticated user)

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "userId": 123,
    "categoryId": 1,
    "isEnabled": true,
    "priority": 2,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "category": {
      "id": 1,
      "name": "restaurants",
      "displayName": "Restaurants",
      "description": "Dining establishments and food venues",
      "iconName": "utensils",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
]
```

**Error Responses**:
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied (not user's own interests)
- `400 Bad Request` - Invalid user ID

### 3. Update User Interests
Update the user's interest preferences.

```http
PUT /api/users/{userId}/interests
```

**Authentication**: Required (must be updating user's own interests)

**Parameters**:
- `userId` (path) - User ID (must match authenticated user)

**Request Body** (Option 1 - Enable All):
```json
{
  "enableAll": true
}
```

**Request Body** (Option 2 - Custom Selection):
```json
{
  "interests": [
    {
      "categoryId": 1,
      "isEnabled": true,
      "priority": 2
    },
    {
      "categoryId": 3,
      "isEnabled": false,
      "priority": 1
    }
  ]
}
```

**Field Descriptions**:
- `enableAll` (boolean, optional) - Enable all available interest categories
- `interests` (array, optional) - Custom interest selection
  - `categoryId` (number, required) - Interest category ID
  - `isEnabled` (boolean, required) - Whether this interest is enabled
  - `priority` (number, optional) - Priority level 1-5 (default: 1)

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "userId": 123,
    "categoryId": 1,
    "isEnabled": true,
    "priority": 2,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "category": {
      "id": 1,
      "name": "restaurants",
      "displayName": "Restaurants",
      "description": "Dining establishments and food venues",
      "iconName": "utensils",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
]
```

**Error Responses**:
- `400 Bad Request` - Invalid request body or category IDs
- `401 Unauthorized` - Authentication required  
- `403 Forbidden` - Access denied

### 4. Get Suggested Trips
Get personalized trip suggestions based on user interests.

```http
GET /api/trips/suggested?limit=5
```

**Authentication**: Required

**Query Parameters**:
- `limit` (number, optional) - Number of trips to return (1-20, default: 5)

**Response**: `200 OK`
```json
[
  {
    "id": "austin-san-antonio",
    "title": "Texas Hill Country Adventure", 
    "description": "Explore the beautiful Hill Country between Austin and San Antonio",
    "startCity": "Austin",
    "endCity": "San Antonio",
    "estimatedDuration": "3-4 hours",
    "estimatedDistance": "80 miles",
    "matchingInterests": ["restaurants", "scenic_spots", "historic_sites"],
    "score": 85,
    "imageUrl": "https://images.unsplash.com/photo-1534330980078...",
    "pois": [
      {
        "id": 1,
        "name": "Hill Country BBQ",
        "description": "Authentic Texas BBQ experience",
        "category": "restaurant",
        "rating": "4.5",
        "reviewCount": 342,
        "timeFromStart": "1.5 hours in",
        "imageUrl": "https://images.unsplash.com/photo-...",
        "address": "123 BBQ Lane, Austin, TX",
        "isOpen": true
      }
    ]
  }
]
```

**Field Descriptions**:
- `score` (number) - Interest matching score (0-100)
- `matchingInterests` (array) - User interests that match this trip
- `pois` (array) - Relevant points of interest filtered by user interests

**Rate Limiting**: 10 requests per 5 minutes per user

**Error Responses**:
- `401 Unauthorized` - Authentication required
- `400 Bad Request` - Invalid limit parameter
- `429 Too Many Requests` - Rate limit exceeded

### 5. Get Suggested Trip by ID
Get details for a specific suggested trip.

```http
GET /api/trips/suggested/{tripId}
```

**Authentication**: Optional (enhanced results if authenticated)

**Parameters**:
- `tripId` (path) - Trip identifier (e.g., "austin-san-antonio")

**Response**: `200 OK`
```json
{
  "id": "austin-san-antonio",
  "title": "Texas Hill Country Adventure",
  "description": "Explore the beautiful Hill Country between Austin and San Antonio", 
  "startCity": "Austin",
  "endCity": "San Antonio",
  "estimatedDuration": "3-4 hours",
  "estimatedDistance": "80 miles",
  "matchingInterests": ["restaurants", "scenic_spots"],
  "score": 85,
  "imageUrl": "https://images.unsplash.com/photo-1534330980078...",
  "pois": [...]
}
```

**Error Responses**:
- `404 Not Found` - Trip not found

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"] // Optional validation errors
}
```

## Integration Examples

### TypeScript Types

```typescript
interface InterestCategory {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  iconName: string | null;
  isActive: boolean;
  createdAt: string;
}

interface UserInterest {
  id: number;
  userId: number;
  categoryId: number;
  isEnabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  category: InterestCategory;
}

interface SuggestedTrip {
  id: string;
  title: string;
  description: string;
  startCity: string;
  endCity: string;
  estimatedDuration: string;
  estimatedDistance: string;
  matchingInterests: string[];
  score: number;
  imageUrl?: string;
  pois: POI[];
}
```

### React Hook Example

```typescript
// Custom hook for managing user interests
function useUserInterests(userId: number) {
  const [interests, setInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/interests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setInterests(data);
    } catch (error) {
      console.error('Failed to fetch interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInterests = async (interests: {categoryId: number, isEnabled: boolean}[]) => {
    try {
      const response = await fetch(`/api/users/${userId}/interests`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ interests })
      });
      const data = await response.json();
      setInterests(data);
      return data;
    } catch (error) {
      console.error('Failed to update interests:', error);
      throw error;
    }
  };

  return { interests, loading, fetchInterests, updateInterests };
}
```

## Best Practices

1. **Caching**: Cache interest categories as they rarely change
2. **Error Handling**: Always handle 401/403 errors for authentication 
3. **Loading States**: Show loading indicators during API calls
4. **Rate Limiting**: Implement client-side debouncing for suggested trips
5. **Fallback UI**: Handle empty interests gracefully
6. **Progressive Enhancement**: Use suggested trips to enhance existing trip planning

## Changelog

- **v1.0.0** - Initial release with basic interests and suggestions
- Added rate limiting for suggested trips endpoint
- Added comprehensive validation and error handling