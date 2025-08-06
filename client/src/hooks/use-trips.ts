import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-context';
import { authenticatedApiCall, API_CONFIG } from '@/lib/api-config';

export interface Trip {
  id: number;
  title: string;
  start_city: string;
  end_city: string;
  checkpoints: { stops: string[] } | string[];
  route_data: {
    distance: string;
    duration: string;
    start_address: string;
    end_address: string;
    polyline: string;
    legs: {
      distance: string;
      duration: string;
      start_address: string;
      end_address: string;
      start_location: { lat: number; lng: number };
      end_location: { lat: number; lng: number };
    }[];
    route_points: { lat: number; lng: number }[];
  } | {};
  pois_data: Array<{
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
  }> | {};
  is_public: boolean;
  user_id: number;
  // For backwards compatibility with frontend expectations
  startCity?: string;
  endCity?: string;
  routeData?: any;
  poisData?: any[];
  isPublic?: boolean;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LegacyRoute {
  id: string;
  name: string;
  startCity: string;
  endCity: string;
  placesCount: number;
  createdAt: string;
}

// Utility function to normalize Phoenix backend response to frontend expectations
const normalizeTrip = (trip: Trip): Trip => {
  return {
    ...trip,
    // Add backwards compatibility properties
    startCity: trip.start_city,
    endCity: trip.end_city,
    routeData: trip.route_data,
    poisData: Array.isArray(trip.pois_data) ? trip.pois_data : [],
    isPublic: trip.is_public,
    userId: trip.user_id,
    createdAt: trip.createdAt || new Date().toISOString(),
    updatedAt: trip.updatedAt || new Date().toISOString(),
  };
};

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [legacyRoutes, setLegacyRoutes] = useState<LegacyRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchTrips = async () => {
    if (!isAuthenticated || !user) {
      setTrips([]);
      setLoading(false);
      setError(null); // Clear any previous errors when not authenticated
      return;
    }

    try {
      const data = await authenticatedApiCall<{ data: Trip[] }>(API_CONFIG.ENDPOINTS.TRIPS);
      const normalizedTrips = (data.data || []).map(normalizeTrip);
      setTrips(normalizedTrips);
      setError(null);
    } catch (err) {
      console.error('Error fetching trips:', err);
      // Only set error for non-authentication issues
      if (err instanceof Error && !err.message.includes('401')) {
        setError(err.message);
      } else {
        setError(null);
        setTrips([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (tripId: number): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      await authenticatedApiCall(`${API_CONFIG.ENDPOINTS.TRIPS}/${tripId}`, {
        method: 'DELETE',
      });

      // Remove the trip from local state
      setTrips(prev => prev.filter(trip => trip.id !== tripId));
      setError(null);
      return true;
    } catch (err) {
      console.error('Error deleting trip:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete trip');
      return false;
    }
  };

  const createTripFromWizard = async (wizardData: {
    startLocation: { main_text: string; description: string };
    endLocation: { main_text: string; description: string };
    stops?: Array<{ main_text: string; description: string }>;
    tripType?: string;
  }, calculateRoute = true): Promise<Trip | null> => {
    if (!isAuthenticated || !user) {
      return null;
    }

    try {
      const data = await authenticatedApiCall<{ data: Trip }>(
        API_CONFIG.ENDPOINTS.TRIPS_FROM_WIZARD,
        {
          method: 'POST',
          body: JSON.stringify({
            wizard_data: wizardData,
            calculate_route: calculateRoute,
          }),
        }
      );

      const normalizedTrip = normalizeTrip(data.data);
      
      // Add to local state
      setTrips(prev => [...prev, normalizedTrip]);
      setError(null);
      
      return normalizedTrip;
    } catch (err) {
      console.error('Error creating trip:', err);
      setError(err instanceof Error ? err.message : 'Failed to create trip');
      return null;
    }
  };

  const deleteLegacyRoute = (routeId: string) => {
    const routes = legacyRoutes.filter(r => r.id !== routeId);
    localStorage.setItem('myRoutes', JSON.stringify(routes));
    setLegacyRoutes(routes);
  };

  // Load legacy routes from localStorage
  useEffect(() => {
    const routes = JSON.parse(localStorage.getItem('myRoutes') || '[]');
    setLegacyRoutes(routes);
  }, []);

  // Fetch trips when user authentication changes
  useEffect(() => {
    fetchTrips();
  }, [isAuthenticated, user]);

  return {
    trips,
    legacyRoutes,
    loading,
    error,
    refetch: fetchTrips,
    deleteTrip,
    deleteLegacyRoute,
    createTripFromWizard,
  };
};