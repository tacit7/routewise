import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, divIcon, LatLngBounds } from "leaflet";
import { Loader2, MapPin, Clock, Globe, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Poi } from "@/types/schema";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { useDevLog } from "@/components/developer-fab";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
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
}

// POI category to color mapping
const getCategoryColor = (category: string, index?: number): string => {
  if (typeof index === 'number') {
    const previewColors = [
      "#EA4335", "#34A853", "#4285F4", "#9C27B0", "#FF9800",
      "#795548", "#137333", "#E91E63", "#FF5722", "#607D8B",
      "#8BC34A", "#FFC107", "#673AB7", "#00BCD4", "#CDDC39"
    ];
    return previewColors[index % previewColors.length];
  }
  
  const colors = {
    restaurant: "#EA4335",
    attraction: "#34A853", 
    park: "#137333",
    scenic: "#4285F4",
    shopping: "#9C27B0",
    market: "#FF9800",
    historic: "#795548",
    default: "#4285F4",
  };
  return colors[category as keyof typeof colors] || colors.default;
};

// Helper function to get POI coordinates
const getPoiCoordinates = (poi: Poi): { lat: number; lng: number } => {
  const lat = poi.lat ?? poi.latitude ?? 0;
  const lng = poi.lng ?? poi.longitude ?? 0;

  if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) {
    return { lat: 39.8283, lng: -98.5795 };
  }

  return { lat, lng };
};

// Create custom marker icon
const createCustomIcon = (color: string, isSelected: boolean, isHovered: boolean) => {
  const scale = isSelected || isHovered ? 1.2 : 1.0;
  const size = 25 * scale;
  
  return divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    className: 'custom-poi-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// POI Marker component
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
  const icon = createCustomIcon(color, isSelected, isHovered);
  
  return (
    <Marker
      position={[coords.lat, coords.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(poi),
        mouseover: () => onMouseEnter?.(poi),
        mouseout: () => onMouseLeave?.(),
      }}
    >
      <PoiPopup poi={poi} />
    </Marker>
  );
};

// POI Popup component
const PoiPopup: React.FC<{ poi: Poi }> = ({ poi }) => {
  const { isInTrip, addToTrip, isAddingToTrip } = useTripPlaces();
  const [isAdding, setIsAdding] = useState(false);
  const isAddedToTrip = isInTrip(poi);
  
  const handleAddToTrip = async () => {
    if (isAddedToTrip || isAdding || isAddingToTrip) return;
    
    setIsAdding(true);
    try {
      await addToTrip(poi);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Popup>
      <div className="p-3 max-w-sm">
        {poi.imageUrl && (
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-full h-32 object-cover rounded mb-2"
          />
        )}
        
        {/* Header with name and badges */}
        <div className="mb-2">
          <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
            {poi.name}
            {poi.hiddenGem && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">💎 Hidden Gem</span>
            )}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-muted-foreground capitalize">{poi.category}</p>
            {poi.placeTypes && poi.placeTypes.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {poi.placeTypes[0]}
              </span>
            )}
          </div>
        </div>
        
        {poi.description && (
          <p className="text-sm text-foreground mb-2">{poi.description}</p>
        )}
        
        {/* Rating */}
        <div className="flex items-center text-xs mb-2">
          <span className="text-yellow-500">⭐</span>
          <span className="ml-1 text-muted-foreground">{poi.rating} ({poi.reviewCount || 0} reviews)</span>
        </div>
        
        {/* Duration and Best Time */}
        {(poi.durationSuggested || poi.bestTimeToVisit) && (
          <div className="mb-2 flex flex-wrap gap-1">
            {poi.durationSuggested && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                {poi.durationSuggested}
              </span>
            )}
            {poi.bestTimeToVisit && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                <Globe className="h-3 w-3" />
                {poi.bestTimeToVisit}
              </span>
            )}
          </div>
        )}
        
        {/* Accessibility */}
        {poi.accessibility && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              <MapPin className="h-3 w-3" />
              {poi.accessibility}
            </span>
          </div>
        )}
        
        {/* Tips */}
        {poi.tips && poi.tips.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                <Search className="h-3 w-3" />
                Tips
              </span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {poi.tips.slice(0, 2).map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
        
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
    </Popup>
  );
};

// Map controls component
const MapControls: React.FC = () => {
  const map = useMap();

  const zoomIn = () => {
    map.zoomIn();
  };

  const zoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="absolute bottom-24 left-4 flex flex-col gap-1 z-50">
      <Button
        size="sm"
        variant="secondary"
        onClick={zoomIn}
        className="w-10 h-10 p-0 flex items-center justify-center shadow-xl bg-card border-border"
        aria-label="Zoom in"
      >
        <span className="text-lg font-bold">+</span>
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={zoomOut}
        className="w-10 h-10 p-0 flex items-center justify-center shadow-xl bg-card border-border"
        aria-label="Zoom out"
      >
        <span className="text-lg font-bold">−</span>
      </Button>
    </div>
  );
};

// Auto-fit bounds component
const AutoFitBounds: React.FC<{ pois: Poi[] }> = ({ pois }) => {
  const map = useMap();
  const devLog = useDevLog();
  const [userInteracting, setUserInteracting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Track user interactions to prevent auto-fit during manual zoom
  useEffect(() => {
    if (!map) return;

    const handleUserStart = () => {
      setUserInteracting(true);
    };

    const handleUserEnd = () => {
      // Debounce user interaction end to prevent immediate auto-fit
      setTimeout(() => setUserInteracting(false), 1000);
    };

    // Listen for user zoom/pan interactions
    map.on('zoomstart', handleUserStart);
    map.on('movestart', handleUserStart);
    map.on('zoomend', handleUserEnd);
    map.on('moveend', handleUserEnd);

    return () => {
      map.off('zoomstart', handleUserStart);
      map.off('movestart', handleUserStart);
      map.off('zoomend', handleUserEnd);
      map.off('moveend', handleUserEnd);
    };
  }, [map]);

  useEffect(() => {
    // Only auto-fit if user is not currently interacting and we haven't initialized yet
    if (pois.length > 0 && !userInteracting && !hasInitialized) {
      devLog('LeafletMap', 'Auto-fitting map bounds', { poisCount: pois.length });
      
      const bounds = new LatLngBounds([]);
      let validPoisCount = 0;
      
      pois.forEach(poi => {
        const coords = getPoiCoordinates(poi);
        if (coords.lat !== 0 || coords.lng !== 0) {
          bounds.extend([coords.lat, coords.lng]);
          validPoisCount++;
        }
      });
      
      if (validPoisCount > 0) {
        if (validPoisCount === 1) {
          const poi = pois.find(p => {
            const coords = getPoiCoordinates(p);
            return coords.lat !== 0 || coords.lng !== 0;
          });
          if (poi) {
            const coords = getPoiCoordinates(poi);
            map.setView([coords.lat, coords.lng], 14);
          }
        } else {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
        setHasInitialized(true);
      }
    }
  }, [map, pois, devLog, userInteracting, hasInitialized]);

  return null;
};

// Map loading skeleton
const MapSkeleton: React.FC<{ className?: string; height?: string }> = ({ className, height }) => (
  <div
    className={`relative overflow-hidden border border-border bg-muted/30 ${className}`}
    style={{ height }}
  >
    <div className="absolute inset-0 opacity-20">
      <div className="w-full h-full bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
    </div>

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

    <div className="absolute bottom-24 left-4 flex flex-col gap-1 z-20">
      <Skeleton className="w-10 h-10 rounded" />
      <Skeleton className="w-10 h-10 rounded" />
    </div>

    <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-30">
      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
      <p className="text-xs text-muted-foreground">Loading map...</p>
    </div>
  </div>
);

export const LeafletMap: React.FC<LeafletMapProps> = ({
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
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const devLog = useDevLog();

  useEffect(() => {
    // Simulate loading time for map initialization
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate center from POIs
  const center = useMemo(() => {
    if (!pois || pois.length === 0) {
      return [39.8283, -98.5795] as [number, number];
    }

    const coords = pois.map(poi => getPoiCoordinates(poi));
    const center = coords.reduce(
      (acc, coord) => ({
        lat: acc.lat + coord.lat,
        lng: acc.lng + coord.lng,
      }),
      { lat: 0, lng: 0 }
    );

    return [center.lat / coords.length, center.lng / coords.length] as [number, number];
  }, [pois]);

  const handlePoiClick = (poi: Poi) => {
    onPoiClick?.(poi);
  };

  // Expose POI data to debug tools (same as Google Maps component)
  useEffect(() => {
    // Always expose POI data for debugging
    (window as any).__routewise_pois = pois;
    
    // Update selected POIs count in debug tools
    const tripPlaces = JSON.parse(localStorage.getItem('tripPlaces') || '[]');
    const countEl = document.getElementById('selected-pois-count');
    if (countEl) {
      countEl.textContent = tripPlaces.length.toString();
    }
    
    // Log for debugging
    devLog('LeafletMap', 'POI data exposed to debug tools', { poisCount: pois.length });
  }, [pois, devLog]);

  if (isLoading) {
    return <MapSkeleton className={className} height={height} />;
  }

  return (
    <div
      className={`relative overflow-hidden border border-border ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          keepBuffer={2}
          updateWhenIdle={true}
          updateWhenZooming={false}
        />
        
        <AutoFitBounds pois={pois} />
        
        {pois.map((poi, index) => {
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
        
        <MapControls />
      </MapContainer>
    </div>
  );
};