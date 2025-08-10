import React, { useCallback, useState, useEffect, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Poi } from "@/types/schema";
import { useTripPlaces } from "@/hooks/use-trip-places";

interface InteractiveMapProps {
  startCity: string;
  endCity: string;
  checkpoints?: string[];
  pois?: Poi[];
  selectedPoiIds?: number[];
  hoveredPoi?: Poi | null;
  onPoiClick?: (poi: Poi) => void;
  onPoiSelect?: (poiId: number, selected: boolean) => void;
  className?: string;
  height?: string;
  apiKey?: string; // Optional API key to avoid fetching separately
}

// POI category to marker color mapping using CSS variables
const getCategoryColor = (category: string): string => {
  const colors = {
    restaurant: "rgb(239 68 68)", // Red-500
    attraction: "rgb(34 197 94)", // Green-500 (brand)
    park: "rgb(22 163 74)", // Green-600
    scenic: "rgb(59 130 246)", // Blue-500
    market: "rgb(245 158 11)", // Amber-500
    historic: "rgb(168 85 247)", // Purple-500
    default: "rgb(99 102 241)", // Indigo-500
  };
  return colors[category as keyof typeof colors] || colors.default;
};

// Create custom owl-themed SVG marker using design system colors
const createOwlMarkerSVG = (
  baseColor: string,
  isSelected = false,
  isHovered = false
): string => {
  const size = isSelected || isHovered ? 32 : 28;
  const shadowIntensity = isHovered ? 0.4 : 0.3;
  const primaryColor = isSelected ? "rgb(34 197 94)" : baseColor; // Use design system primary
  const glowEffect = isSelected ? `filter="drop-shadow(0 0 8px ${primaryColor})"` : '';

  return `
    <svg width="${size}" height="${size * 1.2}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" ${glowEffect}>
      <!-- Pin Drop Shadow -->
      <ellipse cx="50" cy="115" rx="15" ry="3" fill="rgba(0,0,0,${shadowIntensity})" />

      <!-- Pin Body -->
      <path d="M50 10 C30 10, 15 25, 15 45 C15 65, 50 100, 50 100 C50 100, 85 65, 85 45 C85 25, 70 10, 50 10 Z"
            fill="${primaryColor}" stroke="white" stroke-width="2"/>

      <!-- Owl Face Background -->
      <circle cx="50" cy="40" r="22" fill="rgba(255,255,255,0.9)"/>

      <!-- Owl Eyes -->
      <circle cx="42" cy="35" r="8" fill="white"/>
      <circle cx="58" cy="35" r="8" fill="white"/>

      <!-- Owl Eye Details -->
      <circle cx="42" cy="35" r="5" fill="${primaryColor}"/>
      <circle cx="58" cy="35" r="5" fill="${primaryColor}"/>
      <circle cx="42" cy="35" r="2" fill="white"/>
      <circle cx="58" cy="35" r="2" fill="white"/>

      <!-- Owl Beak -->
      <path d="M47 42 L50 48 L53 42 Z" fill="${primaryColor}"/>

      <!-- Owl Eyebrows -->
      <path d="M35 28 C38 25, 46 25, 48 28" stroke="${primaryColor}" stroke-width="2" fill="none"/>
      <path d="M52 28 C54 25, 62 25, 65 28" stroke="${primaryColor}" stroke-width="2" fill="none"/>

      <!-- Decorative Elements -->
      <circle cx="65" cy="25" r="3" fill="rgba(255,255,255,0.6)"/>
      <path d="M30 50 C25 45, 25 55, 30 50" fill="rgba(255,255,255,0.4)"/>
      <path d="M70 50 C75 45, 75 55, 70 50" fill="rgba(255,255,255,0.4)"/>
    </svg>
  `;
};

// Helper function to normalize POI coordinates
const getPoiCoordinates = (poi: any): { lat: number; lng: number } | null => {
  const lat = poi.lat ?? poi.latitude;
  const lng = poi.lng ?? poi.longitude;

  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }

  return null;
};

// Custom marker component
const PoiMarker: React.FC<{
  poi: Poi;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (poi: Poi) => void;
}> = ({ poi, isSelected, isHovered, onClick }) => {
  const coords = getPoiCoordinates(poi);
  
  if (!coords) return null;

  const color = getCategoryColor(poi.category);
  const markerSVG = createOwlMarkerSVG(color, isSelected, isHovered);
  
  // Create marker element
  const markerElement = useMemo(() => {
    const div = document.createElement('div');
    div.style.cssText = `
      cursor: pointer;
      opacity: ${isHovered ? "1.0" : "0.85"};
      transition: all 0.3s ease;
      transform: ${isHovered ? "scale(1.1)" : "scale(1)"};
      z-index: ${isSelected ? "1000" : isHovered ? "999" : "1"};
      position: relative;
    `;
    div.innerHTML = markerSVG;
    return div;
  }, [markerSVG, isHovered, isSelected]);

  return (
    <AdvancedMarker
      position={coords}
      title={poi.name}
      onClick={() => onClick(poi)}
      content={markerElement}
    />
  );
};

// Info window component
const PoiInfoWindow: React.FC<{
  poi: Poi;
  onClose: () => void;
  isInTrip: (poi: Poi) => boolean;
  addToTrip: (poi: Poi) => void;
  isAddingToTrip: boolean;
}> = ({ poi, onClose, isInTrip, addToTrip, isAddingToTrip }) => {
  const coords = getPoiCoordinates(poi);
  const [isAdding, setIsAdding] = useState(false);
  
  if (!coords) return null;

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
        <p className="text-xs text-muted-fg capitalize mb-2">{poi.category}</p>
        {poi.description && (
          <p className="text-sm text-fg mb-2">{poi.description}</p>
        )}
        <div className="flex items-center text-xs mb-1">
          <span className="text-yellow-500">⭐</span>
          <span className="ml-1 text-muted-fg">{poi.rating} ({poi.reviewCount || 0} reviews)</span>
        </div>
        {poi.address && (
          <p className="text-xs text-muted-fg mb-3">{poi.address}</p>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleAddToTrip}
            disabled={isAddedToTrip || isAdding || isAddingToTrip}
            className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              isAddedToTrip
                ? 'bg-primary/10 text-primary border border-primary/20 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-primary-fg shadow-sm hover:shadow-md'
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
    <div className="absolute top-4 right-4 flex flex-col gap-1 z-20">
      <Button
        size="sm"
        variant="secondary"
        onClick={zoomIn}
        className="bg-surface/90 backdrop-blur-sm hover:bg-surface shadow-lg w-10 h-10 p-0 flex items-center justify-center border border-border/50"
        aria-label="Zoom in"
      >
        <span className="text-lg font-bold">+</span>
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={zoomOut}
        className="bg-surface/90 backdrop-blur-sm hover:bg-surface shadow-lg w-10 h-10 p-0 flex items-center justify-center border border-border/50"
        aria-label="Zoom out"
      >
        <span className="text-lg font-bold">−</span>
      </Button>
    </div>
  );
};

// Map legend component
const MapLegend: React.FC = () => (
  <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20 border border-border/50">
    <div className="text-xs font-semibold text-fg mb-2">
      Map Legend
    </div>
    <div className="flex flex-col gap-1 text-xs text-muted-fg">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full flex items-center justify-center bg-indigo-500">
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </div>
        <span>Points of Interest</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full flex items-center justify-center bg-green-500">
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </div>
        <span>Selected POI</span>
      </div>
    </div>
  </div>
);

// Main map content component
const MapContent: React.FC<{
  pois: Poi[];
  selectedPoiIds: number[];
  hoveredPoi: Poi | null;
  onPoiClick?: (poi: Poi) => void;
}> = ({ pois, selectedPoiIds, hoveredPoi, onPoiClick }) => {
  const { isInTrip, addToTrip, isAddingToTrip } = useTripPlaces();
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  const handlePoiClick = (poi: Poi) => {
    setSelectedPoi(poi);
    onPoiClick?.(poi);
  };

  const handleInfoWindowClose = () => {
    setSelectedPoi(null);
  };

  // Calculate center and bounds from POI coordinates
  const { center, bounds } = useMemo(() => {
    if (!pois || pois.length === 0) {
      return { center: { lat: 39.8283, lng: -98.5795 }, bounds: null };
    }

    const validPois = pois.filter(poi => getPoiCoordinates(poi) !== null);
    if (validPois.length === 0) {
      return { center: { lat: 39.8283, lng: -98.5795 }, bounds: null };
    }

    const coords = validPois.map(poi => getPoiCoordinates(poi)!);
    
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
        {pois.map(poi => {
          const isSelected = selectedPoiIds.includes(Number(poi.id));
          const isHovered = hoveredPoi ? (hoveredPoi.placeId || hoveredPoi.id) === (poi.placeId || poi.id) : false;
          
          return (
            <PoiMarker
              key={poi.placeId || poi.id}
              poi={poi}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={handlePoiClick}
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
      </Map>
      
      <MapControls />
      <MapLegend />
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
  className = "",
  height = "400px",
  apiKey,
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
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-border ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 bg-bg/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-fg">Loading interactive map...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border ${className}`}
      style={{ height }}
    >
      <APIProvider apiKey={googleMapsKey}>
        <MapContent
          pois={pois}
          selectedPoiIds={selectedPoiIds}
          hoveredPoi={hoveredPoi}
          onPoiClick={onPoiClick}
        />
      </APIProvider>
    </div>
  );
};