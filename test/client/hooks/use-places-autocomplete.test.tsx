import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete';
import { server } from '../../setup';
import { http, HttpResponse } from 'msw';

// Mock timers for debouncing tests
vi.useFakeTimers();

describe('usePlacesAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePlacesAutocomplete());

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.fetchSuggestions).toBe('function');
    expect(typeof result.current.clearSuggestions).toBe('function');
  });

  it('should accept custom configuration options', () => {
    const { result } = renderHook(() => 
      usePlacesAutocomplete({
        types: '(regions)',
        debounceMs: 500,
        minLength: 3,
      })
    );

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch suggestions for short queries', async () => {
    server.use(
      http.get('/api/places/autocomplete', () => {
        return HttpResponse.json({
          predictions: [
            {
              place_id: '1',
              description: 'San Francisco, CA, USA',
              structured_formatting: {
                main_text: 'San Francisco',
                secondary_text: 'CA, USA'
              }
            }
          ]
        });
      })
    );

    const { result } = renderHook(() => usePlacesAutocomplete({ minLength: 3 }));

    // Fetch with short query
    act(() => {
      result.current.fetchSuggestions('ab');
    });

    // Should not make API call or update state
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should debounce API calls', async () => {
    let apiCallCount = 0;
    server.use(
      http.get('/api/places/autocomplete', () => {
        apiCallCount++;
        return HttpResponse.json({
          predictions: [
            {
              place_id: '1',
              description: 'San Francisco, CA, USA',
              structured_formatting: {
                main_text: 'San Francisco',
                secondary_text: 'CA, USA'
              }
            }
          ]
        });
      })
    );

    const { result } = renderHook(() => usePlacesAutocomplete({ debounceMs: 300 }));

    // Make multiple rapid calls
    act(() => {
      result.current.fetchSuggestions('san');
      result.current.fetchSuggestions('san f');
      result.current.fetchSuggestions('san fr');
    });

    // Should not have made any API calls yet
    expect(apiCallCount).toBe(0);

    // Fast-forward debounce timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should make only one API call
    await waitFor(() => {
      expect(apiCallCount).toBe(1);
    });
  });

  it('should fetch and parse suggestions successfully', async () => {
    server.use(
      http.get('/api/places/autocomplete', () => {
        return HttpResponse.json({
          predictions: [
            {
              place_id: '1',
              description: 'San Francisco, CA, USA',
              structured_formatting: {
                main_text: 'San Francisco',
                secondary_text: 'CA, USA'
              }
            },
            {
              place_id: '2',
              description: 'Los Angeles, CA, USA',
              structured_formatting: {
                main_text: 'Los Angeles',
                secondary_text: 'CA, USA'
              }
            }
          ]
        });
      })
    );

    const { result } = renderHook(() => usePlacesAutocomplete());

    // Fetch suggestions
    act(() => {
      result.current.fetchSuggestions('california cities');
    });

    // Should show loading state
    expect(result.current.isLoading).toBe(true);

    // Fast-forward debounce timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Wait for API response
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have parsed suggestions
    expect(result.current.suggestions).toHaveLength(2);
    expect(result.current.suggestions[0]).toMatchObject({
      place_id: '1',
      description: 'San Francisco, CA, USA',
      main_text: 'San Francisco',
      secondary_text: 'CA, USA'
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      http.get('/api/places/autocomplete', () => {
        return HttpResponse.json(
          { error: 'API Error' },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => usePlacesAutocomplete());

    // Fetch suggestions
    act(() => {
      result.current.fetchSuggestions('invalid query');
    });

    // Fast-forward debounce timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Wait for error
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have error state
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('should handle network errors', async () => {
    server.use(
      http.get('/api/places/autocomplete', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => usePlacesAutocomplete());

    // Fetch suggestions
    act(() => {
      result.current.fetchSuggestions('network error test');
    });

    // Fast-forward debounce timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Wait for error
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have error state
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('should clear suggestions', async () => {
    server.use(
      http.get('/api/places/autocomplete', () => {
        return HttpResponse.json({
          predictions: [
            {
              place_id: '1',
              description: 'San Francisco, CA, USA',
              structured_formatting: {
                main_text: 'San Francisco',
                secondary_text: 'CA, USA'
              }
            }
          ]
        });
      })
    );

    const { result } = renderHook(() => usePlacesAutocomplete());

    // Fetch suggestions first
    act(() => {
      result.current.fetchSuggestions('san francisco');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });

    // Clear suggestions
    act(() => {
      result.current.clearSuggestions();
    });

    // Should be cleared
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should cancel previous requests when new query is made', async () => {
    let firstRequestResolved = false;
    let secondRequestResolved = false;

    server.use(
      http.get('/api/places/autocomplete', async ({ request }) => {
        const url = new URL(request.url);
        const input = url.searchParams.get('input');
        
        if (input === 'first') {
          // Simulate slow first request
          await new Promise(resolve => setTimeout(resolve, 1000));
          firstRequestResolved = true;
          return HttpResponse.json({
            predictions: [
              {
                place_id: 'first',
                description: 'First Result',
                structured_formatting: {
                  main_text: 'First',
                  secondary_text: 'Result'
                }
              }
            ]
          });
        } else {
          // Fast second request
          secondRequestResolved = true;
          return HttpResponse.json({
            predictions: [
              {
                place_id: 'second',
                description: 'Second Result',
                structured_formatting: {
                  main_text: 'Second',
                  secondary_text: 'Result'
                }
              }
            ]
          });
        }
      })
    );

    const { result } = renderHook(() => usePlacesAutocomplete());

    // Make first request
    act(() => {
      result.current.fetchSuggestions('first');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Make second request before first completes
    act(() => {
      result.current.fetchSuggestions('second');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only have results from second request
    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].place_id).toBe('second');
  });

  it('should include types parameter in API request', async () => {
    let capturedTypes: string | null = null;
    
    server.use(
      http.get('/api/places/autocomplete', ({ request }) => {
        const url = new URL(request.url);
        capturedTypes = url.searchParams.get('types');
        
        return HttpResponse.json({
          predictions: []
        });
      })
    );

    const { result } = renderHook(() => 
      usePlacesAutocomplete({ types: '(cities)' })
    );

    // Fetch suggestions
    act(() => {
      result.current.fetchSuggestions('test query');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(capturedTypes).toBe('(cities)');
    });
  });

  it('should handle empty API response', async () => {
    server.use(
      http.get('/api/places/autocomplete', () => {
        return HttpResponse.json({
          predictions: []
        });
      })
    );

    const { result } = renderHook(() => usePlacesAutocomplete());

    // Fetch suggestions
    act(() => {
      result.current.fetchSuggestions('no results query');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have empty suggestions
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});