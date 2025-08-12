import React, { useCallback, useState, useEffect, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap, Pin } from "@vis.gl/react-google-maps";
import { Loader2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Poi } from "@/types/schema";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { useDevLog } from "@/components/developer-fab";
import { useClientPOIClustering } from "@/hooks/useClientPOIClustering";

interface InteractiveMapProps {
  startCity: string;
  endCity: string;
  checkpoints?: string[];
  pois?: Poi[];
  selectedPoiIds?: number[];
  hoveredPoi?: Poi | null;
  onPoiClick?: (poi: Poi) => void;
  onPoiSelect?: (poiId: number, selected: boolean) => void;
  onPoiHover?: (poi: Poi | null) => void;
  className?: string;
  height?: string;
  apiKey?: string; // Optional API key to avoid fetching separately
  enableClustering?: boolean; // Enable Phoenix WebSocket clustering
}

// POI category to color mapping - showing variety of colors for preview
const getCategoryColor = (category: string, index?: number): string => {
  // If index provided, cycle through different colors for preview
  if (typeof index === 'number') {
    const previewColors = [
      "#EA4335", // Google Red
      "#34A853", // Google Green  
      "#4285F4", // Google Blue
      "#9C27B0", // Purple
      "#FF9800", // Orange
      "#795548", // Brown
      "#137333", // Dark Green
      "#E91E63", // Pink
      "#FF5722", // Deep Orange
      "#607D8B", // Blue Grey
      "#8BC34A", // Light Green
      "#FFC107", // Amber
      "#673AB7", // Deep Purple
      "#00BCD4", // Cyan
      "#CDDC39"  // Lime
    ];
    return previewColors[index % previewColors.length];
  }
  
  // Original category-based colors
  const colors = {
    restaurant: "#EA4335", // Google Red
    attraction: "#34A853", // Google Green
    park: "#137333", // Darker green for parks
    scenic: "#4285F4", // Google Blue
    shopping: "#9C27B0", // Purple
    market: "#FF9800", // Orange
    historic: "#795548", // Brown
    default: "#4285F4", // Google Blue
  };
  return colors[category as keyof typeof colors] || colors.default;
};


// Helper function to get POI coordinates with fallback support
const getPoiCoordinates = (poi: Poi): { lat: number; lng: number } => {
  // Primary coordinates (lat/lng) are preferred, fallback to alternative format
  const lat = poi.lat ?? poi.latitude ?? 0;
  const lng = poi.lng ?? poi.longitude ?? 0;

  // Validate coordinates are valid numbers (allow negative values, just not exactly 0,0)
  if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) {
    // Return a safe default (center of US) rather than null to prevent crashes
    return { lat: 39.8283, lng: -98.5795 };
  }

  return { lat, lng };
};

// Custom marker component using Google's default Pin
const PoiMarker: React.FC<{
  poi: Poi;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (poi: Poi) => void;
  onMouseEnter?: (poi: Poi) => void;
  onMouseLeave?: () => void;
  index?: number;
}> = ({ poi, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave, index }) => {
  const coords = getPoiCoordinates(poi);
  const color = getCategoryColor(poi.category, index);
  
  return (
    <AdvancedMarker
      position={coords}
      title={poi.name}
      onClick={() => onClick(poi)}
    >
      <div
        onMouseEnter={() => onMouseEnter?.(poi)}
        onMouseLeave={() => onMouseLeave?.()}
        style={{ cursor: 'pointer' }}
      >
        <Pin
          background={color}
          glyphColor="white"
          borderColor="white"
          scale={isSelected || isHovered ? 1.2 : 1.0}
        />
      </div>
    </AdvancedMarker>
  );
};

// Cluster marker component for grouped POIs
const ClusterMarker: React.FC<{
  cluster: {
    id: string;
    lat: number;
    lng: number;
    count: number;
    pois: Poi[];
    category_breakdown?: Record<string, number>;
    avg_rating?: number;
  };
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}> = ({ cluster, isHovered, onClick, onMouseEnter, onMouseLeave }) => {
  const { lat, lng, count } = cluster;
  
  // Determine cluster size for visual scaling
  const getClusterSize = (count: number) => {
    if (count < 5) return { size: 40, scale: 1.0, textSize: 'text-sm' };
    if (count < 10) return { size: 50, scale: 1.1, textSize: 'text-base' };
    if (count < 25) return { size: 60, scale: 1.2, textSize: 'text-lg' };
    return { size: 70, scale: 1.3, textSize: 'text-xl' };
  };

  const { size, scale, textSize } = getClusterSize(count);
  
  return (
    <AdvancedMarker
      position={{ lat, lng }}
      title={`${count} POIs`}
      onClick={onClick}
    >
      <div
        onMouseEnter={() => onMouseEnter?.()}
        onMouseLeave={() => onMouseLeave?.()}
        style={{ 
          cursor: 'pointer',
          transform: isHovered ? `scale(${scale * 1.1})` : `scale(${scale})`,
          transition: 'transform 0.2s ease-in-out'
        }}
      >
        <div 
          className={`rounded-full flex items-center justify-center shadow-lg border-2 border-white ${textSize} font-bold`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: 'var(--primary)',
            color: 'white'
          }}
        >
          {count}
        </div>
        {/* Small indicator showing it's a cluster */}
        <div 
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: 'var(--surface)',
            color: 'var(--primary)',
            border: '1px solid var(--border)'
          }}
        >
          <Users className="w-2.5 h-2.5" />
        </div>
      </div>
    </AdvancedMarker>
  );
};

// Info window component for regular POIs
const PoiInfoWindow: React.FC<{
  poi: Poi;
  onClose: () => void;
  isInTrip: (poi: Poi) => boolean;
  addToTrip: (poi: Poi) => void;
  isAddingToTrip: boolean;
}> = ({ poi, onClose, isInTrip, addToTrip, isAddingToTrip }) => {
  const coords = getPoiCoordinates(poi);
  const [isAdding, setIsAdding] = useState(false);

  const isAddedToTrip = isInTrip(poi);
  
  const handleAddToTrip = async () => {
    if (isAddedToTrip || isAdding || isAddingToTrip) return;
    
    setIsAdding(true);
    try {
      await addToTrip(poi);
      // Close info window after successful addition
      setTimeout(onClose, 1000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <InfoWindow position={coords} onClose={onClose}>
      <div className="p-3 max-w-sm">
        {poi.imageUrl && (
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-full h-32 object-cover rounded mb-2"
          />
        )}
        <h3 className="font-semibold text-base mb-1">{poi.name}</h3>
        <p className="text-xs text-muted-foreground capitalize mb-2">{poi.category}</p>
        {poi.description && (
          <p className="text-sm text-foreground mb-2">{poi.description}</p>
        )}
        <div className="flex items-center text-xs mb-1">
          <span className="text-yellow-500">⭐</span>
          <span className="ml-1 text-muted-foreground">{poi.rating} ({poi.reviewCount || 0} reviews)</span>
        </div>
        {poi.address && (
          <p className="text-xs text-muted-foreground mb-3">{poi.address}</p>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleAddToTrip}
            disabled={isAddedToTrip || isAdding || isAddingToTrip}
            className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              isAddedToTrip
                ? 'bg-primary/10 text-primary border border-primary/20 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md'
            }`}
          >
            {isAddedToTrip 
              ? '✓ In Trip'
              : isAdding || isAddingToTrip
                ? '⏳ Adding...'
                : '+ Add to Trip'
            }
          </Button>
        </div>
      </div>
    </InfoWindow>
  );
};

// Info window component for Google POIs
const GooglePlaceInfoWindow: React.FC<{
  place: any;
  position: { lat: number; lng: number };
  onClose: () => void;
  isInTrip: (poi: Poi) => boolean;
  addToTrip: (poi: Poi) => void;
  isAddingToTrip: boolean;
}> = ({ place, position, onClose, isInTrip, addToTrip, isAddingToTrip }) => {
  const [isAdding, setIsAdding] = useState(false);

  // Convert Google Place to POI format
  const convertToPoi = (googlePlace: any): Poi => {
    return {
      id: Date.now(), // Temporary ID for new POI
      placeId: googlePlace.place_id,
      name: googlePlace.name || 'Unknown Place',
      address: googlePlace.formatted_address || '',
      rating: googlePlace.rating ? googlePlace.rating.toString() : '0',
      category: googlePlace.types?.[0]?.replace(/_/g, ' ') || 'unknown',
      lat: googlePlace.geometry?.location?.lat() || position.lat,
      lng: googlePlace.geometry?.location?.lng() || position.lng,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Additional fields for UI display
      imageUrl: googlePlace.photos?.[0]?.getUrl?.({ maxWidth: 400, maxHeight: 300 }),
      description: googlePlace.types?.slice(0, 3).join(', ').replace(/_/g, ' '),
      reviewCount: googlePlace.user_ratings_total || 0,
    };
  };

  const poi = convertToPoi(place);
  const isAddedToTrip = isInTrip(poi);
  
  const handleAddToTrip = async () => {
    if (isAddedToTrip || isAdding || isAddingToTrip) return;
    
    setIsAdding(true);
    try {
      await addToTrip(poi);
      // Close info window after successful addition
      setTimeout(onClose, 1000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <InfoWindow position={position} onClose={onClose}>
      <div className="p-3 max-w-sm">
        {poi.imageUrl && (
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-full h-32 object-cover rounded mb-2"
          />
        )}
        <h3 className="font-semibold text-base mb-1">{poi.name}</h3>
        <p className="text-xs text-muted-foreground capitalize mb-2">{poi.category}</p>
        {poi.description && (
          <p className="text-sm text-foreground mb-2">{poi.description}</p>
        )}
        <div className="flex items-center text-xs mb-1">
          <span className="text-yellow-500">⭐</span>
          <span className="ml-1 text-muted-foreground">{poi.rating} ({poi.reviewCount || 0} reviews)</span>
        </div>
        {poi.address && (
          <p className="text-xs text-muted-foreground mb-3">{poi.address}</p>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleAddToTrip}
            disabled={isAddedToTrip || isAdding || isAddingToTrip}
            className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              isAddedToTrip
                ? 'bg-primary/10 text-primary border border-primary/20 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md'
            }`}
          >
            {isAddedToTrip 
              ? '✓ In Trip'
              : isAdding || isAddingToTrip
                ? '⏳ Adding...'
                : '+ Add to Trip'
            }
          </Button>
        </div>
      </div>
    </InfoWindow>
  );
};

// Map controls component
const MapControls: React.FC = () => {
  const map = useMap();

  const zoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom() || 8;
      map.setZoom(currentZoom + 1);
    }
  };

  const zoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom() || 8;
      map.setZoom(Math.max(1, currentZoom - 1));
    }
  };

  return (
    <div className="absolute bottom-24 left-4 flex flex-col gap-1 z-20">
      <Button
        size="sm"
        variant="secondary"
        onClick={zoomIn}
        className="w-10 h-10 p-0 flex items-center justify-center shadow-xl"
        style={{ 
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
        aria-label="Zoom in"
      >
        <span className="text-lg font-bold">+</span>
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={zoomOut}
        className="w-10 h-10 p-0 flex items-center justify-center shadow-xl"
        style={{ 
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
        aria-label="Zoom out"
      >
        <span className="text-lg font-bold">−</span>
      </Button>
    </div>
  );
};

// Map legend component
const MapLegend: React.FC = () => (
  <div 
    className="absolute top-4 right-4 rounded-lg p-3 shadow-lg z-20 border"
    style={{ 
      backgroundColor: 'var(--surface)',
      borderColor: 'var(--border)'
    }}
  >
    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>
      Map Legend
    </div>
    <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(217 92% 60%)" }}>
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </div>
        <span>Points of Interest</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--primary)" }}>
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </div>
        <span>Selected POI</span>
      </div>
    </div>
  </div>
);

// Map loading skeleton component
const MapSkeleton: React.FC<{ className?: string; height?: string }> = ({ className, height }) => (
  <div
    className={`relative overflow-hidden border border-border bg-muted/30 ${className}`}
    style={{ height }}
  >
    {/* Map background pattern */}
    <div className="absolute inset-0 opacity-20">
      <div className="w-full h-full bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      {/* Grid pattern to simulate map tiles */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
    </div>

    {/* Skeleton markers at various positions */}
    <div className="absolute top-1/4 left-1/3 z-10">
      <div className="w-6 h-6 bg-primary/40 rounded-full animate-pulse flex items-center justify-center">
        <MapPin className="h-3 w-3 text-primary/60" />
      </div>
    </div>
    <div className="absolute top-1/2 right-1/3 z-10">
      <div className="w-6 h-6 bg-primary/40 rounded-full animate-pulse flex items-center justify-center">
        <MapPin className="h-3 w-3 text-primary/60" />
      </div>
    </div>
    <div className="absolute bottom-1/3 left-1/4 z-10">
      <div className="w-6 h-6 bg-primary/40 rounded-full animate-pulse flex items-center justify-center">
        <MapPin className="h-3 w-3 text-primary/60" />
      </div>
    </div>
    <div className="absolute top-2/3 right-1/4 z-10">
      <div className="w-6 h-6 bg-primary/40 rounded-full animate-pulse flex items-center justify-center">
        <MapPin className="h-3 w-3 text-primary/60" />
      </div>
    </div>

    {/* Skeleton controls */}
    <div className="absolute bottom-24 left-4 flex flex-col gap-1 z-20">
      <Skeleton className="w-10 h-10 rounded" />
      <Skeleton className="w-10 h-10 rounded" />
    </div>

    {/* Skeleton legend */}
    <div className="absolute top-4 right-4 z-20">
      <Skeleton className="w-24 h-16 rounded-lg" />
    </div>

    {/* Loading overlay */}
    <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-30">
      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
      <p className="text-xs text-muted-foreground">Loading map...</p>
    </div>
  </div>
);

// Main map content component
const MapContent: React.FC<{
  pois: Poi[];
  selectedPoiIds: number[];
  hoveredPoi: Poi | null;
  onPoiClick?: (poi: Poi) => void;
  onPoiHover?: (poi: Poi | null) => void;
  enableClustering?: boolean;
}> = ({ pois, selectedPoiIds, hoveredPoi, onPoiClick, onPoiHover, enableClustering = false }) => {
  const { isInTrip, addToTrip, isAddingToTrip } = useTripPlaces();
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<{
    place: any;
    position: { lat: number; lng: number };
  } | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const map = useMap();
  const devLog = useDevLog();

  // Real-time viewport tracking for clustering
  const [viewport, setViewport] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

  // Update viewport on map events  
  useEffect(() => {
    if (!map) return;

    const updateViewport = () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      const newViewport = {
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng()
      };

      // Minimal logging for viewport updates
      if (enableClustering) {
        console.log(`🗺️ Clustering at zoom ${map.getZoom()}`);
      }
      
      setViewport(newViewport);
    };

    // Initial viewport
    updateViewport();

    // Use debounced idle event to prevent zoom fighting
    let timeoutId: NodeJS.Timeout;
    
    const debouncedUpdateViewport = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewport, 300); // 300ms debounce
    };

    // Listen for map idle event (fires when map stops moving/zooming)
    const listeners = [
      map.addListener('idle', debouncedUpdateViewport)
    ];

    return () => {
      clearTimeout(timeoutId);
      listeners.forEach(listener => {
        if (listener && typeof listener.remove === 'function') {
          listener.remove();
        }
      });
    };
  }, [map]);

  const currentZoom = map?.getZoom() || 10;
  
  // Use client-side clustering when enabled and viewport is available
  const {
    clusters: clientClusters,
    singlePOIs: clusterSinglePOIs,
    multiPOIClusters,
    totalClusters,
    clusterCount,
    singlePOICount,
    isLoading: clusteringLoading,
    error: clusteringError,
    isConnected: clusteringConnected
  } = useClientPOIClustering(
    pois,
    currentZoom,
    viewport,
    {
      gridSize: 150,      // Good balance for visibility
      maxZoom: 18,        // Cluster even at very high zoom levels
      minimumClusterSize: 2  // At least 2 POIs to form cluster
    }
  );

  // Use clustering data when available, fallback to regular POIs
  const shouldUseClustering = enableClustering && viewport && clusteringConnected && !clusteringError;
  const effectivePois = shouldUseClustering ? clusterSinglePOIs.map(c => c.pois[0]) : pois; // Use single POIs from clustering
  const effectiveClusters = shouldUseClustering ? multiPOIClusters : [];

  // Expose POI and clustering data to debug tools
  useEffect(() => {
    // Always expose POI data for debugging
    (window as any).__routewise_pois = pois;
    
    // Update selected POIs count in debug tools
    const tripPlaces = JSON.parse(localStorage.getItem('tripPlaces') || '[]');
    const countEl = document.getElementById('selected-pois-count');
    if (countEl) {
      countEl.textContent = tripPlaces.length.toString();
    }
    
    if (enableClustering) {
      (window as any).__clientClustering = {
        isConnected: clusteringConnected,
        error: clusteringError,
        totalClusters,
        singlePOIs: singlePOICount,
        multiPOIClusters: clusterCount,
        clusters: clientClusters,
        refreshClusters: () => {
          devLog('InteractiveMap', 'Client clustering refresh (automatic)', {
            connected: clusteringConnected,
            totalClusters,
            zoom: currentZoom
          });
        }
      };

      // Update debug panel if it exists
      const statusDot = document.getElementById('clustering-status-dot');
      const statusText = document.getElementById('clustering-status-text');
      const clusterCountEl = document.getElementById('cluster-count');
      const singlePoiCountEl = document.getElementById('single-poi-count');
      const totalCountEl = document.getElementById('total-cluster-count');

      if (statusDot && statusText) {
        if (clusteringConnected) {
          statusDot.className = 'w-2 h-2 rounded-full bg-green-500';
          statusText.textContent = 'Client Clustering Active';
          statusText.className = 'text-sm font-medium text-green-600';
        } else if (clusteringError) {
          statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
          statusText.textContent = `Error: ${clusteringError}`;
          statusText.className = 'text-sm font-medium text-red-600';
        } else {
          statusDot.className = 'w-2 h-2 rounded-full bg-yellow-500';
          statusText.textContent = 'Client Clustering...';
          statusText.className = 'text-sm font-medium text-yellow-600';
        }
      }

      if (clusterCountEl) clusterCountEl.textContent = clusterCount.toString();
      if (singlePoiCountEl) singlePoiCountEl.textContent = singlePOICount.toString();
      if (totalCountEl) totalCountEl.textContent = totalClusters.toString();
    }

    return () => {
      delete (window as any).__clientClustering;
    };
  }, [enableClustering, clusteringConnected, clusteringError, totalClusters, singlePOICount, clusterCount, clientClusters, devLog]);

  // Auto-fit map bounds to show all POIs optimally (but not when clustering is enabled)
  useEffect(() => {
    if (map && pois.length > 0 && !enableClustering) {
      devLog('InteractiveMap', 'Auto-fitting map bounds', { poisCount: pois.length });
      
      const bounds = new window.google.maps.LatLngBounds();
      let validPoisCount = 0;
      
      // Add all valid POI coordinates to bounds
      pois.forEach(poi => {
        const coords = getPoiCoordinates(poi);
        if (coords.lat !== 0 || coords.lng !== 0) { // Skip default fallback coordinates
          bounds.extend(new window.google.maps.LatLng(coords.lat, coords.lng));
          validPoisCount++;
        }
      });
      
      if (validPoisCount > 0) {
        if (validPoisCount === 1) {
          // Single POI: center and use reasonable zoom
          const poi = pois.find(p => {
            const coords = getPoiCoordinates(p);
            return coords.lat !== 0 || coords.lng !== 0;
          });
          if (poi) {
            const coords = getPoiCoordinates(poi);
            map.setCenter({ lat: coords.lat, lng: coords.lng });
            map.setZoom(14); // Good zoom for single location
          }
        } else {
          // Multiple POIs: fit bounds with padding
          map.fitBounds(bounds, { 
            padding: { top: 60, right: 60, bottom: 60, left: 60 }
          });
        }
      }
    }
  }, [map, pois, devLog]);

  // Add Google POI click listener
  useEffect(() => {
    if (map) {
      devLog('InteractiveMap', 'Map Instance Ready', { hasMap: true, poisCount: pois.length });
      
      const listener = map.addListener('click', (event: any) => {
        devLog('InteractiveMap', 'Map Click', { hasPlaceId: !!event.placeId, placeId: event.placeId });
        
        if (event.placeId) {
          // Load Places library and get details
          window.google.maps.importLibrary('places').then((places: any) => {
            const service = new places.PlacesService(map);
            service.getDetails({
              placeId: event.placeId,
              fields: ['place_id', 'name', 'types', 'formatted_address', 'rating', 'geometry', 'photos', 'user_ratings_total']
            }, (place: any, status: any) => {
              devLog('InteractiveMap', 'Google Places Response', { status, placeName: place?.name, placeId: place?.place_id });
              
              if (status === 'OK' && place) {
                setSelectedGooglePlace({
                  place,
                  position: {
                    lat: place.geometry?.location?.lat() || 0,
                    lng: place.geometry?.location?.lng() || 0
                  }
                });
              }
            });
          }).catch((error: any) => {
            devLog('InteractiveMap', 'Places Library Load Error', error.message);
          });
        }
      });
      
      return () => {
        if (listener) {
          window.google.maps.event.removeListener(listener);
        }
      };
    }
  }, [map, devLog, pois.length]);

  const handlePoiClick = (poi: Poi) => {
    setSelectedPoi(poi);
    onPoiClick?.(poi);
  };

  const handleClusterClick = (cluster: any) => {
    if (!map) return;
    
    devLog('InteractiveMap', 'Cluster clicked', { 
      clusterId: cluster.id, 
      count: cluster.count, 
      currentZoom: map.getZoom() 
    });
    
    // If cluster has only a few POIs, zoom in to show them
    if (cluster.count <= 10) {
      map.setZoom(Math.min(map.getZoom() + 2, 18));
      map.setCenter({ lat: cluster.lat, lng: cluster.lng });
    } else {
      // For large clusters, zoom in more gradually
      map.setZoom(Math.min(map.getZoom() + 1, 16));
      map.setCenter({ lat: cluster.lat, lng: cluster.lng });
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedPoi(null);
  };

  // Calculate center and bounds from POI coordinates
  const { center, bounds } = useMemo(() => {
    if (!pois || pois.length === 0) {
      return { center: { lat: 39.8283, lng: -98.5795 }, bounds: null };
    }

    const coords = pois.map(poi => getPoiCoordinates(poi));
    
    const bounds = coords.reduce((acc, coord) => ({
      minLat: Math.min(acc.minLat, coord.lat),
      maxLat: Math.max(acc.maxLat, coord.lat),
      minLng: Math.min(acc.minLng, coord.lng),
      maxLng: Math.max(acc.maxLng, coord.lng)
    }), {
      minLat: coords[0].lat,
      maxLat: coords[0].lat,
      minLng: coords[0].lng,
      maxLng: coords[0].lng
    });

    const center = {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2
    };

    return { center, bounds };
  }, [pois]);

  return (
    <>
      <Map
        mapId="routewise-map"
        defaultCenter={center}
        defaultZoom={10}
        gestureHandling="greedy"
        disableDefaultUI={true}
        zoomControl={false}
        mapTypeControl={false}
        scaleControl={true}
        streetViewControl={false}
        rotateControl={false}
        fullscreenControl={true}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Render clusters when clustering is enabled */}
        {effectiveClusters.map((cluster) => (
          cluster.type === 'cluster' ? (
            <ClusterMarker
              key={cluster.id}
              cluster={cluster}
              isHovered={hoveredCluster === cluster.id}
              onClick={() => handleClusterClick(cluster)}
              onMouseEnter={() => setHoveredCluster(cluster.id)}
              onMouseLeave={() => setHoveredCluster(null)}
            />
          ) : (
            // Single POI from clustering system
            <PoiMarker
              key={cluster.id}
              poi={cluster.pois[0]} // Single POI clusters have one POI
              isSelected={selectedPoiIds.includes(Number(cluster.pois[0].id))}
              isHovered={hoveredPoi ? (hoveredPoi.placeId || hoveredPoi.id) === (cluster.pois[0].placeId || cluster.pois[0].id) : false}
              onClick={handlePoiClick}
              onMouseEnter={(poi) => onPoiHover?.(poi)}
              onMouseLeave={() => onPoiHover?.(null)}
            />
          )
        ))}

        {/* Render regular POIs when clustering is disabled or unavailable */}
        {effectivePois.map((poi, index) => {
          const isSelected = selectedPoiIds.includes(Number(poi.id));
          const isHovered = hoveredPoi ? (hoveredPoi.placeId || hoveredPoi.id) === (poi.placeId || poi.id) : false;
          
          return (
            <PoiMarker
              key={poi.placeId || poi.id}
              poi={poi}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={handlePoiClick}
              onMouseEnter={(poi) => onPoiHover?.(poi)}
              onMouseLeave={() => onPoiHover?.(null)}
              index={index}
            />
          );
        })}

        {selectedPoi && (
          <PoiInfoWindow
            poi={selectedPoi}
            onClose={handleInfoWindowClose}
            isInTrip={isInTrip}
            addToTrip={addToTrip}
            isAddingToTrip={isAddingToTrip}
          />
        )}

        {selectedGooglePlace && (
          <GooglePlaceInfoWindow
            place={selectedGooglePlace.place}
            position={selectedGooglePlace.position}
            onClose={() => setSelectedGooglePlace(null)}
            isInTrip={isInTrip}
            addToTrip={addToTrip}
            isAddingToTrip={isAddingToTrip}
          />
        )}
      </Map>
      
      <MapControls />
      <MapLegend />
      
      {/* Debug clustering status when enabled */}
      {enableClustering && (
        <div className="absolute top-20 right-4 z-20">
          <div 
            className="rounded-lg p-2 shadow-lg border text-xs"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-muted)'
            }}
          >
            <div className={`flex items-center gap-1 mb-1 ${clusteringConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${clusteringConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{clusteringConnected ? 'Client Clustering' : 'Clustering Off'}</span>
            </div>
            {shouldUseClustering && (
              <>
                <div>Clusters: {clusterCount}</div>
                <div>Single: {singlePOICount}</div>
                <div>Total: {totalClusters}</div>
                <div className="text-xs text-green-600 mt-1">Zoom: {currentZoom}</div>
              </>
            )}
            {!clusteringConnected && clusteringError && (
              <div className="text-red-600 text-xs mt-1">
                Error: {clusteringError}
              </div>
            )}
            {!shouldUseClustering && enableClustering && (
              <div className="text-yellow-600 text-xs mt-1">
                High zoom - showing individual POIs
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  startCity,
  endCity,
  checkpoints = [],
  pois = [],
  selectedPoiIds = [],
  hoveredPoi,
  onPoiClick,
  onPoiSelect,
  onPoiHover,
  className = "",
  height = "400px",
  apiKey,
  enableClustering = false,
}) => {
  const [googleMapsKey, setGoogleMapsKey] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set Google Maps API key
  useEffect(() => {
    const initializeApiKey = async () => {
      if (apiKey) {
        setGoogleMapsKey(apiKey);
        setIsLoading(false);
      } else {
        // Try environment variable first as fallback
        const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (envApiKey) {
          console.log('✅ Using Google Maps API key from environment variable');
          setGoogleMapsKey(envApiKey);
          setIsLoading(false);
          return;
        }
        
        // Fallback to backend API
        try {
          const response = await fetch("/api/maps-key");
          const data = await response.json();
          if (data.apiKey) {
            setGoogleMapsKey(data.apiKey);
          } else {
            setError("Google Maps API key not configured");
          }
        } catch (err) {
          console.error("Failed to fetch Maps API key:", err);
          setError("Failed to load map configuration");
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeApiKey();
  }, [apiKey]);

  if (error) {
    return (
      <div
        className={`bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h4 className="text-lg font-semibold text-destructive mb-2">Map Error</h4>
          <p className="text-destructive/80 text-sm mb-4 max-w-md">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !googleMapsKey) {
    return <MapSkeleton className={className} height={height} />;
  }

  return (
    <div
      className={`relative overflow-hidden border border-border ${className}`}
      style={{ height }}
    >
      <APIProvider apiKey={googleMapsKey}>
        <MapContent
          pois={pois}
          selectedPoiIds={selectedPoiIds}
          hoveredPoi={hoveredPoi || null}
          onPoiClick={onPoiClick}
          onPoiHover={onPoiHover}
          enableClustering={enableClustering}
        />
      </APIProvider>
    </div>
  );
};