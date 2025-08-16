import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Map as LeafletMap } from "leaflet";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MultiRouteRenderer } from "@/utils/MultiRouteRenderer";
import type { MultiDayRouteData, ItineraryDay } from "@/types/schema";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

interface TabControlledRouteMapProps {
  routeData: MultiDayRouteData | null;
  activeDays: number[] | 'all';
  onMapReady?: (map: LeafletMap) => void;
  className?: string;
  height?: string;
}

// Component to handle route rendering within the map context
const RouteRenderer: React.FC<{
  routeData: MultiDayRouteData | null;
  activeDays: number[] | 'all';
  onMapReady?: (map: LeafletMap) => void;
}> = ({ routeData, activeDays, onMapReady }) => {
  const map = useMap();
  const rendererRef = useRef<MultiRouteRenderer | null>(null);

  // Initialize the route renderer
  useEffect(() => {
    if (map && !rendererRef.current) {
      rendererRef.current = new MultiRouteRenderer(map);
      onMapReady?.(map);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [map, onMapReady]);

  // Update routes when route data changes
  useEffect(() => {
    if (rendererRef.current && routeData) {
      console.log('🗺️ TabControlledRouteMap - Route data:', routeData);
      console.log('🗺️ Routes by day:', routeData.routesByDay);
      console.log('🗺️ Itinerary:', routeData.itinerary.itinerary);
      
      // Check if we have any calculated routes
      const hasRoutes = Object.keys(routeData.routesByDay).length > 0;
      console.log('🗺️ Has routes:', hasRoutes);
      
      if (hasRoutes) {
        console.log('🗺️ Using addMultiDayRoutes');
        // Show routes with waypoints
        rendererRef.current.addMultiDayRoutes(
          routeData.routesByDay,
          routeData.itinerary.itinerary
        );
      } else {
        console.log('🗺️ Using addStandaloneWaypoints');
        console.log('🗺️ Waypoints to add:', routeData.itinerary.itinerary.map(day => ({
          day: day.day,
          waypoints: day.waypoints.map(w => ({ name: w.name, lat: w.lat, lng: w.lng }))
        })));
        // Show just waypoint markers without routes
        rendererRef.current.addStandaloneWaypoints(routeData.itinerary.itinerary);
      }
    }
  }, [routeData]);

  // Update visible routes when active days change
  useEffect(() => {
    if (rendererRef.current && routeData) {
      if (activeDays === 'all') {
        rendererRef.current.showAllRoutes();
      } else if (Array.isArray(activeDays) && activeDays.length > 0) {
        rendererRef.current.showDays(activeDays);
      } else {
        rendererRef.current.hideAllRoutes();
      }
    }
  }, [activeDays, routeData]);

  return null;
};

// Calculate map center from route data
const calculateMapCenter = (routeData: MultiDayRouteData | null): [number, number] => {
  if (!routeData || routeData.itinerary.itinerary.length === 0) {
    return [39.8283, -98.5795]; // Default to center of US
  }

  const allWaypoints = routeData.itinerary.itinerary.flatMap(day => day.waypoints);
  
  if (allWaypoints.length === 0) {
    return [39.8283, -98.5795];
  }

  const avgLat = allWaypoints.reduce((sum, wp) => sum + wp.lat, 0) / allWaypoints.length;
  const avgLng = allWaypoints.reduce((sum, wp) => sum + wp.lng, 0) / allWaypoints.length;

  return [avgLat, avgLng];
};

// Map loading skeleton
const MapSkeleton: React.FC<{ className?: string; height?: string }> = ({ className, height }) => (
  <div
    className={`relative overflow-hidden border border-border bg-muted/30 ${className}`}
    style={{ height }}
  >
    <div className="absolute inset-0 opacity-20">
      <div className="w-full h-full bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
    </div>

    {/* Mock route paths */}
    <div className="absolute top-1/4 left-1/4 w-1/2 h-1 bg-blue-500/40 rounded-full animate-pulse transform rotate-12" />
    <div className="absolute top-1/2 left-1/3 w-1/3 h-1 bg-red-500/40 rounded-full animate-pulse transform -rotate-12" />
    <div className="absolute top-3/4 left-1/5 w-2/5 h-1 bg-green-500/40 rounded-full animate-pulse transform rotate-6" />

    {/* Mock waypoints */}
    <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-500/60 rounded-full animate-pulse" />
    <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-red-500/60 rounded-full animate-pulse" />
    <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-green-500/60 rounded-full animate-pulse" />

    <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-30">
      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
      <p className="text-xs text-muted-foreground">Loading multi-day routes...</p>
    </div>
  </div>
);

export const TabControlledRouteMap: React.FC<TabControlledRouteMapProps> = ({
  routeData,
  activeDays,
  onMapReady,
  className = "",
  height = "500px",
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for map initialization
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const center = calculateMapCenter(routeData);

  if (isLoading) {
    return <MapSkeleton className={className} height={height} />;
  }

  return (
    <div
      className={`relative overflow-hidden border border-border ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          keepBuffer={2}
          updateWhenIdle={true}
          updateWhenZooming={false}
        />
        
        <RouteRenderer
          routeData={routeData}
          activeDays={activeDays}
          onMapReady={onMapReady}
        />
      </MapContainer>
    </div>
  );
};