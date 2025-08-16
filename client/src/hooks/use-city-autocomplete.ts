import { useQuery, useQueryClient } from '@tanstack/react-query';

interface City {
  id: string;
  place_id: string;
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  state: string;
  country: string;
  country_code: string;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface UnifiedAutocompleteResponse {
  status: 'success' | 'error';
  data?: {
    input: string;
    types_requested: string[];
    suggestions: {
      [key: string]: PlaceSuggestion[];
    };
    total_count: number;
    breakdown: { [key: string]: number };
  };
  message?: string;
}

interface UseCityAutocompleteOptions {
  limit?: number;
  countries?: string;
}

// Normalize query for consistent caching
const normalizeQuery = (query: string): string => {
  return query.toLowerCase().trim();
};

// Transform API response to PlaceSuggestion format
const transformCitiesToSuggestions = (cities: City[]): PlaceSuggestion[] => {
  return cities.map((city) => ({
    place_id: city.place_id,
    description: city.display_name,
    main_text: city.name,
    secondary_text: `${city.state}, ${city.country}`,
    geometry: {
      location: {
        lat: city.lat,
        lng: city.lon,
      },
    },
  }));
};

export function useCityAutocomplete(
  query: string,
  options: UseCityAutocompleteOptions = {}
) {
  const { limit = 10, countries = 'us,ca,mx' } = options;
  const normalizedQuery = normalizeQuery(query);

  return useQuery({
    queryKey: ['cities', normalizedQuery, limit, countries],
    queryFn: async (): Promise<PlaceSuggestion[]> => {
      if (normalizedQuery.length < 2) {
        return [];
      }

      const params = new URLSearchParams({
        input: normalizedQuery,
      });

      const response = await fetch(
        `/api/places/autocomplete?${params.toString()}`
      );

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = response.statusText;
        }
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Invalid response from server');
      }
      
      if (data.status === 'success' && data.data?.suggestions) {
        // Handle both old and new Phoenix backend response formats
        const transformedSuggestions = data.data.suggestions.map((suggestion: any) => {
          let transformedSuggestion;
          
          // New format: Google Places API format with structured_formatting
          if (suggestion.structured_formatting) {
            transformedSuggestion = {
              place_id: suggestion.place_id,
              description: suggestion.description,
              main_text: suggestion.structured_formatting.main_text,
              secondary_text: suggestion.structured_formatting.secondary_text,
              geometry: suggestion.geometry,
            };
          }
          // Old format: Custom Phoenix format
          else {
            transformedSuggestion = {
              place_id: suggestion.id || suggestion.place_id,
              description: `${suggestion.name}, ${suggestion.state}`,
              main_text: suggestion.name,
              secondary_text: suggestion.state,
              geometry: {
                location: {
                  lat: suggestion.lat,
                  lng: suggestion.lng || suggestion.lon,
                },
              },
            };
          }
          
          
          return transformedSuggestion;
        });
        
        return transformedSuggestions;
      } else {
        throw new Error(data.message || 'No suggestions available');
      }
    },
    enabled: normalizedQuery.length >= 2, // Only fetch for queries 2+ chars
    staleTime: 1000 * 60 * 30, // 30 minutes - cities don't change often  
    gcTime: 1000 * 60 * 60 * 2, // 2 hours garbage collection
    refetchOnWindowFocus: false, // Prevent unnecessary refetch
    refetchOnReconnect: true, // Refetch on network reconnect
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for prefetching popular cities
export function useCityPrefetch() {
  const queryClient = useQueryClient();

  const prefetchPopularCities = async (countries = 'us,ca,mx') => {
    const popularQueries = [
      'new', 'los', 'chi', 'san', 'mia', 'las', 'sea', 'den', 'aus', 'dal',
      'tor', 'van', 'mon', 'cal', 'ott', // CA cities
      'mex', 'gua', 'can', // MX cities
    ];

    // Prefetch popular queries in background
    for (const query of popularQueries) {
      queryClient.prefetchQuery({
        queryKey: ['cities', query, 10, countries],
        queryFn: async () => {
          const params = new URLSearchParams({
            input: query,
          });

          try {
            const response = await fetch(
              `/api/places/autocomplete?${params.toString()}`
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'success' && data.data?.suggestions) {
                return data.data.suggestions.map((suggestion: any) => ({
                  place_id: suggestion.place_id,
                  description: suggestion.description,
                  main_text: suggestion.structured_formatting.main_text,
                  secondary_text: suggestion.structured_formatting.secondary_text,
                }));
              }
            }
          } catch (error) {
            // Silently fail prefetch attempts
            console.debug(`Prefetch failed for query: ${query}`, error);
          }
          
          return [];
        },
        staleTime: 1000 * 60 * 30,
      });
    }
  };

  return { prefetchPopularCities };
}

// Utility to invalidate city cache
export function useCityCacheUtils() {
  const queryClient = useQueryClient();

  const invalidateAllCities = () => {
    queryClient.invalidateQueries({ queryKey: ['cities'] });
  };

  const invalidateCitiesByCountry = (countries: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['cities'],
      predicate: (query) => {
        const [, , , queryCountries] = query.queryKey;
        return queryCountries === countries;
      }
    });
  };

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const cityQueries = cache.findAll({ queryKey: ['cities'] });
    
    return {
      totalCachedQueries: cityQueries.length,
      cacheSize: cityQueries.reduce((acc, query) => {
        const data = query.state.data as PlaceSuggestion[] | undefined;
        return acc + (data?.length || 0);
      }, 0),
      hitRate: 'Use React Query DevTools for detailed metrics'
    };
  };

  return {
    invalidateAllCities,
    invalidateCitiesByCountry,
    getCacheStats,
  };
}