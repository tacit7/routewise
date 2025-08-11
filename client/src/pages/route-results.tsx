import { useLocation } from "wouter";
import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { POI, RouteResultsAPIResponse } from "@/types/api";
import type { Poi } from "@/types/schema";
import PlacesView from "@/components/places-view";
import DeveloperCacheFAB from "@/components/developer-cache-fab";

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
          end: routeData.endCity,
          _t: Date.now().toString() // Cache bust in URL params, not query key
        });

        const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
        
        devLog('🔍 Fetching route results with params:', params.toString());
        const response = await fetch(`/api/route-results?${params}`, {
          cache: 'no-store', // Force no caching
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        devLog('📊 Route Results API response status:', response.status);

        if (!response.ok) {

          const errorText = await response.text();
          devLog('❌ Route Results API error:', response.status, errorText);
          throw new Error(`Failed to fetch route results: ${response.status} ${errorText}`);
        }

        const routeResponse = await response.json();
        devLog('✅ Route Results data received:', routeResponse);
        
        const { success, data, _cache } = routeResponse;
        if (!success || !data) throw new Error("Invalid response format");

        // AGGRESSIVE DEBUGGING - Check what cities the backend thinks we requested
        devLog('🎯 Backend processed cities:', {
          requested_start: routeData.startCity,
          requested_end: routeData.endCity,
          backend_meta: data.meta,
          poi_count: data.pois?.length || 0,
          first_poi: data.pois?.[0]?.address || 'none',
          cache: _cache
        });

        return {
          pois: data.pois || [],
          route: data.route || null,
          maps_api_key: data.maps_api_key || null,
          meta: data.meta || null,
          trip_places: data.trip_places || [],
          _cache: _cache || { status: 'unknown', backend: 'unknown', environment: 'unknown', timestamp: null },
        };
      } catch (error) {
        const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
        devLog('Error fetching POIs:', error);
        return {
          pois: [],
          route: null,
          maps_api_key: null,
          meta: null,
          trip_places: [],
          _cache: { status: 'error', backend: 'unknown', environment: 'unknown', timestamp: null }
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
    const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
    devLog("POI clicked:", poi.name);
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

    console.log('🔍 Route Results - URL Params:', { start, end });

    if (start && end) {
      console.log('✅ Using URL params for route data:', { start, end });
      setRouteData({ startCity: start, endCity: end });
    } else {
      const savedData = localStorage.getItem("routeData");
      console.log('💾 Checking localStorage for routeData:', savedData);
      
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log('✅ Using localStorage route data:', parsed);
          setRouteData(parsed);
        } catch {
          console.error('❌ Failed to parse localStorage routeData, redirecting to home');
          setLocation("/");
        }
      } else {
        console.warn('❌ No route data found in URL or localStorage, redirecting to home');
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

  // Cache info for developer debugging
  const cacheInfo = useMemo(() => {
    const cache = routeResults?._cache;
    const localStorageKeys = ['routeData', 'tripPlaces'];
    
    return {
      backendStatus: cache?.status || 'unknown',
      backendType: cache?.backend || 'unknown',
      timestamp: cache?.timestamp,
      queryStatus: poisLoading ? 'loading' : poisError ? 'error' : 'fresh',
      lastFetch: undefined, // TanStack query doesn't expose this easily for route results
      pageType: 'route-results' as const,
      apiEndpoint: '/api/route-results',
      dataCount: pois.length,
      hasLocalData: !!localStorage.getItem('routeData') || !!localStorage.getItem('tripPlaces'),
      localStorageKeys: localStorageKeys.filter(key => localStorage.getItem(key))
    };
  }, [routeResults?._cache, poisLoading, poisError, pois.length]);

  if (poisError) {
    const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
    devLog('❌ Route Results Error:', poisError);
  }

  return (
    <>
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
      <DeveloperCacheFAB cacheInfo={cacheInfo} />
    </>
  );
}
