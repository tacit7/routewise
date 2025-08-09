import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function AuthError() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Show error message
    toast({
      title: "Authentication Error",
      description: "Google authentication failed or was cancelled. Please try again.",
      variant: "destructive",
    });
    
    // Redirect to home page after showing error
    setTimeout(() => {
      navigate('/');
    }, 3000);
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-md w-full mx-auto p-8 bg-surface rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
        <p className="text-gray-600 mb-4">
          Google authentication was cancelled or failed. You'll be redirected to the home page shortly.
        </p>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
      </div>
    </div>
  );
}