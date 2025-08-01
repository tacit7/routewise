import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth-context";
import Home from "@/pages/home";
import RouteResults from "@/pages/route-results";
import NotFound from "@/pages/not-found";
import MswTestPanel from "@/components/msw-test-panel";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/route" component={RouteResults} />
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
          <Router />
          {/* MSW Test Panel - only in development */}
          {import.meta.env.DEV && <MswTestPanel />}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
