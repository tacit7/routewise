import React, { useCallback, useState, useEffect, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap, Pin } from "@vis.gl/react-google-maps";
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

  // Validate coordinates are valid numbers
  if (!isFinite(lat) || !isFinite(lng) || lat === 0 || lng === 0) {
    console.error('❌ Invalid POI coordinates:', { 
      id: poi.id, 
      name: poi.name, 
      primary: { lat: poi.lat, lng: poi.lng },
      fallback: { latitude: poi.latitude, longitude: poi.longitude }
    });
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
  index?: number;
}> = ({ poi, isSelected, isHovered, onClick, index }) => {
  const coords = getPoiCoordinates(poi);
  console.log('🎯 POI Marker Rendering:', { name: poi.name, coords, category: poi.category });

  const color = getCategoryColor(poi.category, index); // Use array index for consistent color cycling
  console.log('🎨 Google Pin Color:', { category: poi.category, color, poiId: poi.id });
  
  console.log('🗺️ Rendering AdvancedMarker with Pin:', { position: coords, title: poi.name });
  
  return (
    <AdvancedMarker
      position={coords}
      title={poi.name}
      onClick={() => {
        console.log('📍 Marker clicked:', poi.name);
        onClick(poi);
      }}
    >
      <Pin
        background={color}
        glyphColor="white"
        borderColor="white"
        scale={isSelected || isHovered ? 1.2 : 1.0}
      />
    </AdvancedMarker>
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
        className="bg-card/90 backdrop-blur-sm hover:bg-card shadow-lg w-10 h-10 p-0 flex items-center justify-center border border-border/50"
        aria-label="Zoom in"
      >
        <span className="text-lg font-bold">+</span>
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={zoomOut}
        className="bg-card/90 backdrop-blur-sm hover:bg-card shadow-lg w-10 h-10 p-0 flex items-center justify-center border border-border/50"
        aria-label="Zoom out"
      >
        <span className="text-lg font-bold">−</span>
      </Button>
    </div>
  );
};

// Map legend component
const MapLegend: React.FC = () => (
  <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20 border border-border/50">
    <div className="text-xs font-semibold text-foreground mb-2">
      Map Legend
    </div>
    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(217 92% 60%)" }}>
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </div>
        <span>Points of Interest</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(160 84% 36%)" }}>
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
        {pois.map((poi, index) => {
          const isSelected = selectedPoiIds.includes(Number(poi.id));
          const isHovered = hoveredPoi ? (hoveredPoi.placeId || hoveredPoi.id) === (poi.placeId || poi.id) : false;
          
          console.log(`🔢 Rendering POI ${index + 1}/${pois.length}:`, { 
            name: poi.name, 
            id: poi.id, 
            placeId: poi.placeId,
            isSelected, 
            isHovered,
            colorIndex: index // Show which color index this POI will use
          });
          
          return (
            <PoiMarker
              key={poi.placeId || poi.id}
              poi={poi}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={handlePoiClick}
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
        className={`relative overflow-hidden border border-border ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading interactive map...</p>
        </div>
      </div>
    );
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
          hoveredPoi={hoveredPoi}
          onPoiClick={onPoiClick}
        />
      </APIProvider>
    </div>
  );
};