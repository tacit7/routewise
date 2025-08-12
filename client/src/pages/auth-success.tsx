import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/components/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function AuthSuccess() {
  const [, navigate] = useLocation();
  const { checkAuth } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      // Server-side OAuth sets HTTP-only cookies
      // Manually check auth status to refresh the context
      try {
        if (typeof checkAuth === 'function') {
          await checkAuth();
        } else {
          // Fallback: force refresh the page to trigger auth check
          console.log('checkAuth not available, refreshing context manually');
          window.location.reload();
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
      
      // Show success message
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google",
      });
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    };

    handleOAuthSuccess();
  }, [checkAuth, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-md w-full mx-auto p-8 bg-surface rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
        <p className="text-gray-600 mb-4">
          You've successfully signed in with Google. Redirecting to your dashboard...
        </p>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
}