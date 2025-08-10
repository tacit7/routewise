import { useState, useCallback, useRef, useEffect } from 'react';
import { useCityAutocomplete } from './use-city-autocomplete';

interface PlaceSuggestion {
  place_id?: string;
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

  const [currentQuery, setCurrentQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  // Use cached city autocomplete hook
  const {
    data: suggestions = [],
    isLoading,
    error: queryError,
    isError,
  } = useCityAutocomplete(debouncedQuery, { limit, countries });

  // Convert query error to string
  const error = isError 
    ? (queryError instanceof Error ? queryError.message : 'Failed to fetch suggestions')
    : null;

  // Debounce query updates
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(currentQuery);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [currentQuery, debounceMs]);

  const fetchSuggestions = useCallback((query: string) => {
    console.log('🔍 Fetching suggestions for:', query);
    if (query.length < minLength) {
      setCurrentQuery('');
      setDebouncedQuery('');
      return;
    }
    
    setCurrentQuery(query);
  }, [minLength]);

  const clearSuggestions = useCallback(() => {
    setCurrentQuery('');
    setDebouncedQuery('');
    
    // Cancel any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  return {
    suggestions,
    isLoading: isLoading && debouncedQuery.length >= minLength,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
}
