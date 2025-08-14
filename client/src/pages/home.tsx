import { MarketingShell } from "@/shells/marketing-shell";
import { Hero } from "@/features/marketing/hero";
import { QuickRouteFormInline, QuickRouteFormDrawer } from "@/features/route-planner/quick-route-form";
import HiddenGems from "@/components/hidden-gems";
import PoiSection from "@/components/poi-section";
import FeaturesSection from "@/components/features-section";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTrips, type Trip, type LegacyRoute } from "@/hooks/use-trips";
import { useAuth } from "@/components/auth-context";
import { Trash2, MapPin, Flag, Star, Clock, Route } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { trips, legacyRoutes, loading, error, deleteTrip, deleteLegacyRoute } = useTrips();

  const handleRouteSubmit = (startCity: string, endCity: string) => {
    // Store route data and navigate to results
    localStorage.setItem('currentRoute', JSON.stringify({
      startCity: startCity,
      endCity: endCity
    }));

    setLocation(`/route?start=${encodeURIComponent(startCity)}&end=${encodeURIComponent(endCity)}`);

    toast({
      title: "Planning your route!",
      description: `Finding the best stops between ${startCity} and ${endCity}`,
    });
  };

  const loadTrip = (trip: Trip) => {
    // Store route data and navigate to results
    localStorage.setItem('currentRoute', JSON.stringify({
      startCity: trip.startCity,
      endCity: trip.endCity
    }));

    setLocation(`/route?start=${encodeURIComponent(trip.startCity)}&end=${encodeURIComponent(trip.endCity)}`);

    debugger;
    const placesCount = trip.poisData ? trip.poisData.length : 0;
    toast({
      title: "Trip loaded",
      description: `Loading ${trip.title} with ${placesCount} places`,
    });
  };

  const loadLegacyRoute = (route: LegacyRoute) => {
    // Store route data and navigate to results
    localStorage.setItem('currentRoute', JSON.stringify({
      startCity: route.startCity,
      endCity: route.endCity
    }));

    setLocation(`/route?start=${encodeURIComponent(route.startCity)}&end=${encodeURIComponent(route.endCity)}`);

    toast({
      title: "Route loaded",
      description: `Loading ${route.name} with ${route.placesCount} places`,
    });
  };

  const handleDeleteTrip = async (tripId: number) => {
    const success = await deleteTrip(tripId);
    if (success) {
      toast({
        title: "Trip deleted",
        description: "Trip has been removed from your collection",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete trip. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLegacyRoute = (routeId: string) => {
    deleteLegacyRoute(routeId);
    toast({
      title: "Route deleted",
      description: "Route has been removed from your collection",
    });
  };

  return (
    <MarketingShell navAuthButtons="menu">
      {/* Mobile: Drawer CTA */}
      <div className="lg:hidden">
        <Hero
          overlay="strong"
          align="center"
          heightClass="min-h-[65vh]"
          cta={
            <QuickRouteFormDrawer
              onSubmit={handleRouteSubmit}
              triggerText="Start Planning Your Route"
            />
          }
        />
      </div>

      {/* Desktop: Inline Form */}
      <div className="hidden lg:block">
        <Hero
          overlay="soft"
          align="center"
          heightClass="min-h-[75vh]"
          cta={
            <QuickRouteFormInline
              onSubmit={handleRouteSubmit}
              density="comfortable"
            />
          }
        />
      </div>

      {/* Rest of the landing page content */}
      <HiddenGems />

      {/* Saved Routes/Trips Section */}
      {(trips.length > 0 || legacyRoutes.length > 0) && (
        <section className="py-12 sm:py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                {isAuthenticated ? "My Saved Trips" : "My Saved Routes"}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                Quick access to your previously planned routes and discovered places
              </p>
              {loading && (
                <p className="text-muted-foreground mt-2">Loading your trips...</p>
              )}
              {error && (
                <p className="text-red-500 mt-2">Error loading trips: {error}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Backend Trips (for authenticated users) */}
              {trips.map((trip) => (
                <div key={`trip-${trip.id}`} className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base flex-1 pr-2 line-clamp-2">{trip.title}</h3>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0 p-2 sm:p-1 -mt-1 touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
                      aria-label={`Delete trip ${trip.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{trip.startCity}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <Flag className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                      <span className="truncate">{trip.endCity}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <Star className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
                      <span>{trip.poisData ? trip.poisData.length : 0} places</span>
                    </div>
                    {trip.routeData && (
                      <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <Clock className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{trip.routeData.duration} • {trip.routeData.distance}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground mb-4">
                    Saved {new Date(trip.createdAt).toLocaleDateString()}
                  </div>

                  <Button
                    onClick={() => loadTrip(trip)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base h-12 sm:h-10 touch-manipulation"
                  >
                    <Route className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    View Trip
                  </Button>
                </div>
              ))}

              {/* Legacy Routes (from localStorage) */}
              {legacyRoutes.map((route) => (
                <div key={`legacy-${route.id}`} className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6 hover:shadow-md transition-shadow relative">
                  <div className="absolute top-2 right-2">
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">Legacy</span>
                  </div>

                  <div className="flex items-start justify-between mb-4 pt-6 sm:pt-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base flex-1 pr-2 line-clamp-2">{route.name}</h3>
                    <button
                      onClick={() => handleDeleteLegacyRoute(route.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0 p-2 sm:p-1 -mt-1 touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
                      aria-label={`Delete route ${route.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{route.startCity}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <Flag className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                      <span className="truncate">{route.endCity}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <Star className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
                      <span>{route.placesCount} places</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-4">
                    Saved {new Date(route.createdAt).toLocaleDateString()}
                  </div>

                  <Button
                    onClick={() => loadLegacyRoute(route)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 sm:h-10 touch-manipulation"
                  >
                    <Route className="mr-2 h-4 w-4" />
                    View Route
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <PoiSection />
      <FeaturesSection />
    </MarketingShell>
  );
}