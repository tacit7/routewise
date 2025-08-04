import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-context';

export interface Trip {
  id: number;
  title: string;
  startCity: string;
  endCity: string;
  checkpoints: string[];
  routeData: {
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
  } | null;
  poisData: Array<{
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
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number | null;
}

export interface LegacyRoute {
  id: string;
  name: string;
  startCity: string;
  endCity: string;
  placesCount: number;
  createdAt: string;
}

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
      const response = await fetch('/api/trips', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Authentication error - silently handle and clear trips
          setTrips([]);
          setError(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tripsData = await response.json();
      setTrips(tripsData);
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
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
  };
};