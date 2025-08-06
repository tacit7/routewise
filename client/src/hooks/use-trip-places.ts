import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Poi } from '@/types/schema';
import { useToast } from './use-toast';

export interface TripPlace extends Poi {
  addedAt: string;
  order: number;
}

// Trip management hook with TanStack Query integration
export function useTripPlaces() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  // Query for trip places with localStorage as source of truth
  const {
    data: tripPlaces = [],
    isLoading,
    error
  } = useQuery<TripPlace[]>({
    queryKey: ['tripPlaces'],
    queryFn: async (): Promise<TripPlace[]> => {
      const saved = localStorage.getItem('tripPlaces');
      if (saved) {
        const places = JSON.parse(saved) as Poi[];
        // Convert to TripPlace format with metadata
        return places.map((place, index) => ({
          ...place,
          addedAt: new Date().toISOString(),
          order: index
        }));
      }
      return [];
    },
    staleTime: 0, // Always fresh for localStorage
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tripPlaces') {
        queryClient.invalidateQueries({ queryKey: ['tripPlaces'] });
      }
    };

    const handleTripUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['tripPlaces'] });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tripUpdated', handleTripUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tripUpdated', handleTripUpdate);
    };
  }, [queryClient]);

  // Add POI to trip mutation
  const addToTripMutation = useMutation({
    mutationFn: async (poi: Poi): Promise<TripPlace[]> => {
      const current = tripPlaces || [];
      const poiIdentifier = poi.placeId || poi.id;
      
      // Check if already exists
      const exists = current.some(p => (p.placeId || p.id) === poiIdentifier);
      if (exists) {
        throw new Error('Place already in trip');
      }

      const newTripPlace: TripPlace = {
        ...poi,
        addedAt: new Date().toISOString(),
        order: current.length
      };

      const updated = [...current, newTripPlace];
      
      // Update localStorage
      localStorage.setItem('tripPlaces', JSON.stringify(updated.map(({ addedAt, order, ...poi }) => poi)));
      
      // Dispatch event for other components
      window.dispatchEvent(new Event('tripUpdated'));
      
      return updated;
    },
    onSuccess: (data, poi) => {
      queryClient.setQueryData(['tripPlaces'], data);
      toast({
        title: "Added to trip!",
        description: `${poi.name} has been added to your trip.`,
      });
    },
    onError: (error: Error, poi) => {
      if (error.message === 'Place already in trip') {
        toast({
          title: "Already in trip",
          description: `${poi.name} is already in your trip.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add place to trip. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Remove POI from trip mutation
  const removeFromTripMutation = useMutation({
    mutationFn: async (poiId: number): Promise<TripPlace[]> => {
      const current = tripPlaces || [];
      const updated = current.filter(place => place.id !== poiId);
      
      // Update localStorage
      localStorage.setItem('tripPlaces', JSON.stringify(updated.map(({ addedAt, order, ...poi }) => poi)));
      
      // Dispatch event
      window.dispatchEvent(new Event('tripUpdated'));
      
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['tripPlaces'], data);
      toast({
        title: "Removed from trip",
        description: "Place has been removed from your trip.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove place from trip. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Clear all trip places mutation
  const clearTripMutation = useMutation({
    mutationFn: async (): Promise<TripPlace[]> => {
      localStorage.removeItem('tripPlaces');
      window.dispatchEvent(new Event('tripUpdated'));
      return [];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['tripPlaces'], data);
      toast({
        title: "Trip cleared",
        description: "All places have been removed from your trip.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear trip. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Reorder trip places mutation
  const reorderTripMutation = useMutation({
    mutationFn: async (reorderedPlaces: TripPlace[]): Promise<TripPlace[]> => {
      const updated = reorderedPlaces.map((place, index) => ({
        ...place,
        order: index
      }));
      
      localStorage.setItem('tripPlaces', JSON.stringify(updated.map(({ addedAt, order, ...poi }) => poi)));
      window.dispatchEvent(new Event('tripUpdated'));
      
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['tripPlaces'], data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder trip places. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Check if a POI is in the trip
  const isInTrip = (poi: Poi): boolean => {
    if (!tripPlaces) return false;
    const poiIdentifier = poi.placeId || poi.id;
    return tripPlaces.some(p => (p.placeId || p.id) === poiIdentifier);
  };

  // Get trip statistics
  const tripStats = {
    count: tripPlaces?.length || 0,
    categories: tripPlaces?.reduce((acc, place) => {
      acc[place.category] = (acc[place.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    averageRating: tripPlaces?.length 
      ? tripPlaces.reduce((sum, place) => sum + parseFloat(place.rating), 0) / tripPlaces.length 
      : 0
  };

  return {
    // Data
    tripPlaces: tripPlaces || [],
    tripStats,
    isLoading,
    error,

    // Actions
    addToTrip: addToTripMutation.mutate,
    removeFromTrip: removeFromTripMutation.mutate,
    clearTrip: clearTripMutation.mutate,
    reorderTrip: reorderTripMutation.mutate,

    // Utilities
    isInTrip,
    
    // Loading states
    isAddingToTrip: addToTripMutation.isPending,
    isRemovingFromTrip: removeFromTripMutation.isPending,
    isClearingTrip: clearTripMutation.isPending,
    isReorderingTrip: reorderTripMutation.isPending,
  };
}