import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { POI, RouteResultsAPIResponse } from "@/types/api";
import type { Poi } from "@/types/schema";

interface ExploreData {
  startLocation: string;
}

async function fetchExploreResults(startLocation: string): Promise<RouteResultsAPIResponse> {
  const params = new URLSearchParams({ location: startLocation });

  try {
    const response = await fetch(`/api/explore-results?${params}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetch failed: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    const { success, data, _cache } = responseData;
    if (!success || !data) throw new Error("Invalid response format");

    return {
      pois: data.pois || [],
      maps_api_key: data.maps_api_key || null,
      meta: data.meta || null,
      _cache: _cache || { status: 'unknown', backend: 'unknown', environment: 'unknown', timestamp: null },
    };
  } catch (err) {
    const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
    devLog("❌ Explore Results API Error:", err);
    return {
      pois: [],
      maps_api_key: null,
      meta: null,
      _cache: { status: 'error', backend: 'unknown', environment: 'unknown', timestamp: null }
    };
  }
}

export function useExploreResults() {
  const [, setLocation] = useLocation();
  const [exploreData, setExploreData] = useState<ExploreData | null>(null);
  const [selectedPoiIds, setSelectedPoiIds] = useState<number[]>([]);
  const [hoveredPoi, setHoveredPoi] = useState<POI | Poi | null>(null);

  // Load location from query string or localStorage
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const locationParam = searchParams.get("location");

    if (locationParam) {
      setExploreData({ startLocation: locationParam });
      return;
    }

    const saved = localStorage.getItem("exploreData");
    if (saved) {
      try {
        setExploreData(JSON.parse(saved));
      } catch {
        setLocation("/");
      }
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const query = useQuery({
    queryKey: ["/api/explore-results", exploreData?.startLocation],
    queryFn: () =>
      exploreData
        ? fetchExploreResults(exploreData.startLocation)
        : Promise.resolve({ pois: [], maps_api_key: null, meta: null }),
    enabled: !!exploreData,
    staleTime: 5 * 60 * 1000, // 5 minutes - explore data is stable
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    refetchOnWindowFocus: false, // Explore data doesn't change often
    refetchOnReconnect: true,
  });
  const pois = useMemo(() => query.data?.pois || [], [query.data]);

  // Cache info for developer debugging
  const cacheInfo = useMemo(() => {
    const cache = query.data?._cache;
    const localStorageKeys = ['exploreData'];

    return {
      backendStatus: cache?.status || 'unknown',
      backendType: cache?.backend || 'unknown',
      environment: cache?.environment,
      timestamp: cache?.timestamp,
      queryStatus: query.isLoading ? 'loading' : query.isError ? 'error' : query.isFetching ? 'stale' : 'fresh',
      lastFetch: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : undefined,
      pageType: 'explore-results' as const,
      apiEndpoint: '/api/explore-results',
      dataCount: pois.length,
      hasLocalData: !!localStorage.getItem('exploreData'),
      localStorageKeys: localStorageKeys.filter(key => localStorage.getItem(key))
    };
  }, [query.data?._cache, query.isLoading, query.isError, query.isFetching, query.dataUpdatedAt, pois.length]);

  const handlePoiClick = (poi: POI | Poi) => {
    const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
    devLog("POI clicked:", poi.name);
  };

  const handlePoiSelect = (poiId: number, selected: boolean) => {
    setSelectedPoiIds((prev) => (selected ? [...prev, poiId] : prev.filter((id) => id !== poiId)));
  };

  return {
    exploreData,
    pois,
    apiKey: query.data?.maps_api_key,
    isLoading: query.isLoading,
    error: query.error,
    selectedPoiIds,
    hoveredPoi,
    setHoveredPoi,
    handlePoiClick,
    handlePoiSelect,
    cacheInfo,
  };
}
