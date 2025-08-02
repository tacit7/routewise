import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import PoiSection from "@/components/poi-section";
import FeaturesSection from "@/components/features-section";
import Footer from "@/components/footer";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTrips, type Trip, type LegacyRoute } from "@/hooks/use-trips";
import { useAuth } from "@/components/auth-context";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { trips, legacyRoutes, loading, error, deleteTrip, deleteLegacyRoute } = useTrips();

  const loadTrip = (trip: Trip) => {
    // Store route data and navigate to results
    localStorage.setItem('currentRoute', JSON.stringify({
      startCity: trip.startCity,
      endCity: trip.endCity
    }));
    
    setLocation(`/route?start=${encodeURIComponent(trip.startCity)}&end=${encodeURIComponent(trip.endCity)}`);
    
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
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      
      {/* Saved Routes/Trips Section */}
      {(trips.length > 0 || legacyRoutes.length > 0) && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                {isAuthenticated ? "My Saved Trips" : "My Saved Routes"}
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Quick access to your previously planned routes and discovered places
              </p>
              {loading && (
                <p className="text-slate-500 mt-2">Loading your trips...</p>
              )}
              {error && (
                <p className="text-red-500 mt-2">Error loading trips: {error}</p>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Backend Trips (for authenticated users) */}
              {trips.map((trip) => (
                <div key={`trip-${trip.id}`} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">{trip.title}</h3>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <i className="fas fa-trash text-sm" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-slate-600">
                      <i className="fas fa-map-marker-alt mr-2 text-green-600" />
                      <span>{trip.startCity}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <i className="fas fa-flag mr-2 text-red-600" />
                      <span>{trip.endCity}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <i className="fas fa-star mr-2 text-amber-500" />
                      <span>{trip.poisData.length} places discovered</span>
                    </div>
                    {trip.routeData && (
                      <div className="flex items-center text-sm text-slate-600">
                        <i className="fas fa-clock mr-2 text-blue-500" />
                        <span>{trip.routeData.duration} • {trip.routeData.distance}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 mb-4">
                    Saved {new Date(trip.createdAt).toLocaleDateString()}
                  </div>
                  
                  <Button
                    onClick={() => loadTrip(trip)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <i className="fas fa-route mr-2" />
                    View Trip
                  </Button>
                </div>
              ))}

              {/* Legacy Routes (from localStorage) */}
              {legacyRoutes.map((route) => (
                <div key={`legacy-${route.id}`} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow relative">
                  <div className="absolute top-2 right-2">
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">Legacy</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">{route.name}</h3>
                    <button
                      onClick={() => handleDeleteLegacyRoute(route.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <i className="fas fa-trash text-sm" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-slate-600">
                      <i className="fas fa-map-marker-alt mr-2 text-green-600" />
                      <span>{route.startCity}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <i className="fas fa-flag mr-2 text-red-600" />
                      <span>{route.endCity}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <i className="fas fa-star mr-2 text-amber-500" />
                      <span>{route.placesCount} places discovered</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 mb-4">
                    Saved {new Date(route.createdAt).toLocaleDateString()}
                  </div>
                  
                  <Button
                    onClick={() => loadLegacyRoute(route)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <i className="fas fa-route mr-2" />
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
      <Footer />
    </div>
  );
}
