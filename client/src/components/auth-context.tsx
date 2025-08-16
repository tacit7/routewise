import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

// User interface for server-side OAuth
interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
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

  // Check if auth is disabled for development
  const isAuthDisabled = import.meta.env.VITE_DISABLE_AUTH === 'true';

  const isAuthenticated = isAuthDisabled || user !== null;

  // Check authentication status on mount
  useEffect(() => {
    if (isAuthDisabled) {
      // Create a mock user for development
      setUser({
        id: 'dev-user',
        email: 'dev@example.com',
        name: 'Development User',
        picture: 'https://via.placeholder.com/150',
        email_verified: true,
        given_name: 'Dev',
        family_name: 'User'
      });
      setIsLoading(false);
    } else {
      checkAuth();
    }
  }, [isAuthDisabled]);

  const checkAuth = async (): Promise<void> => {
    if (isAuthDisabled) {
      return; // Skip auth check when disabled
    }
    
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // Important: Include HTTP-only cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    if (isAuthDisabled) {
      // In no-auth mode, just show a message
      toast({
        title: "Auth Disabled",
        description: "Authentication is disabled in development mode.",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setUser(null);
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear user state even if logout fails
      setUser(null);
      toast({
        title: "Error",
        description: "There was an issue signing out, but you've been logged out locally.",
        variant: "destructive",
      });
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    checkAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
