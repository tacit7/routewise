import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-context";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Header from "@/components/header";
import { useTrips, type Trip } from "@/hooks/use-trips";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { trips, loading: tripsLoading, error, deleteTrip } = useTrips();

  const handlePlanNewTrip = () => {
    setLocation("/plan");
  };

  const handleViewTrip = (trip: Trip) => {
    // Store route data and navigate to results
    localStorage.setItem('currentRoute', JSON.stringify({
      startCity: trip.startCity,
      endCity: trip.endCity
    }));
    
    setLocation(`/route?start=${encodeURIComponent(trip.startCity)}&end=${encodeURIComponent(trip.endCity)}`);
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

  // Show loading while checking trips
  if (tripsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Use existing Header component */}
      <Header />

      {/* Welcome section for authenticated users */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome {trips.length === 0 ? '' : 'back'}, {user?.username}!
              </h1>
              <p className="text-gray-600">
                {trips.length === 0 
                  ? "Let's discover your perfect road trip" 
                  : "Plan your next adventure with RouteWise"
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {trips.length === 0 ? (
                <>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setLocation("/interests")}
                  >
                    <i className="fas fa-compass mr-2"></i>
                    Discover Trips
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handlePlanNewTrip}
                  >
                    <i className="fas fa-map mr-2"></i>
                    Plan Custom Trip
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={handlePlanNewTrip}
                  >
                    Plan New Trip
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation("/interests")}
                  >
                    <i className="fas fa-compass mr-2"></i>
                    Discover More
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* My Saved Routes Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Saved Routes</h2>
          
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading trips: {error}</p>
            </div>
          )}

          {trips.length === 0 && !tripsLoading && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <i className="fas fa-route text-gray-300 text-6xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved trips yet</h3>
                <p className="text-gray-600 mb-6">Discover amazing places tailored to your interests or start planning your own adventure.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => setLocation("/interests")} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <i className="fas fa-compass mr-2"></i>
                    Discover Trips
                  </Button>
                  <Button 
                    onClick={handlePlanNewTrip} 
                    variant="outline"
                    className="border-gray-300"
                  >
                    <i className="fas fa-map-marked-alt mr-2"></i>
                    Plan Custom Trip
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{trip.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {trip.startCity} → {trip.endCity}
                      </p>
                      <p className="text-xs text-gray-500">
                        Saved {new Date(trip.createdAt).toLocaleDateString()}
                      </p>
                      {trip.routeData && (
                        <p className="text-xs text-gray-500">
                          {trip.routeData.duration} • {trip.routeData.distance}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {trip.poisData.length} places to visit
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="min-w-[40px] min-h-[40px]" 
                        aria-label="Delete trip"
                        onClick={() => handleDeleteTrip(trip.id)}
                      >
                        <i className="fas fa-trash text-gray-400 hover:text-red-500"></i>
                      </Button>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 min-h-[44px]"
                    onClick={() => handleViewTrip(trip)}
                  >
                    View on Map
                    <i className="fas fa-external-link-alt ml-2 text-xs"></i>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* My Places Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Places</h2>
          
          {/* Extract unique places from user's saved trips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="max-w-md mx-auto">
                  <i className="fas fa-map-marked-alt text-gray-300 text-6xl mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No places discovered yet</h3>
                  <p className="text-gray-600 mb-6">Start exploring to build your collection of amazing places.</p>
                  <Button 
                    onClick={() => setLocation("/interests")} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <i className="fas fa-compass mr-2"></i>
                    Explore Destinations
                  </Button>
                </div>
              </div>
            ) : (
              // Extract unique places from all trips
              trips
                .flatMap(trip => trip.poisData || [])
                .filter((poi, index, self) => 
                  index === self.findIndex(p => p.placeId === poi.placeId && poi.placeId !== null)
                )
                .slice(0, 6) // Show max 6 places
                .map((poi, index) => (
                  <Card key={`${poi.placeId || poi.id}-${index}`} className="shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-w-16 aspect-h-9">
                      <img 
                        src={poi.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop"} 
                        alt={poi.name} 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop";
                        }}
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{poi.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 capitalize">{poi.category}</p>
                      <div className="flex items-center mb-4">
                        <div className="flex items-center">
                          <i className="fas fa-star text-yellow-400 mr-1"></i>
                          <span className="text-sm text-gray-600">{poi.rating}</span>
                          <span className="text-sm text-gray-500 ml-1">({poi.reviewCount})</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 min-h-[44px]">
                        View on Map
                      </Button>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;