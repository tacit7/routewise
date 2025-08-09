/**
 * API Configuration for Route Wise Frontend
 * Handles backend URL configuration and request utilities with Google OAuth integration
 */

import { googleAuth } from '@/services/GoogleAuth';

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
    ROUTES: '/api/routes',
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
 * Default fetch options for API calls with Google authentication
 */
export const getDefaultFetchOptions = (options: RequestInit = {}): RequestInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Add Google ID token if user is authenticated
  const idToken = googleAuth.getIdToken();
  if (idToken && googleAuth.isAuthenticated()) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  return {
    credentials: 'include',
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
 * Google Authentication utilities for API calls
 */
export const AuthManager = {
  /**
   * Get Google ID token
   */
  getToken(): string | null {
    return googleAuth.getIdToken();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return googleAuth.isAuthenticated();
  },

  /**
   * Get authorization header for API calls
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token && this.isAuthenticated() ? { Authorization: `Bearer ${token}` } : {};
  },

  /**
   * Get current user information
   */
  getCurrentUser() {
    return googleAuth.getCurrentUser();
  },
};

// Legacy TokenManager for backward compatibility
export const TokenManager = {
  getToken: () => AuthManager.getToken(),
  setToken: () => { /* No-op - Google tokens are managed by GoogleAuth service */ },
  removeToken: () => { /* No-op - Google tokens are managed by GoogleAuth service */ },
  getAuthHeader: () => AuthManager.getAuthHeader(),
};

/**
 * Enhanced API call with Google authentication
 */
export const authenticatedApiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Check if user is authenticated
  if (!AuthManager.isAuthenticated()) {
    throw new Error('User not authenticated');
  }

  const authHeaders = AuthManager.getAuthHeader();
  const enhancedOptions = {
    ...options,
    headers: {
      ...getDefaultFetchOptions(options).headers,
      ...authHeaders,
      ...options.headers,
    },
  };

  return apiCall<T>(endpoint, enhancedOptions);
};

/**
 * API call wrapper that automatically includes Google ID token if available
 */
export const googleApiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Use enhanced fetch options that automatically include Google ID token
  return apiCall<T>(endpoint, options);
};