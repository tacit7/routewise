import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { apiCall, authenticatedApiCall, TokenManager, API_CONFIG } from '@/lib/api-config';

interface User {
  id: string; // Phoenix uses binary UUID
  username: string;
  email: string;
  full_name?: string;
  avatar?: string;
  provider: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthResult>;
  register: (username: string, password: string, email: string, fullName?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = user !== null;

  // Check if user is authenticated on mount and handle OAuth redirects
  useEffect(() => {
    handleOAuthRedirect();
    checkAuth();
  }, []);

  const handleOAuthRedirect = (): void => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const message = urlParams.get('message');

    if (success === 'google_auth') {
      toast({
        title: "Welcome!",
        description: message || "Successfully signed in with Google",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      let errorMessage = "Authentication failed";
      
      switch (error) {
        case 'oauth_error':
          errorMessage = "Google authentication was cancelled or failed";
          break;
        case 'missing_code':
          errorMessage = "Authentication code was missing";
          break;
        case 'missing_state':
          errorMessage = "Authentication state was missing";
          break;
        case 'auth_failed':
          errorMessage = message || "Authentication failed";
          break;
        case 'server_error':
          errorMessage = "Server error during authentication";
          break;
        default:
          errorMessage = message || "Authentication failed";
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      // Express.js backend uses HTTP-only cookies, so we don't need to check localStorage token
      // Just make the /me request - if the cookie is valid, it will work
      const data = await apiCall<{ success: boolean; user: User }>(API_CONFIG.ENDPOINTS.ME);
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      // 401 Unauthorized is expected when user is not logged in - don't log as error
      if (error instanceof Error && error.message.includes('401')) {
        // Silently handle - user is not authenticated, which is normal
      } else {
        console.error('Auth check failed:', error);
      }
      // Clear any stored token
      TokenManager.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<AuthResult> => {
    try {
      const data = await apiCall<{ success: boolean; message: string; user: User; token: string }>(
        API_CONFIG.ENDPOINTS.LOGIN,
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        }
      );

      if (data.success && data.user) {
        // Phoenix backend sets HTTP-only cookie, but also returns token for localStorage
        if (data.token) {
          TokenManager.setToken(data.token);
        }
        setUser(data.user);
        return { success: true, user: data.user, message: data.message };
      }

      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error occurred' 
      };
    }
  };

  const register = async (username: string, password: string, email: string, fullName?: string): Promise<AuthResult> => {
    try {
      const requestBody: any = { username, password, email };
      if (fullName) {
        requestBody.full_name = fullName;
      }

      const data = await apiCall<{ success: boolean; message: string; user: User; token: string }>(
        API_CONFIG.ENDPOINTS.REGISTER,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      if (data.success && data.user) {
        // Phoenix backend sets HTTP-only cookie, but also returns token for localStorage
        if (data.token) {
          TokenManager.setToken(data.token);
        }
        setUser(data.user);
        return { success: true, user: data.user, message: data.message };
      }

      return { success: false, message: data.message || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error occurred' 
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call Phoenix logout to clear HTTP-only cookie
      await apiCall<{ success: boolean; message: string }>(API_CONFIG.ENDPOINTS.LOGOUT, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state and token
      TokenManager.removeToken();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
