import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Map as MapIcon,
  Calendar,
  List,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { POI } from "@/types/api";
import type { Poi } from "@/types/schema";
import PoiCard from "@/components/poi-card";
import { InteractiveMap } from "@/components/interactive-map";
import { useTripPlaces } from "@/hooks/use-trip-places";
import CategoryFilter from "@/components/category-filter";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
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
    const stateIndex = addressParts.findIndex((part) =>
      statePattern.test(part)
    );

    if (stateIndex > 0) {
      const cityPart = addressParts[stateIndex - 1];
      const cityMatch = cityPart.match(/([A-Za-z\s]+)/);
      if (cityMatch) {
        const city = cityMatch[1].trim().toLowerCase();
        if (
          !city.match(
            /\b(street|road|avenue|drive|boulevard|lane|way|place|court|circle)\b/i
          )
        ) {
          return city;
        }
      }
    }

    // Common cities fallback
    const commonCities = [
      "austin", "dallas", "houston", "san antonio", "fort worth", "el paso",
      "arlington", "corpus christi", "plano", "lubbock", "irving", "garland",
      "amarillo", "grand prairie", "brownsville", "pasadena", "mesquite",
      "mckinney", "carrollton", "beaumont", "abilene", "round rock",
      "richardson", "midland", "lewisville", "college station", "pearland",
      "denton", "sugar land"
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
  backUrl = "/"
}: PlacesViewProps) {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  
  // POI scheduling state
  const [scheduledTimes, setScheduledTimes] = useState<Map<number, string>>(new Map());

  const handleTimeChange = (poiId: number, newTime: string) => {
    setScheduledTimes(prev => {
      const updated = new Map(prev);
      updated.set(poiId, newTime);
      return updated;
    });
  };

  // Mobile detection and map visibility state
  const [isMobile, setIsMobile] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);

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
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [showRouting]);

  const [sidebarSizePercent, setSidebarSizePercent] = useState(30);
  const { tripPlaces } = useTripPlaces();

  // Filter and dedupe POIs
  const uniquePois = pois.filter(
    (poi, index, self) => {
      if (!poi || typeof poi !== 'object') {
        return false;
      }
      return index === self.findIndex((p) => p?.placeId === poi?.placeId);
    }
  );

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

  // Grid layout calculation (restored original)
  const getGridColumns = () => {
    // Force single column for explore mode
    if (!showRouting) return 1;

    // Keep existing dynamic logic for route mode
    const estimatedWidth = (window.innerWidth * sidebarSizePercent) / 100;
    if (estimatedWidth < 400) return 1;
    if (estimatedWidth < 600) return 2;
    if (estimatedWidth < 800) return 3;
    return 4;
  };

  const gridColumns = getGridColumns();
  const isGridLayout = gridColumns > 1;

  const handlePanelResize = (size: number) => {
    setSidebarSizePercent(size);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      if (window.google && window.google.maps) {
        window.dispatchEvent(new CustomEvent('mapResize'));
      }
    }, 100);
  };

  // Compute display values
  const displayHeaderTitle = headerTitle || (showRouting
    ? `${startLocation} → ${endLocation}`
    : `Exploring ${startLocation}`
  );

  const displaySidebarTitle = sidebarTitle || (showRouting
    ? "Places Along Route"
    : "Places to Explore"
  );

  // Debug logging
  console.log('PlacesView render:', { 
    isMapVisible, 
    showRouting, 
    isMobile,
    poisCount: uniquePois.length
  });

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <Button
              variant="ghost"
              onClick={() => setLocation(backUrl)}
              className="flex items-center text-slate-600 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-sm text-slate-600 hidden sm:block">
                {displayHeaderTitle} • {uniquePois.length} places
              </div>
              <div className="text-xs text-slate-600 sm:hidden">
                {uniquePois.length} places
              </div>
              
              {/* Mobile-optimized toggle button */}
              <button
                onClick={() => {
                  console.log('Toggle map clicked:', { before: isMapVisible, after: !isMapVisible });
                  setIsMapVisible(!isMapVisible);
                }}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all touch-manipulation
                  ${isMobile ? 'min-w-[44px] min-h-[44px]' : 'px-3 py-1.5'} 
                  ${isMapVisible 
                    ? 'bg-slate-600 hover:bg-slate-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
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
        console.log('Rendering decision:', { isMapVisible, showingPanel: isMapVisible, showingGrid: !isMapVisible });
        return null;
      })()}
      {isMobile ? (
        // Mobile: Simple conditional rendering - either map OR POI list
        isMapVisible ? (
          // Mobile map view (full screen)
          <div className="flex-1">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Loading map and places...</p>
                </div>
              </div>
            ) : (
              <InteractiveMap
                startCity={startLocation}
                endCity={endLocation || ''}
                checkpoints={showRouting ? [] : undefined}
                pois={uniquePois}
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
            <div className="bg-white border-b border-slate-200 flex-shrink-0">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>
            
            {/* POI Grid with Mobile Optimization */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                  {/* Loading State */}
                  {isLoading && (
                    <div className="p-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-600">Loading places...</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoading && filteredPois.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-3">🗺️</div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        No places found
                      </h3>
                      <p className="text-sm text-slate-600">
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
                            poi={{...poi, scheduledTime: scheduledTimes.get(poi.id)}} 
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
              <div className="p-3 border-t border-slate-200 bg-white flex-shrink-0">
                <Button
                  onClick={() => setLocation('/itinerary')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white min-h-[48px] touch-manipulation"
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
            style={{ backgroundColor: 'var(--card)' }}
            onResize={handlePanelResize}
          >
            <div className="flex flex-col h-full">
            {/* Category Filter */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            
            {/* Sidebar Header */}
            <div 
              className="p-3 border-b" 
              style={{ 
                borderColor: 'var(--border)', 
                backgroundColor: 'var(--surface-alt)' 
              }}
            >
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                {displaySidebarTitle}
              </h2>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setSelectedCity("all")}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
                  style={selectedCity === "all" 
                    ? { 
                        backgroundColor: 'var(--primary)', 
                        color: 'var(--primary-foreground)' 
                      }
                    : { 
                        backgroundColor: 'var(--muted)',
                        color: 'var(--text-muted)'
                      }
                  }
                  onMouseEnter={(e) => {
                    if (selectedCity !== "all") {
                      e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                      e.currentTarget.style.color = 'var(--primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCity !== "all") {
                      e.currentTarget.style.backgroundColor = 'var(--muted)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  All ({uniquePois.length})
                </button>
              </div>
            </div>

            {/* POI List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="p-4 text-center">
                  <Loader2 
                    className="h-6 w-6 animate-spin mx-auto mb-2" 
                    style={{ color: 'var(--primary)' }}
                  />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Loading places...
                  </p>
                </div>
              )}

              {!isLoading && uniquePois.length === 0 && (
                <div className="p-4 text-center">
                  <div className="text-2xl mb-2">🗺️</div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
                    No places found
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Try a different {showRouting ? 'route' : 'location'}.
                  </p>
                </div>
              )}

              {uniquePois.length > 0 && (
                <div
                  className={`p-2 ${isGridLayout ? 'grid gap-3' : 'space-y-2'}`}
                  style={isGridLayout ? { gridTemplateColumns: `repeat(${gridColumns}, 1fr)` } : {}}
                >
                  {filteredPois.map((poi, index) => (
                    <div
                      key={poi.placeId || poi.id || `poi-${index}`}
                      onMouseEnter={() => onPoiHover(poi)}
                      onMouseLeave={() => onPoiHover(null)}
                      className="transition-all"
                    >
                      <PoiCard 
                        poi={{...poi, scheduledTime: scheduledTimes.get(poi.id)}} 
                        variant={isGridLayout ? "grid" : "compact"}
                        showTimeScheduler={true}
                        onTimeChange={handleTimeChange}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Itinerary Button */}
            {tripPlaces.length > 0 && (
              <div 
                className="p-3 border-t" 
                style={{ 
                  borderColor: 'var(--border)', 
                  backgroundColor: 'var(--surface-alt)' 
                }}
              >
                <Button
                  onClick={() => setLocation('/itinerary')}
                  className="w-full transition-all"
                  size="sm"
                  style={{ 
                    backgroundColor: 'var(--primary)', 
                    color: 'var(--primary-foreground)' 
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Start Itinerary ({tripPlaces.length} places)
                </Button>
              </div>
            )}
            </div>
          </ResizablePanel>

          <ResizableHandle 
            withHandle 
            className="transition-colors" 
            style={{ backgroundColor: 'var(--border)' }}
          />

          {/* Map Panel */}
          <ResizablePanel defaultSize={70}>
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Loading map and places...</p>
                </div>
              </div>
            ) : (
              <InteractiveMap
                startCity={startLocation}
                endCity={endLocation || ''}
                checkpoints={showRouting ? [] : undefined}
                pois={uniquePois}
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