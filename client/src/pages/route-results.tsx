import { useLocation } from "wouter";
import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  MapPin,
  Flag,
  Loader2,
  Map as MapIcon,
  Star,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Poi } from "@/types/schema";
import PoiCard from "@/components/poi-card";
import ItineraryComponent from "@/components/itinerary-component-enhanced";
import { InteractiveMap } from "@/components/interactive-map";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTripPlaces } from "@/hooks/use-trip-places";

interface RouteData {
  startCity: string;
  endCity: string;
}

// Helper function to extract city from POI data
const extractCityFromPoi = (poi: Poi): string | null => {
  // For route POIs, try to extract city from address
  if (poi.address) {
    // Split address and look for city, state pattern
    const addressParts = poi.address.split(",").map((part) => part.trim());

    // Look for a part that contains a state abbreviation (2 uppercase letters)
    const statePattern = /\b[A-Z]{2}\b/;
    const stateIndex = addressParts.findIndex((part) =>
      statePattern.test(part)
    );

    if (stateIndex > 0) {
      // City should be the part before the state
      const cityPart = addressParts[stateIndex - 1];
      // Remove any numbers or street suffixes to get just the city name
      const cityMatch = cityPart.match(/([A-Za-z\s]+)/);
      if (cityMatch) {
        const city = cityMatch[1].trim().toLowerCase();
        // Filter out obvious street names
        if (
          !city.match(
            /\b(street|road|avenue|drive|boulevard|lane|way|place|court|circle)\b/i
          )
        ) {
          return city;
        }
      }
    }

    // Fallback: look for common city names in the address
    const commonCities = [
      "austin",
      "dallas",
      "houston",
      "san antonio",
      "fort worth",
      "el paso",
      "arlington",
      "corpus christi",
      "plano",
      "lubbock",
      "irving",
      "garland",
      "amarillo",
      "grand prairie",
      "brownsville",
      "pasadena",
      "mesquite",
      "mckinney",
      "carrollton",
      "beaumont",
      "abilene",
      "round rock",
      "richardson",
      "midland",
      "lewisville",
      "college station",
      "pearland",
      "denton",
      "sugar land",
    ];

    const addressLower = poi.address.toLowerCase();
    for (const city of commonCities) {
      if (addressLower.includes(city)) {
        return city;
      }
    }
  }

  return null;
};

export default function RouteResults() {
  const [, setLocation] = useLocation();
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedPoiIds, setSelectedPoiIds] = useState<number[]>([]);
  const [hoveredPoi, setHoveredPoi] = useState<Poi | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const { toast } = useToast();
  const { tripPlaces } = useTripPlaces();

  // TODO: Phoenix backend doesn't provide Maps API key endpoint yet
  // Disable Maps API key fetching for now
  const mapsApiData = null;
  const mapsApiLoading = false;

  // Fetch POIs for things to do along the specific route
  const { data: pois, isLoading: poisLoading, error: poisError } = useQuery<Poi[]>({
    queryKey: ["/api/pois", routeData?.startCity, routeData?.endCity, routeData?.verified],
    queryFn: async () => {
      if (!routeData) return [];
      const params = new URLSearchParams({
        start: routeData.startCity,
        end: routeData.endCity,
      });
      console.log('🔍 Fetching POIs with params:', params.toString());
      const response = await fetch(`/api/pois?${params}`);
      console.log('📊 POI API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ POI API error:', response.status, errorText);
        throw new Error(`Failed to fetch places along route: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('✅ POI API data received:', data.length, 'items');
      console.log('📋 First few POIs:', data.slice(0, 3));
      return data;
    },
    enabled: !!routeData, // Only run query when we have route data
  });

  // Debug POI API state
  console.log('🔍 POI Query State:', { 
    loading: poisLoading, 
    error: poisError, 
    dataType: typeof pois,
    dataLength: pois?.length,
    routeDataExists: !!routeData 
  });
  
  if (poisError) {
    console.error('❌ POI Error:', poisError);
  }

  // Remove duplicates based on placeId - with debugging
  console.log('Raw pois data:', pois);
  const poisArray = Array.isArray(pois) ? pois : (pois?.data ? pois.data : []);
  console.log('Processed poisArray:', poisArray);
  
  const uniquePois = poisArray.filter(
    (poi, index, self) => {
      if (!poi || typeof poi !== 'object') {
        console.warn('Invalid POI data:', poi);
        return false;
      }
      return index === self.findIndex((p) => p?.placeId === poi?.placeId);
    }
  );

  // Generate available cities from actual POI data instead of hardcoded route cities
  const availableCities = useMemo(() => {
    const citySet = new Set<string>();

    // Add route cities
    if (routeData) {
      citySet.add(routeData.startCity.toLowerCase());
      citySet.add(routeData.endCity.toLowerCase());
    }

    // Add cities extracted from POI data
    uniquePois.forEach((poi) => {
      const city = extractCityFromPoi(poi);
      if (city) {
        citySet.add(city);
      }
    });

    const cities = Array.from(citySet)
      .map((city) => city.charAt(0).toUpperCase() + city.slice(1))
      .sort();

    return cities;
  }, [uniquePois, routeData]);

  const filteredPois = uniquePois.filter((poi) => {
    const categoryMatch =
      selectedCategory === "all" || poi.category === selectedCategory;

    // City filtering
    let cityMatch = selectedCity === "all";

    if (!cityMatch && selectedCity !== "all") {
      const poiCity = extractCityFromPoi(poi);

      if (poiCity) {
        cityMatch = poiCity === selectedCity.toLowerCase();
      } else {
        // If we can't determine the POI's city, include it for route cities
        const routeCitiesLower = [
          routeData?.startCity.toLowerCase(),
          routeData?.endCity.toLowerCase(),
        ].filter(Boolean);

        cityMatch = routeCitiesLower.includes(selectedCity.toLowerCase());
      }
    }

    return categoryMatch && cityMatch;
  });

  const handleUpdateSelectedPois = (selectedIds: number[]) => {
    setSelectedPoiIds(selectedIds);
    console.log("Selected POI IDs:", selectedIds);
  };

  const handlePoiClick = (poi: Poi) => {
    console.log("POI clicked:", poi.name);
    // Could show details modal or scroll to POI card
  };

  const handlePoiSelect = (poiId: number, selected: boolean) => {
    if (selected) {
      setSelectedPoiIds((prev) => [...prev, poiId]);
    } else {
      setSelectedPoiIds((prev) => prev.filter((id) => id !== poiId));
    }
  };

  const handlePoiHover = (poi: Poi | null) => {
    setHoveredPoi(poi);
  };

  useEffect(() => {
    // Get route data from URL parameters or localStorage
    const searchParams = new URLSearchParams(window.location.search);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (start && end) {
      setRouteData({ startCity: start, endCity: end });
    } else {
      // Try to get from localStorage as fallback
      const savedData = localStorage.getItem("routeData");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setRouteData(parsed);
        } catch {
          // If parsing fails, redirect to home
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

  const handleSaveRoute = async () => {
    if (!routeData || uniquePois.length === 0) return;

    try {
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startCity: routeData.startCity,
          endCity: routeData.endCity,
          poisIds: uniquePois.map((poi) => poi.id),
          checkpoints: [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save route");
      }

      toast({
        title: "Route Saved!",
        description: `Your route from ${routeData.startCity} to ${routeData.endCity} has been saved with ${uniquePois.length} places.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save route. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="flex items-center text-slate-600 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                {routeData.startCity} → {routeData.endCity} •{" "}
                {uniquePois.length} places
              </div>
              <button
                onClick={() => setIsMapVisible(!isMapVisible)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                <MapIcon className="h-4 w-4" />
                {isMapVisible ? "Hide Map" : "Show Map"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width layout with no gaps */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Compact POI Cards */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">
              Places Along Route
            </h2>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setSelectedCity("all")}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedCity === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                All ({uniquePois.length})
              </button>
            </div>
          </div>

          {/* Scrollable POI List */}
          <div className="flex-1 overflow-y-auto">
            {poisLoading && (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600">Loading places...</p>
              </div>
            )}

            {!poisLoading && uniquePois.length === 0 && (
              <div className="p-4 text-center">
                <div className="text-2xl mb-2">🗺️</div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">
                  No places found
                </h3>
                <p className="text-xs text-slate-600">Try a different route.</p>
              </div>
            )}

            {uniquePois.length > 0 && (
              <div className="p-2 space-y-2">
                {console.log('🎯 Rendering POI Cards:', {
                  uniquePoisLength: uniquePois.length,
                  filteredPoisLength: filteredPois.length,
                  firstFilteredPoi: filteredPois[0],
                  selectedCity
                })}
                {filteredPois.map((poi, index) => (
                  <div
                    key={poi.placeId || poi.id || `poi-${index}`}
                    onMouseEnter={() => handlePoiHover(poi)}
                    onMouseLeave={() => handlePoiHover(null)}
                    className="transition-all"
                  >
                    <PoiCard poi={poi} variant="compact" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start Itinerary Button */}
          {tripPlaces.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <Button
                onClick={() => setLocation('/itinerary')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Start Itinerary ({tripPlaces.length} places)
              </Button>
            </div>
          )}
        </div>

        {/* Main Map Area - Full Width */}
        {isMapVisible && (
          <div className="flex-1">
            {poisLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Loading map and places...</p>
                </div>
              </div>
            ) : (
              <InteractiveMap
                startCity={routeData.startCity}
                endCity={routeData.endCity}
                checkpoints={[]}
                pois={uniquePois}
                selectedPoiIds={selectedPoiIds}
                hoveredPoi={hoveredPoi}
                onPoiClick={handlePoiClick}
                onPoiSelect={handlePoiSelect}
                height="100%"
                className="w-full h-full"
              />
            )}
          </div>
        )}

        {/* When map is hidden, show full-width POI grid */}
        {!isMapVisible && (
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPois.map((poi, index) => (
                  <div
                    key={poi.placeId || poi.id || `poi-${index}`}
                    onMouseEnter={() => handlePoiHover(poi)}
                    onMouseLeave={() => handlePoiHover(null)}
                    className="transition-all"
                  >
                    <PoiCard poi={poi} variant="grid" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
