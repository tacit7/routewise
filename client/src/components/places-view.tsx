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
import Header from "@/components/header";

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
  const [showTripOnly, setShowTripOnly] = useState<boolean>(false);

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
  const { tripPlaces, addToTrip, removeFromTrip, isInTrip, isAddingToTrip, isRemovingFromTrip } = useTripPlaces();

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

    const tripMatch = showTripOnly ? isInTrip(poi) : true;

    return categoryMatch && cityMatch && tripMatch;
  });

  // Always use vertical card layout - force 100% width
  const cardFlexBasis = '100%';
  const isFlexLayout = false;

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
      {/* Screen reader announcements for filter changes */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        Showing {filteredPois.length} places
        {selectedCategory !== "all" && ` filtered by ${selectedCategory}`}
        {showTripOnly && ` from your trip`}
      </div>
      
      <Header
        leftContent={
          <Button
            variant="ghost"
            onClick={() => setLocation(backUrl)}
            className="flex items-center text-muted-foreground hover:text-primary focus-ring"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        }
        centerContent={
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">
              {displayHeaderTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {uniquePois.length} places found
            </p>
          </div>
        }
        rightContent={
          <button
            onClick={() => {
              console.log("Toggle map clicked:", { before: isMapVisible, after: !isMapVisible });
              setIsMapVisible(!isMapVisible);
            }}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all touch-manipulation focus-ring
              ${isMobile ? "min-w-[44px] min-h-[44px]" : "px-3 py-1.5"}
              ${
                isMapVisible
                  ? "bg-muted hover:bg-muted/80 text-muted-foreground"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }
            `}
            aria-label={isMapVisible ? "Hide map and show places list view" : "Show map view"}
            aria-pressed={isMapVisible}
            role="button"
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
        }
      />

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
          <main className="flex-1 flex flex-col" role="main" aria-label="Places list view">
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
                  aria-label={`Start planning itinerary with ${tripPlaces.length} places`}
                >
                  <Calendar className="h-5 w-5 mr-2" aria-hidden="true" />
                  Start Itinerary ({tripPlaces.length} places)
                </Button>
              </div>
            )}
          </main>
        )
      ) : (
        // Desktop: Original ResizablePanelGroup layout
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Sidebar */}
          <ResizablePanel
            defaultSize={30}
            minSize={20}
            maxSize={50}
            className="bg-surface shadow-lg border-r-2 border-primary/20"
            onResize={handlePanelResize}
          >
            <aside className="flex flex-col h-full" role="complementary" aria-label="Places filter and list">
              {/* Category Filter */}
              <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

              {/* Sidebar Header */}
              <div className="p-3 border-b border-border bg-muted">
                <h2 className="text-lg font-semibold text-foreground" id="places-sidebar-heading">
                  {displaySidebarTitle}
                </h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCity("all")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer focus-ring ${
                      selectedCity === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                    aria-label={`Show all places. ${uniquePois.length} places total. ${selectedCity === "all" ? "Currently selected" : "Click to select"}`}
                    aria-pressed={selectedCity === "all"}
                    role="button"
                  >
                    All ({uniquePois.length})
                  </button>
                  {tripPlaces.length > 0 && (
                    <button
                      onClick={() => setShowTripOnly(!showTripOnly)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer focus-ring ${
                        showTripOnly
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      }`}
                      aria-label={`Show only places in trip. ${tripPlaces.length} places in your trip. ${showTripOnly ? "Currently showing trip places only" : "Click to filter to trip places only"}`}
                      aria-pressed={showTripOnly}
                      role="button"
                    >
                      Trip Only ({tripPlaces.length})
                    </button>
                  )}
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
                        // Vertical card layout - image on top
                        <div
                          key={poi.placeId || poi.id || `poi-list-${index}`}
                          onMouseEnter={() => onPoiHover(poi)}
                          onMouseLeave={() => onPoiHover(null)}
                          className="rounded-md border border-border bg-card hover:shadow-sm transition-all cursor-pointer p-3"
                        >
                          {/* Image on top */}
                          <div className="relative">
                            <img
                              src={poi.imageUrl || '/placeholder-poi.jpg'}
                              alt={poi.name}
                              className="w-full h-32 object-cover rounded"
                            />
                            {/* Category badge on image */}
                            <div className="absolute top-2 left-2">
                              <div className="text-xs px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                                {poi.category.charAt(0).toUpperCase() + poi.category.slice(1).replace('_', ' ')}
                              </div>
                            </div>
                          </div>

                          {/* Content below image */}
                          <div className="mt-3">
                            {/* Name */}
                            <h4 className="font-medium text-base line-clamp-2">
                              {poi.name}
                            </h4>

                            {/* Description (now with smart backend-generated content) */}
                            {poi.description && poi.description !== "Point of interest" && (
                              <p className="text-muted-foreground text-sm mt-2 line-clamp-1">
                                {poi.description}
                              </p>
                            )}

                            {/* Rating */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-warning text-base">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="font-medium">{poi.rating}</span>
                                {poi.timeFromStart && (
                                  <span className="text-muted-foreground text-xs ml-2">{poi.timeFromStart}</span>
                                )}
                              </div>

                              {/* Add/Remove Trip button */}
                              <button
                                onClick={() => {
                                  if (isInTrip(poi)) {
                                    removeFromTrip(poi.id);
                                  } else {
                                    addToTrip(poi);
                                  }
                                }}
                                disabled={isAddingToTrip || isRemovingFromTrip}
                                className={`text-xs px-3 py-1 rounded transition-colors focus-ring ${
                                  isInTrip(poi)
                                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    : isAddingToTrip || isRemovingFromTrip
                                    ? "bg-primary/60 text-primary-foreground cursor-not-allowed"
                                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                }`}
                                aria-label={
                                  isInTrip(poi) 
                                    ? `Remove ${poi.name} from trip` 
                                    : isAddingToTrip || isRemovingFromTrip
                                    ? "Processing request..."
                                    : `Add ${poi.name} to trip`
                                }
                                aria-describedby={`poi-${poi.id}-status`}
                              >
                                {isInTrip(poi) ? (
                                  <div className="flex items-center gap-1">
                                    <Check className="h-3 w-3" aria-hidden="true" />
                                    Remove
                                  </div>
                                ) : isAddingToTrip || isRemovingFromTrip ? "..." : "+ Trip"}
                              </button>
                              {/* Hidden status text for screen readers */}
                              <span id={`poi-${poi.id}-status`} className="sr-only">
                                {isInTrip(poi) ? "This place is in your trip" : "This place is not in your trip"}
                              </span>
                            </div>
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
            </aside>
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
