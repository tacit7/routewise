import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth-context";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import DashboardTest from "@/pages/dashboard-test";
import RouteResults from "@/pages/route-results";
import InterestsDemo from "@/pages/interests-demo";
import InterestsPage from "@/pages/interests";
import NotFound from "@/pages/not-found";
import TripIndicator from "@/components/trip-indicator";

function AuthenticatedRouter() {
  const { isAuthenticated, isLoading } = useAuth();

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
      <Route path="/dashboard" component={isAuthenticated ? Dashboard : Home} />
      <Route path="/interests" component={isAuthenticated ? InterestsPage : Home} />
      <Route path="/plan" component={Home} />
      <Route path="/route" component={RouteResults} />
      <Route path="/interests-demo" component={InterestsDemo} />
      <Route path="/dashboard-test" component={DashboardTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AuthenticatedRouter />
          <TripIndicator />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
