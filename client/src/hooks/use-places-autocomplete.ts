import { useState, useCallback, useRef } from 'react';

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

interface UsePlacesAutocompleteOptions {
  limit?: number;
  countries?: string;
  debounceMs?: number;
  minLength?: number;
}

export function usePlacesAutocomplete(options: UsePlacesAutocompleteOptions = {}) {
  const {
    limit = 10,
    countries = 'us,ca,mx',
    debounceMs = 300,
    minLength = 2,
  } = options;

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < minLength) {
      setSuggestions([]);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        countries: countries,
      });

      const response = await fetch(
        `/api/places/city-autocomplete?${params.toString()}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data?.cities) {
        // Transform your API response to PlaceSuggestion format
        const transformedSuggestions: PlaceSuggestion[] = data.data.cities.map((city: City) => ({
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
        
        setSuggestions(transformedSuggestions);
      } else {
        setSuggestions([]);
        if (data.status !== 'success') {
          setError(data.message || 'No suggestions available');
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      
      console.error('Error fetching city autocomplete suggestions:', err);
      setSuggestions([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [limit, countries, minLength]);

  const debouncedFetch = useCallback((query: string) => {
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce API calls
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceMs);
  }, [fetchSuggestions, debounceMs]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    
    // Cancel any pending requests
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions: debouncedFetch,
    clearSuggestions,
  };
}
