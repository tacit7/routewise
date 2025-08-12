import { useAuth } from "@/components/auth-context";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/shells/app-shell";
import UserInterests from "@/components/user-interests";

const InterestsPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Handle trip planning - redirect to route planning with pre-filled locations
  const handleRouteRequest = (startLocation: string, endLocation: string) => {
    // Store the route request in localStorage for the home page to pick up
    localStorage.setItem('routeRequest', JSON.stringify({
      startLocation,
      endLocation,
      timestamp: Date.now()
    }));
    
    // Navigate to the route planning page
    setLocation("/plan");
  };

  // Redirect non-authenticated users to home
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell
      leftContent={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/dashboard")}
          className="hover:bg-[var(--surface-alt)] focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          style={{ color: 'var(--text)' }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      }
      centerContent={
        <div className="flex items-center justify-center">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Travel Preferences
          </h1>
        </div>
      }
    >
      
      {/* Welcome section for new users */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-fg mb-4">
              Welcome to RouteWise, {user?.username}!
            </h1>
            <p className="text-lg text-muted-fg max-w-2xl mx-auto">
              Let's personalize your travel experience. We'll recommend routes and destinations 
              based on your interests to make every journey unforgettable.
            </p>
          </div>
        </div>
      </div>

      {/* User Interests Component */}
      <UserInterests onRouteRequest={handleRouteRequest} />
    </AppShell>
  );
};

export default InterestsPage;