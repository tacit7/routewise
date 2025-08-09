import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth-context";
import { useCityPrefetch } from "@/hooks/use-city-autocomplete";
import { useEffect } from "react";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import Home from "@/pages/home";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import DashboardTest from "@/pages/dashboard-test";
import RouteResults from "@/pages/route-results";
import ExploreResults from "@/pages/explore-results";
import PlaceResults from "@/pages/place-results";
import ItineraryPage from "@/pages/itinerary";
import TripWizardPage from "@/pages/trip-wizard";
import InterestsDemo from "@/pages/interests-demo";
import InterestsPage from "@/pages/interests";
import NotFound from "@/pages/not-found";
import TripIndicator from "@/components/trip-indicator";
import AuthSuccess from "@/pages/auth-success";
import AuthError from "@/pages/auth-error";

function AuthenticatedRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const { prefetchPopularCities } = useCityPrefetch();

  // Prefetch popular cities when router mounts (after QueryClient is available)
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchPopularCities('us,ca,mx');
    }, 2000); // Wait 2 seconds after app loads to avoid blocking initial render

    return () => clearTimeout(timer);
  }, [prefetchPopularCities]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Authenticated users go to dashboard, non-authenticated to landing page */}
      <Route path="/" component={isAuthenticated ? Dashboard : Home} />
      <Route path="/login" component={isAuthenticated ? Dashboard : LoginPage} />
      <Route path="/dashboard" component={isAuthenticated ? Dashboard : Home} />
      <Route path="/interests" component={isAuthenticated ? InterestsPage : Home} />
      <Route path="/plan" component={Home} />
      <Route path="/trip-wizard" component={TripWizardPage} />
      <Route path="/route" component={RouteResults} />
      <Route path="/route-results" component={RouteResults} />
      <Route path="/explore-results" component={ExploreResults} />
      <Route path="/place-results" component={PlaceResults} />
      <Route path="/itinerary" component={ItineraryPage} />
      <Route path="/interests-demo" component={InterestsDemo} />
      <Route path="/dashboard-test" component={DashboardTest} />
      <Route path="/auth/success" component={AuthSuccess} />
      <Route path="/auth/error" component={AuthError} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
        persistor={persistor}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <AuthenticatedRouter />
              <TripIndicator />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
