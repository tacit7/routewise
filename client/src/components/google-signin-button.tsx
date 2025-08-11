import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-context';
import { googleAuth } from '@/services/GoogleAuth';

interface GoogleSignInButtonProps {
  className?: string;
  disabled?: boolean;
  text?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  className = '', 
  disabled = false,
  text = 'Continue with Google'
}) => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [useNativeButton, setUseNativeButton] = useState(false);

  // Try to render Google's native button, fallback to custom button
  useEffect(() => {
    const renderGoogleButton = async () => {
      try {
        if (buttonRef.current && window.google?.accounts?.id) {
          // Clear any existing content
          buttonRef.current.innerHTML = '';
          
          // Try to render Google's native button
          googleAuth.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: '100%',
          });
          
          setUseNativeButton(true);
        }
      } catch (error) {
        const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
        devLog('Failed to render Google button, using fallback:', error);
        setUseNativeButton(false);
      }
    };

    // Wait for Google library to load
    const checkGoogleLibrary = () => {
      if (window.google?.accounts?.id) {
        renderGoogleButton();
      } else {
        setTimeout(checkGoogleLibrary, 100);
      }
    };
    
    checkGoogleLibrary();
  }, []);

  const handleGoogleSignIn = async () => {
    if (isLoading || disabled) return;
    
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
      devLog('Google sign-in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If Google's native button is rendered, return the container
  if (useNativeButton) {
    return (
      <div 
        ref={buttonRef} 
        className={`w-full ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      />
    );
  }

  // Fallback custom button
  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={disabled || isLoading}
      className={`w-full flex items-center justify-center gap-3 border-input hover:bg-accent hover:text-accent-foreground ${className}`}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
          <span className="text-foreground font-medium">Signing in...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-foreground font-medium">{text}</span>
        </>
      )}
    </Button>
  );
};