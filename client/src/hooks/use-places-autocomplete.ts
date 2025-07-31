import { useState, useCallback, useRef } from 'react';

interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface UsePlacesAutocompleteOptions {
  types?: string;
  debounceMs?: number;
  minLength?: number;
}

export function usePlacesAutocomplete(options: UsePlacesAutocompleteOptions = {}) {
  const {
    types = '(cities)',
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
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(query)}&types=${encodeURIComponent(types)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.predictions) {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
        setError('No suggestions available');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      
      console.error('Error fetching autocomplete suggestions:', err);
      setSuggestions([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [types, minLength]);

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
