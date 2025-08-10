import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-context';
import { authenticatedApiCall, apiCall } from '@/lib/api-config';

export interface DashboardData {
  trips: {
    user_trips: Trip[];
    suggested_trips: SuggestedTrip[];
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

export interface Trip {
  id: number;
  title: string;
  start_city: string;
  end_city: string;
  route_data: {
    distance: string;
    duration: string;
  };
  pois_data: any[];
  is_public: boolean;
  user_id: number;
}

export interface SuggestedTrip {
  id: string;
  title: string;
  start_city?: string;  // Optional for exploratory/area suggestions
  end_city?: string;    // Optional for exploratory/area suggestions
  distance?: string;    // Flat structure to match backend
  duration?: string;    // Flat structure to match backend
  route_data?: {        // Optional nested structure for route-based trips
    distance: string;
    duration: string;
  };
  is_public?: boolean;  // Optional, not all suggestions have this
  user_id?: number | null;
  image_url: string;
  description: string;
  featured?: boolean;   // Backend includes this field
}

export interface InterestCategory {
  id: number;
  name: string;
  display_name: string;
  icon: string;
  color: string;
}

export function useDashboardData() {
  const { user, isAuthenticated } = useAuth();

  console.log('🔍 Dashboard Hook Called:', { 
    user: user?.id || 'null', 
    isAuthenticated, 
    enabled: isAuthenticated && !!user,
    queryWillRun: isAuthenticated && !!user 
  });

  const query = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      console.log('📡 DASHBOARD API CALL STARTING - NETWORK REQUEST WILL BE MADE');
      
      if (!isAuthenticated || !user) {
        console.log('❌ Auth check failed:', { isAuthenticated, user });
        throw new Error('User not authenticated');
      }
      
      console.log('🚀 Calling apiCall directly (bypassing AuthManager)...');
      try {
        const response = await apiCall<{ success: true; data: DashboardData }>('/api/dashboard');
        console.log('📦 Dashboard response received:', response);
        console.log('🖼️ Image URLs:', response.data?.trips?.suggested_trips?.map(trip => ({ title: trip.title, image_url: trip.image_url })));
        return response.data;
      } catch (error) {
        console.error('💥 Dashboard API call failed:', error);
        console.error('💥 Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          cause: error.cause
        });
        throw error;
      }
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Log TanStack Query state changes
  console.log('📊 TanStack Query State:', {
    status: query.status,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
    isStale: query.isStale,
    dataUpdatedAt: query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toLocaleTimeString() : 'never',
    errorUpdatedAt: query.errorUpdatedAt ? new Date(query.errorUpdatedAt).toLocaleTimeString() : 'never',
    failureCount: query.failureCount,
    failureReason: query.failureReason?.message,
    fetchStatus: query.fetchStatus
  });

  // Log when data is served from cache vs network
  if (query.isSuccess && query.data) {
    if (query.isFetching) {
      console.log('🌐 Dashboard data: FETCHING FROM NETWORK');
    } else {
      console.log('💾 Dashboard data: SERVED FROM CACHE');
    }
    console.log('🎯 Suggested trips count:', query.data?.trips?.suggested_trips?.length || 0);
  }

  return query;
}