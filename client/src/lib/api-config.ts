/**
 * API Configuration for Route Wise Frontend
 * Handles backend URL configuration and request utilities
 */

// Phoenix backend configuration
const PHOENIX_BACKEND_URL = 'http://localhost:4001';

export const API_CONFIG = {
  BASE_URL: PHOENIX_BACKEND_URL,
  ENDPOINTS: {
    // Authentication
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    GOOGLE_AUTH: '/api/auth/google',
    
    // Trips
    TRIPS: '/api/trips',
    TRIPS_FROM_WIZARD: '/api/trips/from_wizard',
    
    // Places (if needed)
    PLACES_SEARCH: '/api/places/search',
    PLACES_DETAILS: '/api/places/details',
    
    // Routes (if needed)
    ROUTES: '/api/routes',
  }
} as const;

/**
 * Create full API URL
 */
export const createApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Default fetch options for API calls
 */
export const getDefaultFetchOptions = (options: RequestInit = {}): RequestInit => {
  return {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
};

/**
 * API call wrapper with error handling for Phoenix backend
 */
export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = createApiUrl(endpoint);
  const response = await fetch(url, getDefaultFetchOptions(options));
  
  if (!response.ok) {
    // Try to get error details from Phoenix backend
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
 * JWT Token utilities (for Phoenix backend with Bearer tokens)
 */
export const TokenManager = {
  /**
   * Get Bearer token from storage or cookie
   */
  getToken(): string | null {
    // For Phoenix backend, we might need to handle JWT tokens differently
    // This will be updated based on how Phoenix returns tokens
    return localStorage.getItem('auth_token');
  },

  /**
   * Set Bearer token in storage
   */
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  },

  /**
   * Remove Bearer token from storage
   */
  removeToken(): void {
    localStorage.removeItem('auth_token');
  },

  /**
   * Get authorization header for API calls
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

/**
 * Enhanced API call with authentication
 */
export const authenticatedApiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const authHeaders = TokenManager.getAuthHeader();
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