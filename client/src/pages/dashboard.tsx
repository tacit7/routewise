import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-context";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/shells/app-shell";
import { useToast } from "@/hooks/use-toast";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Route, CheckCircle, Search, Settings, Play, Calendar, Plane, Car, Bus, Bike, X, Flag } from "lucide-react";
import { PlaceAutocomplete } from "@/components/place-autocomplete";
import TripOfTheWeek from "@/components/trip-of-the-week";
import SeasonalTravel from "@/components/seasonal-travel";
import DashboardHero from "@/components/dashboard-hero";
import FeaturedSeasonalTrips from "@/components/featured-seasonal-trips";
import NearbyTrendingPOIs from "@/components/nearby-trending-pois";
import PersonalRecommendations from "@/components/personal-recommendations";
import QuickTools from "@/components/quick-tools";

// Function to get saved Explorer Wizard data
const getExplorerWizardData = () => {
  try {
    const saved = localStorage.getItem('routewise-trip-wizard-draft');
    console.log('getExplorerWizardData: Raw localStorage:', saved);
    
    if (saved) {
      const draft = JSON.parse(saved);
      console.log('getExplorerWizardData: Parsed draft:', draft);
      
      // Check if draft is expired
      if (Date.now() > draft.expiresAt) {
        console.log('getExplorerWizardData: Draft expired');
        return null;
      }
      
      console.log('getExplorerWizardData: Returning data:', draft?.data);
      return draft?.data || null;
    }
    console.log('getExplorerWizardData: No saved data found');
    return null;
  } catch (error) {
    console.error('getExplorerWizardData: Error:', error);
    return null;
  }
};

// Component to display Explorer Wizard progress card
const ExplorerWizardCard = ({ onContinue, onDelete }: { onContinue: () => void; onDelete?: () => void }) => {
  const [savedData, setSavedData] = useState<any>(null);

  useEffect(() => {
    const checkForData = () => {
      const data = getExplorerWizardData();
      console.log('ExplorerWizardCard: Retrieved data:', data);
      setSavedData(data);
    };

    // Check immediately
    checkForData();

    // Also check when window regains focus (in case user navigated back)
    const handleFocus = () => checkForData();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (!savedData) {
    console.log('ExplorerWizardCard: No savedData, not rendering');
    return null;
  }

  const getTransportationIcon = (transport: string) => {
    switch (transport) {
      case 'flights': return <Plane className="w-4 h-4" />;
      case 'public-transport': return <Bus className="w-4 h-4" />;
      case 'other': return <Bike className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5 overflow-hidden max-w-2xl mx-auto">
      {/* Location image header - Always show when there's saved data */}
      <div className="h-24 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=200&fit=crop&crop=center"
          alt={savedData.startLocation ? `${savedData.startLocation.main_text} landscape` : 'Trip exploration'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute bottom-2 left-4 text-white">
          <div className="text-xs opacity-90">Exploring</div>
          <div className="font-semibold">
            {savedData.startLocation ? savedData.startLocation.main_text : 'Your Adventure'}
          </div>
        </div>
        {/* Delete button */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Delete exploration progress"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-primary" />
            <span className="text-sm">Places Explorer in Progress</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Trip type badge */}
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
              Exploration
            </Badge>
            <Button onClick={onContinue} size="sm" className="text-xs px-3 py-1">
              <Play className="w-3 h-3 mr-1" />
              Continue
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress and completion info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last edited: Recently</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Step 3 of 7 • 43% complete
          </div>
        </div>


        {/* Dates */}
        {(savedData.startDate || savedData.flexibleDates) && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-600" />
            <span className="font-medium">Dates:</span>
            <span>
              {savedData.flexibleDates ? 
                'Flexible dates' : 
                savedData.startDate && savedData.endDate ? 
                  `${new Date(savedData.startDate).toLocaleDateString()} - ${new Date(savedData.endDate).toLocaleDateString()}` :
                  savedData.startDate ? 
                    `From ${new Date(savedData.startDate).toLocaleDateString()}` :
                    'Not set'
              }
            </span>
          </div>
        )}

        {/* Transportation */}
        {savedData.transportation && savedData.transportation.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center space-x-1">
              {savedData.transportation.map((transport: string, index: number) => (
                <span key={transport} className="flex items-center">
                  {index > 0 && <span className="mx-1 text-slate-400">•</span>}
                  {getTransportationIcon(transport)}
                </span>
              ))}
            </div>
            <span className="font-medium">Transportation:</span>
            <span>{savedData.transportation.join(', ')}</span>
          </div>
        )}

        {/* Interests */}
        {savedData.intentions && savedData.intentions.length > 0 && (
          <div className="flex items-start space-x-2 text-sm">
            <Settings className="w-4 h-4 text-slate-600 mt-0.5" />
            <span className="font-medium">Interests:</span>
            <div className="flex flex-wrap gap-1">
              {savedData.intentions.slice(0, 3).map((interest: string) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {savedData.intentions.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{savedData.intentions.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Form state for route planning
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [exploreLocation, setExploreLocation] = useState("");
  const [selectedExplorePlace, setSelectedExplorePlace] = useState<any>(null);

  // Use the consolidated dashboard data hook
  const { data: dashboardData, isLoading, error } = useDashboardData();

  // Extract data from consolidated response
  const userTrips = dashboardData?.trips.user_trips || [];
  const suggestedTrips = dashboardData?.trips.suggested_trips || [];
  const enabledInterestNames = dashboardData?.suggested_interests || [];
  const stats = dashboardData?.stats;
  const categories = dashboardData?.categories;

  const hasUserTrips = userTrips.length > 0;
  const hasTripsError = !!error;
  const isLoadingSuggested = isLoading;
  const isLoadingInterests = isLoading;
  const isLoadingUserTrips = isLoading;

  // Simple first-time user logic based on dashboard data
  const hasInterestsConfigured = enabledInterestNames.length > 0;
  const shouldShowFirstTimeExperience = !hasInterestsConfigured && !isLoading;
  
  // Check if there's Explorer Wizard progress
  const hasExplorerProgress = getExplorerWizardData() !== null;

  const handlePlanRoadTrip = () => {
    // Store trip type in localStorage before navigating
    localStorage.setItem("tripType", "route");
    setLocation("/trip-wizard");
  };

  const handleExplore = () => {
    // Navigate directly to the Places Explorer wizard
    setLocation("/places-explorer");
  };

  const handleRouteFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startLocation.trim() || !endLocation.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both start and end locations",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to route results with the locations
    setLocation(`/route-results?start=${encodeURIComponent(startLocation.trim())}&end=${encodeURIComponent(endLocation.trim())}`);
  };

  const handleExploreFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exploreLocation.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please enter a location to explore",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to explore results with the location
    setLocation(`/explore-results?location=${encodeURIComponent(exploreLocation.trim())}`);
  };

  const handleContinueExplorer = () => {
    // Navigate back to the Explorer Wizard to continue
    setLocation("/places-explorer");
  };

  const handleDeleteExplorer = () => {
    // Clear the exploration progress
    localStorage.removeItem('routewise-trip-wizard-draft');
    toast({
      title: "Exploration cleared",
      description: "Your exploration progress has been deleted.",
    });
    // Force a page refresh to update the UI
    window.location.reload();
  };

  const handleHelpMePlan = () => {
    setLocation("/interests");
  };

  const handleCustomizeInterests = () => {
    setLocation("/interests");
  };

  const handleStartTrip = (trip: any) => {
    if (trip.start_city && trip.end_city) {
      // Route-based trip: Store route data and navigate to planning
      localStorage.setItem(
        "routeRequest",
        JSON.stringify({
          startLocation: trip.start_city,
          endLocation: trip.end_city,
          timestamp: Date.now(),
        })
      );
      setLocation("/");
    } else {
      // Check if this is one of our predefined suggested trips
      const predefinedTripSlugs = ['pacific-coast-highway', 'great-lakes', 'san-francisco', 'yellowstone', 'grand-canyon'];
      const tripSlug = trip.title?.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
        
      if (predefinedTripSlugs.includes(tripSlug)) {
        // Navigate to the specific suggested trip page
        setLocation(`/suggested-trip/${tripSlug}`);
      } else {
        // Fallback: Navigate to places explorer with suggestion context
        localStorage.setItem(
          "suggestionContext",
          JSON.stringify({
            tripId: trip.id,
            title: trip.title,
            description: trip.description,
            timestamp: Date.now(),
          })
        );
        setLocation("/places-explorer");
      }
    }
  };

  // Show loading while checking data
  if (isLoadingSuggested || isLoadingInterests || isLoadingUserTrips) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show empty state for users with no trips
  if (!hasUserTrips) {
    return (
      <AppShell>
        {/* Dashboard Hero Section - Full Width */}
        <DashboardHero />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-120px)] flex flex-col">
          {/* Explorer Wizard Progress Card - Always show FIRST when data exists */}
          <div className="mb-8">
            <ExplorerWizardCard onContinue={handleContinueExplorer} onDelete={handleDeleteExplorer} />
          </div>

          {/* Empty State Hero Section */}
          <div className="text-center max-w-2xl mx-auto mb-16 flex-shrink-0">
            {/* Heading - Different if Explorer in progress */}
            {hasExplorerProgress ? (
              <h1 className="text-4xl font-bold text-foreground mb-8">Welcome back!</h1>
            ) : (
              <h1 className="text-4xl font-bold text-foreground mb-8">Let's get your next adventure started!</h1>
            )}

            {/* Subtext - Different if Explorer in progress */}
            {hasExplorerProgress ? (
              <p className="text-xl text-muted-foreground mb-12">
                Continue your exploration planning or start a new route.
              </p>
            ) : (
              <p className="text-xl text-muted-foreground mb-12">
                You haven't planned any trips yet. Start your first adventure below.
              </p>
            )}

            {/* Action Cards - Card-based design */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Plan Route Card */}
              <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-all group">
                <form onSubmit={handleRouteFormSubmit}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <Route className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Plan Route</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Discover amazing stops along your route between two cities
                    </p>
                    
                    {/* Route Form Inputs */}
                    <div className="space-y-3 mb-4">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <Input
                          type="text"
                          placeholder="San Francisco"
                          value={startLocation}
                          onChange={(e) => setStartLocation(e.target.value)}
                          className="w-full pl-10 placeholder:text-muted-foreground/40"
                        />
                      </div>
                      <div className="relative">
                        <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <Input
                          type="text"
                          placeholder="Los Angeles"
                          value={endLocation}
                          onChange={(e) => setEndLocation(e.target.value)}
                          className="w-full pl-10 placeholder:text-muted-foreground/40"
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Start Planning →
                    </Button>
                  </div>
                </form>
              </div>

              {/* Explore Places Card */}
              <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-all group h-full">
                <form onSubmit={handleExploreFormSubmit} className="h-full">
                  <div className="text-center h-full flex flex-col">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <Search className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Explore Places</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Find attractions and points of interest around any destination
                    </p>
                    
                    {/* Explore Form Input */}
                    <div className="space-y-3 mb-6 flex-grow">
                      <PlaceAutocomplete
                        value={exploreLocation}
                        onSelect={(place) => {
                          setExploreLocation(place.description);
                          setSelectedExplorePlace(place);
                        }}
                        placeholder="New York, Grand Canyon, France, Puerto Rico"
                        className="w-full"
                        countries="us,ca,mx,pr"
                      />
                    </div>
                    
                    <div className="mt-auto">
                      <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Start Exploring →
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Only show additional content if NO Explorer progress */}
            {!hasExplorerProgress && (
              <>

                {/* Personalize Section - Only show for first-time users or users without interests */}
                {(shouldShowFirstTimeExperience || !hasInterestsConfigured) && (
                  <section className="mt-16">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center mr-3">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">Personalize Your Trip Suggestions</h2>
                    </div>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                      Tell us what you're into to get tailored recommendations.
                    </p>

                    <Button
                      onClick={handleCustomizeInterests}
                      className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      Customize Interests
                    </Button>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Featured Seasonal Trips Section */}
          <FeaturedSeasonalTrips />
          
          {/* Nearby/Trending POIs Section */}
          <NearbyTrendingPOIs />
          
          {/* Personal Recommendations Section */}
          <PersonalRecommendations />
          
          {/* Interactive Quick Tools */}
          <QuickTools />
          
          {/* Trip of the Week Section */}
          <TripOfTheWeek />
          
          {/* Seasonal Travel Section */}
          <SeasonalTravel />

        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Dashboard Hero Section - Full Width */}
      <DashboardHero />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-120px)] flex flex-col">
        {/* Explorer Wizard Progress Card - Always show FIRST when data exists */}
        <div className="mb-8">
          <ExplorerWizardCard onContinue={handleContinueExplorer} />
        </div>

        <div className="text-center flex-shrink-0">
          {/* Action Cards - Card-based design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-6">
            {/* Plan Route Card */}
            <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-all group">
              <form onSubmit={handleRouteFormSubmit}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Route className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Plan Route</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Discover amazing stops along your route between two cities
                  </p>
                  
                  {/* Route Form Inputs */}
                  <div className="space-y-3 mb-4">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <Input
                        type="text"
                        placeholder="San Francisco"
                        value={startLocation}
                        onChange={(e) => setStartLocation(e.target.value)}
                        className="w-full pl-10 placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <div className="relative">
                      <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <Input
                        type="text"
                        placeholder="Los Angeles"
                        value={endLocation}
                        onChange={(e) => setEndLocation(e.target.value)}
                        className="w-full pl-10 placeholder:text-muted-foreground/40"
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Start Planning →
                  </Button>
                </div>
              </form>
            </div>

            {/* Explore Places Card */}
            <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-all group h-full">
              <form onSubmit={handleExploreFormSubmit} className="h-full">
                <div className="text-center h-full flex flex-col">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Explore Places</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Find attractions and points of interest around any destination
                  </p>
                  
                  {/* Explore Form Input */}
                  <div className="space-y-3 mb-6 flex-grow">
                    <PlaceAutocomplete
                      value={exploreLocation}
                      onSelect={(place) => {
                        setExploreLocation(place.description);
                        setSelectedExplorePlace(place);
                      }}
                      placeholder="New York, Grand Canyon, France, Puerto Rico"
                      className="w-full"
                      countries="us,ca,mx,pr"
                    />
                  </div>
                    
                    {/* Invisible inactive button */}
                    <Button
                      type="button"
                      disabled
                      className="w-full invisible opacity-0 pointer-events-none"
                    >
                      Hidden Button
                    </Button>
                  </div>
                  
                  <div className="mt-auto">
                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Start Exploring →
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Help Me Plan Button - Keep as separate button when no Explorer progress */}
          {!hasExplorerProgress && (
            <div className="flex justify-center mb-6">
              <Button
                onClick={handleHelpMePlan}
                variant="outline"
                className="bg-primary hover:bg-primary/90 text-primary-foreground border-primary px-6 py-3 rounded-lg font-medium flex items-center justify-center"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Help Me Plan a Trip
              </Button>
            </div>
          )}

          {/* Only show personalize section if NO Explorer progress */}
          {!hasExplorerProgress && (shouldShowFirstTimeExperience || !hasInterestsConfigured) && (
            <section className="mb-12">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Personalize Your Trip Suggestions</h2>
              </div>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Tell us what you're into to get tailored recommendations.
              </p>

              <Button
                onClick={handleCustomizeInterests}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium"
              >
                Customize Interests
              </Button>
            </section>
          )}
        </div>

        {/* Featured Seasonal Trips Section */}
        <FeaturedSeasonalTrips />
        
        {/* Nearby/Trending POIs Section */}
        <NearbyTrendingPOIs />
        
        {/* Personal Recommendations Section */}
        <PersonalRecommendations />
        
        {/* Interactive Quick Tools */}
        <QuickTools />
        
        {/* Trip of the Week Section */}
        <TripOfTheWeek />
        
        {/* Seasonal Travel Section */}
        <SeasonalTravel />

      </main>
    </AppShell>
  );
};

export default Dashboard;
