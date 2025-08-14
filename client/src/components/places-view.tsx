import React, { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Loader2, Map as MapIcon, Calendar, Eye, EyeOff, MapPin, Star, Check, Search } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDevLog } from "@/components/developer-fab";

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
  const devLog = useDevLog();

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
    
    // Track last added POI for debug tools
    localStorage.setItem('lastPoiAction', `clicked: ${poi.name}`);
    const lastAddedEl = document.getElementById('last-added-poi');
    if (lastAddedEl) {
      lastAddedEl.textContent = poi.name;
    }
  };

  // Enhanced POI hover handler that tracks hover state
  const handleEnhancedPoiHover = (poi: POI | Poi | null) => {
    onPoiHover(poi);
    
    // Expose hover state to debug tools
    (window as any).__routewise_hovered_poi = poi;
    const hoveredEl = document.getElementById('hovered-poi-name');
    if (hoveredEl) {
      hoveredEl.textContent = poi ? poi.name : 'None';
    }
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

  // Enhanced trip management with debug tracking
  const handleAddToTrip = async (poi: POI | Poi) => {
    await addToTrip(poi);
    
    // Track for debug tools
    localStorage.setItem('lastPoiAction', `added: ${poi.name}`);
    const lastAddedEl = document.getElementById('last-added-poi');
    if (lastAddedEl) {
      lastAddedEl.textContent = poi.name;
    }
    
    // Update count
    const countEl = document.getElementById('selected-pois-count');
    if (countEl) {
      const newCount = JSON.parse(localStorage.getItem('tripPlaces') || '[]').length;
      countEl.textContent = newCount.toString();
    }
  };

  const handleRemoveFromTrip = async (poiId: number) => {
    const poi = pois.find(p => p.id === poiId);
    await removeFromTrip(poiId);
    
    // Track for debug tools
    if (poi) {
      localStorage.setItem('lastPoiAction', `removed: ${poi.name}`);
      const lastAddedEl = document.getElementById('last-added-poi');
      if (lastAddedEl) {
        lastAddedEl.textContent = `Removed: ${poi.name}`;
      }
    }
    
    // Update count
    const countEl = document.getElementById('selected-pois-count');
    if (countEl) {
      const newCount = JSON.parse(localStorage.getItem('tripPlaces') || '[]').length;
      countEl.textContent = newCount.toString();
    }
  };

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

  // Dynamic grid calculation based on panel width
  const calculateGridColumns = () => {
    const panelWidth = (window.innerWidth * (sidebarSizePercent / 100)) - 40; // Account for padding
    
    if (panelWidth < 300) return 1;      // Narrow: 1 column
    if (panelWidth < 500) return 2;      // Medium: 2 columns  
    if (panelWidth < 700) return 3;      // Wide: 3 columns
    return Math.min(4, Math.floor(panelWidth / 200)); // Very wide: 4+ columns, but cap at reasonable size
  };
  
  const gridColumns = calculateGridColumns();
  const isMultiColumn = gridColumns > 1;


  const handlePanelResize = (size: number) => {
    devLog('PlacesView', 'Panel Resized', { 
      newSize: size, 
      windowWidth: window.innerWidth,
      calculatedWidth: (window.innerWidth * (size / 100)) - 40,
      gridColumns
    });
    
    setSidebarSizePercent(size);
    // Force re-render of grid layout
    setPanelKey(prev => prev + 1);

    // Enhanced map resize with debouncing
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      if (window.google && window.google.maps) {
        window.dispatchEvent(new CustomEvent("mapResize"));
      }
    }, 150);
  };


  // Compute display values
  const displayHeaderTitle =
    headerTitle || (showRouting ? `${startLocation} → ${endLocation}` : `Exploring ${startLocation}`);

  const displaySidebarTitle = sidebarTitle || (showRouting ? "Places Along Route" : "Places to Explore");


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
      

      {/* Main Content */}
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
                onPoiHover={onPoiHover}
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
                          onMouseEnter={() => handleEnhancedPoiHover(poi)}
                          onMouseLeave={() => handleEnhancedPoiHover(null)}
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

          </main>
        )
      ) : (
        // Desktop: Enhanced ResizablePanelGroup with smooth dragging
        <ResizablePanelGroup 
          direction="horizontal" 
          className="flex-1"
        >
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
                {/* Map View Header */}
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapIcon className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Map View</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Explore locations on the map and see your itinerary geographically
                  </p>
                </div>

                {/* View Toggle Buttons */}
                <div className="flex mb-3 bg-white rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex-1 ${selectedCity === "all" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                    onClick={() => setSelectedCity("all")}
                  >
                    All Locations
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex-1 ${showTripOnly ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                    onClick={() => setShowTripOnly(!showTripOnly)}
                  >
                    My Itinerary
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-foreground" id="places-sidebar-heading">
                    {sidebarTitle || "Search & Filter"}
                  </h3>
                  {tripPlaces.length > 0 && (
                    <Button
                      onClick={() => setLocation("/itinerary")}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 text-xs"
                    >
                      Start Planning
                    </Button>
                  )}
                </div>

                {/* Search Input */}
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search locations..."
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Category Dropdown */}
                <div className="mb-3">
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>All Categories</option>
                    <option>Landmarks</option>
                    <option>Museums</option>
                    <option>Restaurants</option>
                    <option>Parks</option>
                    <option>Shopping</option>
                    <option>Religious Sites</option>
                  </select>
                </div>

                {/* Locations Found */}
                <p className="text-sm text-muted-foreground mb-3">
                  {filteredPois.length} locations found
                </p>
              </div>

              {/* Points of Interest */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="h-5 w-5 text-foreground" />
                  <h3 className="text-base font-semibold text-foreground">Points of Interest</h3>
                </div>

                {isLoading && (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Loading places...</p>
                  </div>
                )}

                {!isLoading && filteredPois.length === 0 && (
                  <div className="text-center py-8">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h4 className="text-sm font-semibold mb-1 text-foreground">No places found</h4>
                    <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                  </div>
                )}

                {/* POI List Items */}
                <div className="space-y-3">
                  {filteredPois.slice(0, 4).map((poi) => {
                    const isInItinerary = isInTrip(poi);
                    return (
                      <div key={poi.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-foreground truncate">{poi.name}</h4>
                            {isInItinerary && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                In Trip
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">{poi.category}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-muted-foreground">
                              {poi.rating || "4.5"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className={`w-3 h-3 rounded-full ${isInItinerary ? 'bg-blue-500' : 'bg-red-500'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Trip Overview */}
                <div className="mt-6 pt-4 border-t border-border">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Trip Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Locations:</span>
                        <span className="font-medium">{tripPlaces.length || 3}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trip Duration:</span>
                        <span className="font-medium">7 days</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

            </aside>
          </ResizablePanel>

          <ResizableHandle 
            withHandle 
            className="transition-all duration-200 bg-border hover:bg-primary/20 active:bg-primary/30 w-2 group relative" 
          />

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
                onPoiHover={onPoiHover}
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
