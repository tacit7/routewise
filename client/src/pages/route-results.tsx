import { useLocation } from "wouter";
import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  MapPin,
  Flag,
  Loader2,
  Map as MapIcon,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Poi } from "@shared/schema";
import PoiCard from "@/components/poi-card";
import ItineraryComponent from "@/components/itinerary-component-enhanced";
import { InteractiveMap } from "@/components/interactive-map";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

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

  // Fetch Google Maps API key
  const { data: mapsApiData, isLoading: mapsApiLoading } = useQuery<{
    apiKey: string;
  }>({
    queryKey: ["/api/maps-key"],
    // The default queryFn from queryClient will be used
    staleTime: 1000 * 60 * 30, // 30 minutes - API key doesn't change often
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Fetch POIs for things to do along the specific route
  const { data: pois, isLoading: poisLoading } = useQuery<Poi[]>({
    queryKey: ["/api/pois", routeData?.startCity, routeData?.endCity],
    queryFn: async () => {
      if (!routeData) return [];
      const params = new URLSearchParams({
        start: routeData.startCity,
        end: routeData.endCity,
      });
      const response = await fetch(`/api/pois?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch places along route");
      }
      return response.json();
    },
    enabled: !!routeData, // Only run query when we have route data
  });

  // Remove duplicates based on placeId
  const uniquePois = (pois || []).filter(
    (poi, index, self) =>
      index === self.findIndex((p) => p.placeId === poi.placeId)
  );

  // Generate available cities from actual POI data instead of hardcoded route cities
  const availableCities = useMemo(() => {
    const citySet = new Set<string>();

    // Add route cities
    if (routeData) {
      citySet.add(routeData.startCity.toLowerCase());
      citySet.add(routeData.endCity.toLowerCase());
    }

    // Debug: log some POI data to understand the structure
    if (uniquePois.length > 0) {
      console.log(
        "Sample POI data:",
        uniquePois.slice(0, 3).map((poi) => ({
          name: poi.name,
          address: poi.address,
          timeFromStart: poi.timeFromStart,
          extractedCity: extractCityFromPoi(poi),
        }))
      );
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

    console.log("Available cities:", cities);
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

  // Prepare Google Maps URLs
  const googleMapsDirectUrl = `https://www.google.com/maps/dir/${encodeURIComponent(
    routeData.startCity
  )}/${encodeURIComponent(routeData.endCity)}`;

  const googleMapsEmbedUrl = `https://www.google.com/maps/embed/v1/directions?key=${
    mapsApiData?.apiKey || ""
  }&origin=${encodeURIComponent(
    routeData.startCity
  )}&destination=${encodeURIComponent(routeData.endCity)}&mode=driving`;

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="flex items-center text-slate-600 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex h-screen -mt-8 relative">
            {/* Left Sidebar - Filters and POI List */}
            <div className="w-96 bg-white shadow-xl z-10 flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                  Trip Details
                </h2>
                <div className="flex items-center text-sm text-slate-600 mb-4">
                  <MapPin className="h-4 w-4 mr-2 text-green-600" />
                  <span className="font-medium">{routeData.startCity}</span>
                  <ArrowLeft className="h-4 w-4 mx-2 rotate-180 text-slate-400" />
                  <Flag className="h-4 w-4 mr-2 text-red-600" />
                  <span className="font-medium">{routeData.endCity}</span>
                </div>
                <div className="text-sm text-slate-500">
                  {uniquePois.length} places found
                </div>
              </div>

              {/* City Filters */}
              {availableCities.length > 0 && (
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    Filter by City
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCity("all")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedCity === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      All ({uniquePois.length})
                    </button>
                    {availableCities.slice(0, 4).map((city) => {
                      const cityCount = uniquePois.filter((poi) => {
                        const poiCity = extractCityFromPoi(poi);
                        return (
                          poiCity === city.toLowerCase() ||
                          (routeData?.startCity.toLowerCase() ===
                            city.toLowerCase() &&
                            !poiCity) ||
                          (routeData?.endCity.toLowerCase() ===
                            city.toLowerCase() &&
                            !poiCity)
                        );
                      }).length;

                      return (
                        <button
                          key={city}
                          onClick={() => setSelectedCity(city)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedCity === city
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {city} ({cityCount})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* POI List - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                {poisLoading && (
                  <div className="p-6 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">Loading places...</p>
                  </div>
                )}

                {!poisLoading && uniquePois.length === 0 && (
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-3">🗺️</div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                      No places found
                    </h3>
                    <p className="text-sm text-slate-600">
                      Try a different route or check back later.
                    </p>
                  </div>
                )}

                {uniquePois.length > 0 && (
                  <div className="p-3 space-y-3">
                    {filteredPois.map((poi, index) => (
                      <div
                        key={poi.placeId || poi.id || `poi-${index}`}
                        onMouseEnter={() => handlePoiHover(poi)}
                        onMouseLeave={() => handlePoiHover(null)}
                        className="transition-transform hover:scale-[1.02] cursor-pointer"
                      >
                        <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-3">
                          <div className="flex gap-3">
                            <img
                              src={poi.imageUrl}
                              alt={poi.name}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-800 truncate text-sm">
                                {poi.name}
                              </h4>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                                {poi.description}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center text-xs text-slate-500">
                                  <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                  {poi.rating}
                                </div>
                                <span className="text-xs text-slate-500">
                                  {poi.timeFromStart}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Map Area */}
            <div className="flex-1 relative">
              <InteractiveMap
                startCity={routeData.startCity}
                endCity={routeData.endCity}
                checkpoints={[]}
                pois={uniquePois}
                selectedPoiIds={selectedPoiIds}
                hoveredPoi={hoveredPoi}
                onPoiClick={handlePoiClick}
                onPoiSelect={handlePoiSelect}
                height="100vh"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Hidden section for non-map view */}
          {!isMapVisible && (
            <div className="space-y-6">
              {/* Route Info Header */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">Main Route</h1>
                      <div className="flex items-center text-blue-100">
                        <MapPin className="h-5 w-5 mr-2" />
                        <span className="text-lg">{routeData.startCity}</span>
                        <ArrowLeft className="h-5 w-5 mx-3 rotate-180" />
                        <Flag className="h-5 w-5 mr-2" />
                        <span className="text-lg">{routeData.endCity}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsMapVisible(!isMapVisible)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-md hover:shadow-lg font-medium"
                      >
                        <MapIcon className="h-4 w-4" />
                        {isMapVisible ? "Hide Map" : "Show Map"}
                      </button>
                      <div className="text-right">
                        <div className="text-sm text-blue-100">
                          Total Places Found
                        </div>
                        <div className="text-3xl font-bold">
                          {uniquePois.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wizard Preferences Display */}
              {routeData.fromWizard && routeData.wizardPreferences && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                    Your Trip Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">
                        Trip Type:
                      </span>
                      <span className="ml-2 text-slate-600 capitalize">
                        {routeData.wizardPreferences.tripType?.replace(
                          "-",
                          " "
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">
                        Transportation:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {routeData.wizardPreferences.transportation?.join(", ")}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">
                        Budget:
                      </span>
                      <span className="ml-2 text-slate-600">
                        ${routeData.wizardPreferences.budgetRange?.min} - $
                        {routeData.wizardPreferences.budgetRange?.max}
                      </span>
                    </div>
                    {routeData.wizardPreferences.intentions?.length > 0 && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <span className="font-medium text-slate-700">
                          Interests:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {routeData.wizardPreferences.intentions.map(
                            (intention: string) => (
                              <span
                                key={intention}
                                className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                              >
                                {intention}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* POIs Display */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                  Amazing Places Along Your Route
                </h2>

                {poisLoading && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <p className="text-lg font-medium text-slate-700">
                        Discovering amazing places...
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        This may take a few moments
                      </p>
                    </div>
                    <div className="grid gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="h-48 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!poisLoading && uniquePois.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">
                      No Places Found
                    </h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      We couldn't find any places along this route. Try a
                      different route or check back later as we add more
                      locations.
                    </p>
                  </div>
                )}

                {uniquePois.length > 0 && (
                  <>
                    {/* City Filters */}
                    {availableCities.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-slate-700 mb-3 text-center">
                          Filter by City:
                        </h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button
                            onClick={() => setSelectedCity("all")}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              selectedCity === "all"
                                ? "bg-green-600 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            All Cities ({uniquePois.length})
                          </button>
                          {availableCities.map((city) => {
                            const cityCount = uniquePois.filter((poi) => {
                              const poiCity = extractCityFromPoi(poi);
                              return (
                                poiCity === city.toLowerCase() ||
                                (routeData?.startCity.toLowerCase() ===
                                  city.toLowerCase() &&
                                  !poiCity) ||
                                (routeData?.endCity.toLowerCase() ===
                                  city.toLowerCase() &&
                                  !poiCity)
                              );
                            }).length;

                            return (
                              <button
                                key={city}
                                onClick={() => setSelectedCity(city)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                  selectedCity === city
                                    ? "bg-green-600 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {city} ({cityCount})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Places Cards */}
                    <div
                      className={`${
                        isMapVisible
                          ? "space-y-6"
                          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      }`}
                    >
                      {filteredPois.map((poi, index) => (
                        <div
                          key={poi.placeId || poi.id || `poi-${index}`}
                          onMouseEnter={() => handlePoiHover(poi)}
                          onMouseLeave={() => handlePoiHover(null)}
                          className="transition-transform hover:scale-[1.02]"
                        >
                          <PoiCard
                            poi={poi}
                            variant={isMapVisible ? "default" : "grid"}
                            showRelevanceScore={true}
                          />
                        </div>
                      ))}
                    </div>

                    {filteredPois.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-slate-600">
                          No places found with the selected filters. Try
                          adjusting your city or category selection.
                        </p>
                      </div>
                    )}

                    {/* Summary Stats */}
                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700">
                          {
                            uniquePois.filter(
                              (p) => p.category === "restaurant"
                            ).length
                          }
                        </div>
                        <div className="text-sm text-blue-700 font-medium">
                          Restaurants
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {
                            uniquePois.filter(
                              (p) => p.category === "attraction"
                            ).length
                          }
                        </div>
                        <div className="text-sm text-green-700 font-medium">
                          Attractions
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-700">
                          {
                            uniquePois.filter((p) => p.category === "park")
                              .length
                          }
                        </div>
                        <div className="text-sm text-purple-700 font-medium">
                          Parks & Nature
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-amber-700">
                          {
                            uniquePois.filter(
                              (p) => parseFloat(p.rating) >= 4.5
                            ).length
                          }
                        </div>
                        <div className="text-sm text-amber-700 font-medium">
                          Highly Rated
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
