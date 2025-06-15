import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Poi } from "@shared/schema";
import PoiCard from "@/components/poi-card";
import { Skeleton } from "@/components/ui/skeleton";

interface RouteData {
  startCity: string;
  endCity: string;
}

export default function RouteResults() {
  const [, setLocation] = useLocation();
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  // Fetch POIs for things to do along the specific route
  const { data: pois, isLoading: poisLoading } = useQuery<Poi[]>({
    queryKey: ["/api/pois", routeData?.startCity, routeData?.endCity],
    queryFn: async () => {
      if (!routeData) return [];
      const params = new URLSearchParams({
        start: routeData.startCity,
        end: routeData.endCity
      });
      const response = await fetch(`/api/pois?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch places along route');
      }
      return response.json();
    },
    enabled: !!routeData, // Only run query when we have route data
  });

  useEffect(() => {
    // Get route data from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const start = urlParams.get('start');
    const end = urlParams.get('end');
    
    if (start && end) {
      setRouteData({ startCity: start, endCity: end });
    } else {
      // Fallback to localStorage if no URL params
      const savedRoute = localStorage.getItem('currentRoute');
      if (savedRoute) {
        setRouteData(JSON.parse(savedRoute));
      } else {
        // No route data found, redirect to home
        setLocation('/');
      }
    }
  }, [setLocation]);

  if (!routeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your route...</p>
        </div>
      </div>
    );
  }

  // For now, create a fallback that opens Google Maps in a new tab since we need Maps API key
  const googleMapsDirectUrl = `https://www.google.com/maps/dir/${encodeURIComponent(routeData.startCity)}/${encodeURIComponent(routeData.endCity)}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="flex items-center text-slate-600 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-xl font-semibold text-slate-800">Your Route</h1>
            <div></div>
          </div>
        </div>
      </header>

      {/* Route Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-center space-x-4 text-lg">
            <div className="flex items-center text-secondary">
              <MapPin className="h-5 w-5 mr-2" />
              <span className="font-medium">{routeData.startCity}</span>
            </div>
            <div className="text-slate-400">→</div>
            <div className="flex items-center text-accent">
              <Flag className="h-5 w-5 mr-2" />
              <span className="font-medium">{routeData.endCity}</span>
            </div>
          </div>
        </div>

        {/* Interactive Map Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Interactive Route Map</h2>
            <p className="text-slate-600 text-sm mt-1">
              Click below to view your full route with turn-by-turn directions in Google Maps
            </p>
          </div>
          
          <div className="p-8 text-center" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="max-w-md">
              <div className="mb-6">
                <i className="fas fa-map-marked-alt text-6xl text-blue-500 mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                View Full Route in Google Maps
              </h3>
              <p className="text-slate-600 mb-6">
                Get detailed turn-by-turn directions, real-time traffic updates, and explore your route interactively.
              </p>
              <Button
                onClick={() => window.open(googleMapsDirectUrl, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                <i className="fas fa-external-link-alt mr-3" />
                Open Route in Google Maps
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => window.open(googleMapsDirectUrl, '_blank')}
            className="bg-primary hover:bg-blue-700 text-white"
          >
            <i className="fas fa-route mr-2" />
            Open in Google Maps
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Plan Another Route
          </Button>
        </div>

        {/* Things to Do Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Things to Do Along Your Route
            </h2>
            <p className="text-slate-600 mb-8">
              Discover amazing stops, restaurants, and attractions along your journey. All places are sourced from real Google Places data.
            </p>

            {poisLoading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
                    <Skeleton className="w-full h-48" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!poisLoading && (!pois || pois.length === 0) && (
              <div className="text-center py-12">
                <div className="mb-4">
                  <i className="fas fa-map-marker-alt text-gray-400 text-4xl" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No Places Found</h3>
                <p className="text-slate-600">
                  Unable to load places data. Please check if the Google Places API is properly configured.
                </p>
              </div>
            )}

            {pois && pois.length > 0 && (
              <>
                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium">
                    All Places ({pois.length})
                  </button>
                  <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200">
                    Restaurants ({pois.filter(p => p.category === 'restaurant').length})
                  </button>
                  <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200">
                    Attractions ({pois.filter(p => p.category === 'attraction').length})
                  </button>
                  <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200">
                    Parks ({pois.filter(p => p.category === 'park').length})
                  </button>
                  <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200">
                    Historic ({pois.filter(p => p.category === 'historic').length})
                  </button>
                </div>

                {/* Places Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pois.map((poi) => (
                    <PoiCard key={poi.id} poi={poi} />
                  ))}
                </div>

                {/* Summary Stats */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {pois.filter(p => p.category === 'restaurant').length}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">Restaurants</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {pois.filter(p => p.category === 'park').length}
                    </div>
                    <div className="text-sm text-green-700 font-medium">Parks</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {pois.filter(p => p.category === 'attraction').length}
                    </div>
                    <div className="text-sm text-purple-700 font-medium">Attractions</div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {pois.filter(p => parseFloat(p.rating) >= 4.5).length}
                    </div>
                    <div className="text-sm text-amber-700 font-medium">Highly Rated</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}