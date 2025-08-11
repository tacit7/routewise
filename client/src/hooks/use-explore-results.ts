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

    const { success, data } = await response.json();
    if (!success || !data) throw new Error("Invalid response format");

    return {
      pois: data.pois || [],
      maps_api_key: data.maps_api_key || null,
      meta: data.meta || null,
    };
  } catch (err) {
    const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
    devLog("❌ Explore Results API Error:", err);
    return { pois: [], maps_api_key: null, meta: null };
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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const pois = useMemo(() => query.data?.pois || [], [query.data]);

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
  };
}
