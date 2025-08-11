import { useLocation } from "wouter";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { POI, RouteResultsAPIResponse } from "@/types/api";
import type { Poi } from "@/types/schema";
import PlacesView from "@/components/places-view";

interface RouteData {
  startCity: string;
  endCity: string;
}


export default function RouteResults() {
  const [, setLocation] = useLocation();
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [selectedPoiIds, setSelectedPoiIds] = useState<number[]>([]);
  const [hoveredPoi, setHoveredPoi] = useState<POI | Poi | null>(null);
  const { toast } = useToast();

  // Fetch POIs along the route using the correct Phoenix API endpoint
  const { data: routeResults, isLoading: poisLoading, error: poisError } = useQuery({
    queryKey: ["/api/route-results", routeData?.startCity, routeData?.endCity],
    queryFn: async () => {
      if (!routeData) return { pois: [], route: null, maps_api_key: null, meta: null };

      try {
        const params = new URLSearchParams({
          start: routeData.startCity,
          end: routeData.endCity
        });

        console.log('🔍 Fetching route results with params:', params.toString());
        const response = await fetch(`/api/route-results?${params}`);
        console.log('📊 Route Results API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Route Results API error:', response.status, errorText);
          throw new Error(`Failed to fetch route results: ${response.status} ${errorText}`);
        }

        const routeResponse = await response.json();
        console.log('✅ Route Results data received:', routeResponse);

        debugger;
        if (routeResponse.success && routeResponse.data) {
          return {
            pois: routeResponse.data.pois || [],
            route: routeResponse.data.route || null,
            maps_api_key: routeResponse.data.maps_api_key || null,
            meta: routeResponse.data.meta || null,
            trip_places: routeResponse.data.trip_places || []
          };
        } else {
          throw new Error('Invalid response format from route results API');
        }
      } catch (error) {
        console.error('Error fetching POIs:', error);
        return {
          pois: [],
          route: null,
          maps_api_key: null,
          meta: null,
          trip_places: []
        };
      }
    },
    enabled: !!routeData,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Event handlers for the PlacesView component

  const handlePoiClick = (poi: POI | Poi) => {
    console.log("POI clicked:", poi.name);
  };

  const handlePoiSelect = (poiId: number, selected: boolean) => {
    if (selected) {
      setSelectedPoiIds((prev) => [...prev, poiId]);
    } else {
      setSelectedPoiIds((prev) => prev.filter((id) => id !== poiId));
    }
  };

  const handlePoiHover = (poi: POI | Poi | null) => {
    setHoveredPoi(poi);
  };

  // Get route data from URL parameters or localStorage
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (start && end) {
      setRouteData({ startCity: start, endCity: end });
    } else {
      const savedData = localStorage.getItem("routeData");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setRouteData(parsed);
        } catch {
          setLocation("/");
        }
      } else {
        setLocation("/");
      }
    }
  }, [setLocation]);


  // Don't render anything until we have route data
  if (!routeData) {
    return null;
  }

  // Extract POIs from route results
  const pois = routeResults?.pois || [];

  if (poisError) {
    console.error('❌ Route Results Error:', poisError);
  }

  return (
    <PlacesView
      startLocation={routeData.startCity}
      endLocation={routeData.endCity}
      pois={pois}
      isLoading={poisLoading}
      showRouting={true} // Show routing for route results
      apiKey={routeResults?.maps_api_key}
      selectedPoiIds={selectedPoiIds}
      hoveredPoi={hoveredPoi}
      onPoiClick={handlePoiClick}
      onPoiSelect={handlePoiSelect}
      onPoiHover={handlePoiHover}
      headerTitle={`${routeData.startCity} → ${routeData.endCity}`}
      sidebarTitle="Places Along Route"
      backUrl="/"
    />
  );
}
