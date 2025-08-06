import { useLocation } from "wouter";
import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  Map as MapIcon,
  Star,
  Calendar,
  Clock,
  Phone,
  Globe,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Poi } from "@shared/schema";
import PoiCard from "@/components/poi-card";
import { InteractiveMap } from "@/components/interactive-map";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTripPlaces } from "@/hooks/use-trip-places";

interface PlaceData {
  placeName: string;
  placeId?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export default function PlaceResults() {
  const [, setLocation] = useLocation();
  const [placeData, setPlaceData] = useState<PlaceData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPoiIds, setSelectedPoiIds] = useState<number[]>([]);
  const [hoveredPoi, setHoveredPoi] = useState<Poi | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const { toast } = useToast();
  const { tripPlaces } = useTripPlaces();

  // TODO: Phoenix backend doesn't provide Maps API key endpoint yet
  // Disable Maps API key fetching for now
  const mapsApiData = null;
  const mapsApiLoading = false;

  // Fetch POIs for the specific place
  const { data: pois, isLoading: poisLoading } = useQuery<Poi[]>({
    queryKey: ["/api/pois/place", placeData?.placeName],
    queryFn: async () => {
      if (!placeData) return [];
      const params = new URLSearchParams({
        location: placeData.placeName,
        radius: "10000", // 10km radius
      });
      const response = await fetch(`/api/pois/nearby?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch places nearby");
      }
      return response.json();
    },
    enabled: !!placeData,
  });

  // Remove duplicates based on placeId
  const uniquePois = (pois || []).filter(
    (poi, index, self) =>
      index === self.findIndex((p) => p.placeId === poi.placeId)
  );

  // Get unique categories from POIs
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    uniquePois.forEach((poi) => {
      if (poi.category) {
        categorySet.add(poi.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [uniquePois]);

  const filteredPois = uniquePois.filter((poi) => {
    return selectedCategory === "all" || poi.category === selectedCategory;
  });

  const handlePoiClick = (poi: Poi) => {
    console.log("POI clicked:", poi.name);
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
    // Get place data from URL parameters or localStorage
    const searchParams = new URLSearchParams(window.location.search);
    const place = searchParams.get("place");
    const placeId = searchParams.get("placeId");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (place) {
      const locationData: PlaceData = {
        placeName: place,
        placeId: placeId || undefined,
      };

      if (lat && lng) {
        locationData.location = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        };
      }

      setPlaceData(locationData);
    } else {
      // Try to get from localStorage as fallback
      const savedData = localStorage.getItem("placeData");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setPlaceData(parsed);
        } catch {
          setLocation("/");
        }
      } else {
        setLocation("/");
      }
    }
  }, [setLocation]);

  // Don't render anything until we have place data
  if (!placeData) {
    return null;
  }

  const handleSavePlace = async () => {
    if (!placeData || uniquePois.length === 0) return;

    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeName: placeData.placeName,
          placeId: placeData.placeId,
          location: placeData.location,
          poisIds: uniquePois.map((poi) => poi.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save place");
      }

      toast({
        title: "Place Saved!",
        description: `${placeData.placeName} has been saved with ${uniquePois.length} nearby places.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save place. Please try again.",
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
                <MapPin className="h-4 w-4 inline mr-1" />
                {placeData.placeName} • {uniquePois.length} nearby places
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
              Places Near {placeData.placeName}
            </h2>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1 mt-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                All ({uniquePois.length})
              </button>
              {availableCategories.slice(0, 4).map((category) => {
                const count = uniquePois.filter(poi => poi.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors capitalize ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable POI List */}
          <div className="flex-1 overflow-y-auto">
            {poisLoading && (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600">Loading nearby places...</p>
              </div>
            )}

            {!poisLoading && uniquePois.length === 0 && (
              <div className="p-4 text-center">
                <div className="text-2xl mb-2">📍</div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">
                  No places found
                </h3>
                <p className="text-xs text-slate-600">
                  No nearby attractions found for this location.
                </p>
              </div>
            )}

            {uniquePois.length > 0 && (
              <div className="p-2 space-y-2">
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
            <InteractiveMap
              startCity={placeData.placeName}
              endCity={placeData.placeName}
              checkpoints={[]}
              pois={uniquePois}
              selectedPoiIds={selectedPoiIds}
              hoveredPoi={hoveredPoi}
              onPoiClick={handlePoiClick}
              onPoiSelect={handlePoiSelect}
              height="100%"
              className="w-full h-full"
              centerLocation={placeData.location}
              zoom={12}
            />
          </div>
        )}

        {/* When map is hidden, show full-width POI grid */}
        {!isMapVisible && (
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
            <div className="max-w-7xl mx-auto">
              {/* Place Information Card */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">
                      {placeData.placeName}
                    </h1>
                    <div className="flex items-center text-slate-600 mb-4">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {uniquePois.length} nearby attractions and places to visit
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={handleSavePlace}
                    variant="outline"
                    className="ml-4"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Save Place
                  </Button>
                </div>
              </div>

              {/* POI Grid */}
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