import React, { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Loader2, Map as MapIcon, Calendar, List, Eye, EyeOff, MapPin, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { POI } from "@/types/api";
import type { Poi } from "@/types/schema";
import PoiCard from "@/components/poi-card";
import { InteractiveMap } from "@/components/interactive-map";
import { useTripPlaces } from "@/hooks/use-trip-places";
import CategoryFilter from "@/components/category-filter";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Badge } from "@/components/ui/badge";

interface PlacesViewProps {
  // Core data
  startLocation: string;
  endLocation?: string;
  pois: (POI | Poi)[];
  isLoading: boolean;

  // Map configuration
  showRouting?: boolean; // true for route mode, false for explore mode
  apiKey?: string;

  // Event handlers
  onPoiClick: (poi: POI | Poi) => void;
  onPoiSelect: (poiId: number, selected: boolean) => void;
  onPoiHover: (poi: POI | Poi | null) => void;

  // State that parent manages
  selectedPoiIds: number[];
  hoveredPoi: POI | Poi | null;

  // Customization
  headerTitle?: string;
  sidebarTitle?: string;
  backUrl?: string;
}

// Helper function to extract city from POI data
const extractCityFromPoi = (poi: POI | Poi): string | null => {
  if (poi.address && poi.address !== "Address not available") {
    const addressParts = poi.address.split(",").map((part) => part.trim());
    const statePattern = /\b[A-Z]{2}\b/;
    const stateIndex = addressParts.findIndex((part) => statePattern.test(part));

    if (stateIndex > 0) {
      const cityPart = addressParts[stateIndex - 1];
      const cityMatch = cityPart.match(/([A-Za-z\s]+)/);
      if (cityMatch) {
        const city = cityMatch[1].trim().toLowerCase();
        if (!city.match(/\b(street|road|avenue|drive|boulevard|lane|way|place|court|circle)\b/i)) {
          return city;
        }
      }
    }

    // Common cities fallback
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

export default function PlacesView({
  startLocation,
  endLocation,
  pois,
  isLoading,
  showRouting = true,
  apiKey,
  onPoiClick,
  onPoiSelect,
  onPoiHover,
  selectedPoiIds,
  hoveredPoi,
  headerTitle,
  sidebarTitle,
  backUrl = "/",
}: PlacesViewProps) {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);

  // POI scheduling state
  const [scheduledTimes, setScheduledTimes] = useState<Map<number, string>>(new Map());

  const handleTimeChange = (poiId: number, newTime: string) => {
    setScheduledTimes((prev) => {
      const updated = new Map(prev);
      updated.set(poiId, newTime);
      return updated;
    });
  };

  // Mobile detection and map visibility state
  const [isMobile, setIsMobile] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Info window close handler
  const handleInfoWindowClose = () => {
    setSelectedPoiId(null);
  };

  // Enhanced POI click handler that sets selected POI for info window
  const handleEnhancedPoiClick = (poi: POI | Poi) => {
    setSelectedPoiId(poi.id);
    onPoiClick(poi);
  };

  // Detect mobile and set mobile-first map visibility
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Mobile-first logic:
      // - Explore mode: POI list first on mobile, map optional on desktop
      // - Route mode: always show map (both mobile and desktop)
      if (showRouting) {
        setIsMapVisible(true); // Always show map for routing
      } else {
        setIsMapVisible(!mobile); // Explore mode: hide on mobile, show on desktop
      }
    };

    // Check immediately
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [showRouting]);

  const [sidebarSizePercent, setSidebarSizePercent] = useState(30);
  const [panelKey, setPanelKey] = useState(0); // Force re-render on panel resize
  const { tripPlaces, addToTrip, isInTrip, isAddingToTrip } = useTripPlaces();

  // Filter and dedupe POIs
  const uniquePois = pois.filter((poi, index, self) => {
    if (!poi || typeof poi !== "object") {
      return false;
    }
    return index === self.findIndex((p) => p?.placeId === poi?.placeId);
  });

  // Generate available cities
  const availableCities = useMemo(() => {
    const citySet = new Set<string>();

    if (startLocation) {
      citySet.add(startLocation.toLowerCase());
    }
    if (endLocation) {
      citySet.add(endLocation.toLowerCase());
    }

    uniquePois.forEach((poi) => {
      const city = extractCityFromPoi(poi);
      if (city) {
        citySet.add(city);
      }
    });

    return Array.from(citySet)
      .map((city) => city.charAt(0).toUpperCase() + city.slice(1))
      .sort();
  }, [uniquePois, startLocation, endLocation]);

  // Filter POIs
  const filteredPois = uniquePois.filter((poi) => {
    const categoryMatch = selectedCategory === "all" || poi.category === selectedCategory;

    let cityMatch = selectedCity === "all";
    if (!cityMatch && selectedCity !== "all") {
      const poiCity = extractCityFromPoi(poi);
      if (poiCity) {
        cityMatch = poiCity === selectedCity.toLowerCase();
      } else {
        cityMatch = true;
      }
    }

    return categoryMatch && cityMatch;
  });

  // Calculate optimal card width based on panel size
  const getCardFlexBasis = () => {
    // Force full width for mobile or explore mode
    if (!showRouting || isMobile) return '100%';

    // Calculate actual sidebar width for desktop
    const containerWidth = (window.innerWidth * (sidebarSizePercent / 100)) - 40;

    // Force single-column list until panel is quite wide
    // Default 30% (~360px equivalent) should show single column
    if (containerWidth < 500) return '100%';      // Single column list (default behavior)
    if (containerWidth < 700) return 'calc(50% - 8px)';  // 2 per row only when wider
    if (containerWidth < 900) return 'calc(33.333% - 8px)'; // 3 per row when very wide
    if (containerWidth < 1100) return 'calc(25% - 8px)';     // 4 per row when extra wide
    return 'calc(20% - 8px)'; // 5 per row for ultrawide panels
  };

  const cardFlexBasis = getCardFlexBasis();
  const isFlexLayout = cardFlexBasis !== '100%';

  // Debug panel sizing
  console.log('Panel Debug:', {
    sidebarSizePercent,
    windowWidth: window.innerWidth,
    calculatedWidth: (window.innerWidth * (sidebarSizePercent / 100)) - 40,
    cardFlexBasis,
    isFlexLayout
  });

  const handlePanelResize = (size: number) => {
    console.log('Panel resized to:', size, '%');
    setSidebarSizePercent(size);
    // Force re-render of grid layout
    setPanelKey(prev => prev + 1);

    // Trigger map resize with debouncing
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      if (window.google && window.google.maps) {
        window.dispatchEvent(new CustomEvent("mapResize"));
      }
    }, 100);
  };

  // Compute display values
  const displayHeaderTitle =
    headerTitle || (showRouting ? `${startLocation} → ${endLocation}` : `Exploring ${startLocation}`);

  const displaySidebarTitle = sidebarTitle || (showRouting ? "Places Along Route" : "Places to Explore");

  // Debug logging
  console.log("PlacesView render:", {
    isMapVisible,
    showRouting,
    isMobile,
    poisCount: uniquePois.length,
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <Button
              variant="ghost"
              onClick={() => setLocation(backUrl)}
              className="flex items-center text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-sm text-muted-foreground hidden sm:block">
                {displayHeaderTitle} • {uniquePois.length} places
              </div>
              <div className="text-xs text-muted-foreground sm:hidden">{uniquePois.length} places</div>

              {/* Mobile-optimized toggle button */}
              <button
                onClick={() => {
                  console.log("Toggle map clicked:", { before: isMapVisible, after: !isMapVisible });
                  setIsMapVisible(!isMapVisible);
                }}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all touch-manipulation
                  ${isMobile ? "min-w-[44px] min-h-[44px]" : "px-3 py-1.5"}
                  ${
                    isMapVisible
                      ? "bg-muted hover:bg-muted/80 text-muted-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }
                `}
                aria-label={isMapVisible ? "Hide map, show POI list" : "Show map"}
              >
                {isMapVisible ? (
                  <>
                    <List className="h-4 w-4" />
                    <span className="text-sm hidden sm:inline">List</span>
                  </>
                ) : (
                  <>
                    <MapIcon className="h-4 w-4" />
                    <span className="text-sm hidden sm:inline">Map</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {(() => {
        console.log("Rendering decision:", { isMapVisible, showingPanel: isMapVisible, showingGrid: !isMapVisible });
        return null;
      })()}
      {isMobile ? (
        // Mobile: Simple conditional rendering - either map OR POI list
        isMapVisible ? (
          // Mobile map view (full screen)
          <div className="flex-1">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading map and places...</p>
                </div>
              </div>
            ) : (
              <InteractiveMap
                startCity={startLocation}
                endCity={endLocation || ""}
                pois={filteredPois}
                selectedPoiIds={selectedPoiIds}
                hoveredPoi={hoveredPoi}
                onPoiClick={onPoiClick}
                onPoiSelect={onPoiSelect}
                height="100%"
                className="w-full h-full"
                apiKey={apiKey}
              />
            )}
          </div>
        ) : (
          // Mobile POI list view (full screen)
          <div className="flex-1 flex flex-col">
            {/* Category Filter for POI-only view */}
            <div className="bg-card border-b border-border flex-shrink-0">
              <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
            </div>

            {/* POI Grid with Mobile Optimization */}
            <div className="flex-1 overflow-y-auto bg-background">
              <div className="p-3 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                  {/* Loading State */}
                  {isLoading && (
                    <div className="p-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Loading places...</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoading && filteredPois.length === 0 && (
                    <div className="p-8 text-center">
                      <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No places found</h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or explore a different location.
                      </p>
                    </div>
                  )}

                  {/* POI Grid - Mobile Optimized */}
                  {!isLoading && filteredPois.length > 0 && (
                    <div className="grid gap-3 grid-cols-1">
                      {filteredPois.map((poi, index) => (
                        <div
                          key={poi.placeId || poi.id || `poi-${index}`}
                          onMouseEnter={() => onPoiHover(poi)}
                          onMouseLeave={() => onPoiHover(null)}
                          className="transition-all"
                        >
                          <PoiCard
                            poi={{ ...poi, scheduledTime: scheduledTimes.get(poi.id) }}
                            variant="compact"
                            showTimeScheduler={true}
                            onTimeChange={handleTimeChange}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Itinerary Button - Fixed at bottom */}
            {tripPlaces.length > 0 && (
              <div className="p-3 border-t border-border bg-surface flex-shrink-0">
                <Button
                  onClick={() => setLocation("/itinerary")}
                  className="w-full bg-primary hover:bg-primary/90 text-white min-h-[48px] touch-manipulation"
                  size="lg"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Start Itinerary ({tripPlaces.length} places)
                </Button>
              </div>
            )}
          </div>
        )
      ) : (
        // Desktop: Original ResizablePanelGroup layout
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Sidebar */}
          <ResizablePanel
            defaultSize={30}
            minSize={20}
            maxSize={50}
            className="bg-card"
            onResize={handlePanelResize}
          >
            <div className="flex flex-col h-full">
              {/* Category Filter */}
              <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

              {/* Sidebar Header */}
              <div
                className="p-3 border-b border-border bg-muted"
              >
                <h2 className="text-lg font-semibold text-foreground">
                  {displaySidebarTitle}
                </h2>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSelectedCity("all")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      selectedCity === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    All ({uniquePois.length})
                  </button>
                </div>
              </div>

              {/* POI List */}
              <div className="flex-1 overflow-y-auto">
                {isLoading && (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs text-muted-foreground">
                      Loading places...
                    </p>
                  </div>
                )}

                {!isLoading && uniquePois.length === 0 && (
                  <div className="p-4 text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="text-sm font-semibold mb-1 text-foreground">
                      No places found
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Try a different {showRouting ? "route" : "location"}.
                    </p>
                  </div>
                )}

                {uniquePois.length > 0 && (
                  <div
                    key={`poi-container-${panelKey}`}
                    className={`p-2 max-w-full overflow-hidden ${isFlexLayout ? "flex flex-wrap gap-2" : "space-y-2"}`}
                  >
                    {filteredPois.map((poi, index) => (
                      cardFlexBasis === '100%' ? (
                        // Single-column list layout using your grid spec
                        <div
                          key={poi.placeId || poi.id || `poi-list-${index}`}
                          onMouseEnter={() => onPoiHover(poi)}
                          onMouseLeave={() => onPoiHover(null)}
                          className="grid grid-cols-[64px_1fr_auto] gap-3 items-center p-2 rounded-md border border-border bg-card hover:shadow-sm transition-all cursor-pointer"
                        >
                          {/* Thumbnail - 64px */}
                          <img
                            src={poi.imageUrl || '/placeholder-poi.jpg'}
                            alt={poi.name}
                            className="h-16 w-16 rounded object-cover"
                          />

                          {/* Main content - 1fr */}
                          <div className="min-w-0">
                            <h4 className="truncate font-medium text-sm">{poi.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{poi.description || poi.address}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-xs text-yellow-500">
                                <Star className="h-3 w-3 fill-current" />
                                {poi.rating}
                              </div>
                              {poi.timeFromStart && (
                                <span className="text-xs text-muted-foreground">{poi.timeFromStart}</span>
                              )}
                            </div>
                          </div>

                          {/* Action/Tag - auto */}
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                              {poi.category}
                            </div>
                            <button
                              onClick={() => {
                                if (!isInTrip(poi)) {
                                  addToTrip(poi);
                                }
                              }}
                              disabled={isInTrip(poi) || isAddingToTrip}
                              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                                isInTrip(poi)
                                  ? "bg-primary/10 text-primary cursor-not-allowed"
                                  : isAddingToTrip
                                  ? "bg-primary/60 text-white cursor-not-allowed"
                                  : "bg-primary hover:bg-primary/90 text-white"
                              }`}
                            >
                              {isInTrip(poi) ? (
                                <div className="flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  In Trip
                                </div>
                              ) : isAddingToTrip ? "Adding..." : "+ Trip"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Multi-column card layout for wider panels
                        <div
                          key={poi.placeId || poi.id || `poi-card-${index}`}
                          onMouseEnter={() => onPoiHover(poi)}
                          onMouseLeave={() => onPoiHover(null)}
                          className="transition-all min-w-[200px] max-w-full"
                          style={{ flexBasis: cardFlexBasis }}
                        >
                          <PoiCard
                            poi={{ ...poi, scheduledTime: scheduledTimes.get(poi.id) }}
                            variant="grid"
                            showTimeScheduler={true}
                            onTimeChange={handleTimeChange}
                          />
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Itinerary Button */}
              {tripPlaces.length > 0 && (
                <div
                  className="p-3 border-t border-border bg-muted"
                >
                  <Button
                    onClick={() => setLocation("/itinerary")}
                    className="w-full transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Start Itinerary ({tripPlaces.length} places)
                  </Button>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="transition-colors bg-border" />

          {/* Map Panel */}
          <ResizablePanel defaultSize={70}>
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading map and places...</p>
                </div>
              </div>
            ) : (
              <InteractiveMap
                startCity={startLocation}
                endCity={endLocation || ""}
                pois={filteredPois}
                selectedPoiIds={selectedPoiIds}
                hoveredPoi={hoveredPoi}
                onPoiClick={onPoiClick}
                onPoiSelect={onPoiSelect}
                height="100%"
                className="w-full h-full"
                apiKey={apiKey}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
