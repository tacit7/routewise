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

  const query = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      const response = await apiCall<{ success: true; data: DashboardData }>('/api/dashboard');
      
      
      return response.data;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Only log if there's an error
  if (query.isError) {
    console.error('❌ Dashboard failed:', query.error);
  }

  return query;
}