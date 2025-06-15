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

  // Fetch POIs for things to do along the route
  const { data: pois, isLoading: poisLoading } = useQuery<Poi[]>({
    queryKey: ["/api/pois"],
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

  const googleMapsEmbedUrl = `https://www.google.com/maps/embed/v1/directions?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&origin=${encodeURIComponent(routeData.startCity)}&destination=${encodeURIComponent(routeData.endCity)}&mode=driving`;

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

        {/* Google Maps Embed */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Interactive Route Map</h2>
            <p className="text-slate-600 text-sm mt-1">
              Use the map below to explore your route and get detailed directions
            </p>
          </div>
          
          <div className="relative" style={{ height: '600px' }}>
            <iframe
              src={googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Route Map"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => {
              const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(routeData.startCity)}/${encodeURIComponent(routeData.endCity)}`;
              window.open(googleMapsUrl, '_blank');
            }}
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

        {/* Note about Places */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-info-circle text-blue-500 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Discover Amazing Stops
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Don't forget to check out the curated stops and attractions we've discovered along popular routes. 
                  <button 
                    onClick={() => setLocation('/')}
                    className="font-medium underline hover:no-underline ml-1"
                  >
                    View suggested stops
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}