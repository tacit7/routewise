import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { googleAuth, GoogleUser } from '@/services/GoogleAuth';

// User interface matching GoogleUser structure
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
  signInWithGoogle: () => Promise<AuthResult>;
  logout: () => Promise<void>;
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

  // 🚫 TESTING MODE: Always authenticated for Tailwind v4 testing
  const isAuthenticated = true; // Override for testing - was: user !== null

  // Initialize GoogleAuth and check authentication on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Listen for Google auth state changes
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      const { user: googleUser } = event.detail;
      if (googleUser) {
        setUser(googleUser);
      } else {
        setUser(null);
      }
    };

    window.addEventListener('googleAuthStateChanged', handleAuthStateChange as EventListener);
    return () => {
      window.removeEventListener('googleAuthStateChanged', handleAuthStateChange as EventListener);
    };
  }, []);

  const initializeAuth = async () => {
    try {
      // 🚫 TESTING MODE: Use mock user for Tailwind v4 testing
      const mockUser: User = {
        id: "test-user-123",
        email: "test@routewise.com",
        name: "Test User",
        picture: "https://via.placeholder.com/96",
        email_verified: true,
        given_name: "Test",
        family_name: "User"
      };
      setUser(mockUser);
      console.log('🎭 Using mock user for testing - authentication disabled');
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      const googleUser = await googleAuth.signIn();
      
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google",
      });
      
      return { success: true, user: googleUser, message: 'Successfully signed in' };
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      toast({
        title: "Sign-in Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, message: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Sign out from Google Auth service only (no backend call)
      googleAuth.signOut();
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear user state even if logout fails
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
