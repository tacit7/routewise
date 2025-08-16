/**
 * API Configuration for Route Wise Frontend
 * Handles backend URL configuration and request utilities with server-side OAuth
 */

// Dynamic backend URL configuration for development and mobile access
const getBackendUrl = (): string => {
  // Check if we have an environment override
  if (typeof window !== 'undefined' && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For mobile/network access, use the current host's IP with backend port
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      return `http://${currentHost}:4001`;
    }
  }
  
  // Default to localhost for local development
  return 'http://localhost:4001';
};

const BACKEND_URL = getBackendUrl();

export const API_CONFIG = {
  BASE_URL: BACKEND_URL,
  ENDPOINTS: {
    // Trips
    TRIPS: '/api/trips',
    TRIPS_FROM_WIZARD: '/api/trips/from_wizard',
    
    // Places
    PLACES_SEARCH: '/api/places/search',
    PLACES_DETAILS: '/api/places/details',
    
    // Routes
    ROUTES_CALCULATE: '/api/routes/calculate',
    ROUTES_WIZARD: '/api/routes/wizard', 
    ROUTES_OPTIMIZE: '/api/routes/optimize',
    ROUTES_ALTERNATIVES: '/api/routes/alternatives',
    ROUTES_ESTIMATE: '/api/routes/estimate',
    ROUTES_COSTS: '/api/routes/costs',
    ROUTE_RESULTS: '/api/route-results',
    
    // Places Autocomplete
    PLACES_AUTOCOMPLETE: '/api/places/autocomplete',
  }
} as const;

/**
 * Create full API URL
 */
export const createApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Default fetch options for API calls with server-side authentication
 */
export const getDefaultFetchOptions = (options: RequestInit = {}): RequestInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  return {
    credentials: 'include', // Important: Include HTTP-only cookies
    headers,
    ...options,
  };
};

/**
 * API call wrapper with error handling for Express.js backend
 */
export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = createApiUrl(endpoint);
  const response = await fetch(url, getDefaultFetchOptions(options));
  
  if (!response.ok) {
    // Try to get error details from Express.js backend
    try {
      const errorData = await response.json();
      const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    } catch (parseError) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
  
  return response.json();
};

/**
 * Server-side Authentication utilities for API calls
 * Note: Authentication is now handled via HTTP-only cookies
 */
export const AuthManager = {
  /**
   * Check authentication status via server
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  },
};

// Legacy TokenManager for backward compatibility
export const TokenManager = {
  getToken: () => null, // No tokens with server-side auth
  setToken: () => { /* No-op - Auth handled server-side */ },
  removeToken: () => { /* No-op - Auth handled server-side */ },
  getAuthHeader: () => ({}), // No auth headers needed
};

/**
 * Enhanced API call with server-side authentication
 * Uses HTTP-only cookies for authentication
 */
export const authenticatedApiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Server-side auth doesn't require client-side auth checks
  // The backend will handle authentication via HTTP-only cookies
  return apiCall<T>(endpoint, options);
};

/**
 * Alias for consistency with server-side OAuth
 */
export const googleApiCall = authenticatedApiCall;