// Types for Route-Wise application
// Replaces shared schema after migrating to Phoenix backend

export interface Poi {
  id: number;
  placeId: string;
  name: string;
  address: string;
  rating: string;
  category: string;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
  scheduledTime?: string; // Format: "HH:MM" (24-hour)
  
  // Core POI data
  imageUrl?: string;
  description?: string;
  isOpen?: boolean | null;
  priceLevel?: number;
  reviewCount?: number;
  timeFromStart?: string;
  
  // Enhanced POI fields from new API response
  accessibility?: string;
  bestTimeToVisit?: string;
  durationSuggested?: string;
  entryFee?: string | null;
  hiddenGem?: boolean;
  hiddenGemReason?: string | null;
  overrated?: boolean;
  overratedReason?: string | null;
  tips?: string[];
  relatedPlaces?: string[];
  placeTypes?: string[];
  popularityScore?: number;
  source?: string;
  phoneNumber?: string | null;
  website?: string | null;
  openingHours?: string | null;
  localName?: string | null;
  tripadvisorRating?: string | null;
  tripadvisorReviewCount?: number | null;
  tripadvisorUrl?: string | null;
  googlePlaceId?: string;
  cachedAt?: string;
  lastUpdated?: string;
  
  // Alternative coordinate format support
  latitude?: number;
  longitude?: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type TripType = 'route' | 'explore';

export interface Trip {
  id: number;
  name: string;
  startLocation: string;
  endLocation: string;
  tripDate: string;
  tripType: TripType;
  createdAt: string;
  updatedAt: string;
}

export interface InterestCategory {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  iconName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UserInterest {
  id: number;
  userId: number;
  categoryId: number;
  isEnabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  category: InterestCategory;
}

// Multi-day route rendering types
export interface RouteSegment {
  encodedPolyline: string;
  totalDistance: string;
  totalDuration: string;
  waypointOrder: number[];
  startCoords: { lat: number; lng: number };
  endCoords: { lat: number; lng: number };
}

export interface ItineraryDay {
  day: number;
  title: string;
  waypoints: Array<{
    lat: number;
    lng: number;
    name: string;
    address?: string;
  }>;
  pois?: Poi[];
  route?: RouteSegment;
  color?: string;
}

export interface MultiDayItinerary {
  itinerary: ItineraryDay[];
  totalDays: number;
  startLocation: string;
  endLocation: string;
}

export interface MultiDayRouteData {
  itinerary: MultiDayItinerary;
  routesByDay: Record<number, RouteSegment>;
  allPois: Poi[];
}