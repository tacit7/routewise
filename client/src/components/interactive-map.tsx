import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, ExternalLink, MapPin, Flag, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Poi } from '@shared/schema';

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
}

// POI category to marker color mapping
const getCategoryColor = (category: string): string => {
  const colors = {
    restaurant: '#FF6B6B',     // Red
    attraction: '#4ECDC4',     // Teal
    park: '#45B7D1',          // Blue
    scenic: '#96CEB4',        // Green
    market: '#FFEAA7',        // Yellow
    historic: '#DDA0DD',      // Plum
    default: '#74B9FF'        // Light blue
  };
  return colors[category as keyof typeof colors] || colors.default;
};

// Create marker element with category-specific colors
const createMarkerElement = (category: string, poi: any, isSelected = false, isHovered = false): HTMLElement => {
  let color = getCategoryColor(category);
  let borderColor = '#FFFFFF';
  let borderWidth = '2px';
  let size = '24px'; // Base size
  
  if (isSelected) {
    color = '#22C55E'; // Green color only when selected
    borderColor = '#000000';
    borderWidth = '3px';
    size = '26px'; // Slight increase for selection
  }
  
  if (isHovered) {
    borderColor = '#FFD700'; // Gold for hover
    borderWidth = '4px';
    size = '26px'; // Same slight increase for hover
  }
  
  const markerElement = document.createElement('div');
  markerElement.style.cssText = `
    width: ${size};
    height: ${size};
    background-color: ${color};
    border: ${borderWidth} solid ${borderColor};
    border-radius: 50%;
    cursor: pointer;
    opacity: ${isHovered ? '1.0' : '0.8'};
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: white;
    font-weight: bold;
    text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
  `;
  
  // Add category initial as text content
  const categoryInitial = category.charAt(0).toUpperCase();
  markerElement.textContent = categoryInitial;
  
  return markerElement;
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
  className = '',
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const poiMarkersRef = useRef<Map<number, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleMapsKey, setGoogleMapsKey] = useState<string>('');

  // Fetch Google Maps API key
  useEffect(() => {
    const fetchMapsKey = async () => {
      try {
        const response = await fetch('/api/maps-key');
        const data = await response.json();
        if (data.apiKey) {
          setGoogleMapsKey(data.apiKey);
        } else {
          setError('Google Maps API key not configured');
        }
      } catch (err) {
        console.error('Failed to fetch Maps API key:', err);
        setError('Failed to load map configuration');
      }
    };
    
    fetchMapsKey();
  }, []);

  // Load Google Maps JavaScript API with async loading pattern
  const loadGoogleMapsScript = useCallback((apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for it to load
        const checkGoogleMaps = () => {
          if (window.google && window.google.maps) {
            resolve();
          } else {
            setTimeout(checkGoogleMaps, 100);
          }
        };
        checkGoogleMaps();
        return;
      }

      const script = document.createElement('script');
      // Use the recommended async loading pattern with loading=async parameter
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;
      
      // Set up load and error handlers before appending to DOM
      script.addEventListener('load', () => {
        // Ensure the API is fully loaded with all required properties
        const checkApiReady = () => {
          if (window.google && 
              window.google.maps && 
              window.google.maps.Map && 
              window.google.maps.MapTypeId &&
              window.google.maps.marker &&
              window.google.maps.marker.AdvancedMarkerElement) {
            resolve();
          } else {
            // Wait a bit more for the API to fully initialize
            setTimeout(checkApiReady, 100);
          }
        };
        checkApiReady();
      });
      
      script.addEventListener('error', () => {
        reject(new Error('Failed to load Google Maps'));
      });
      
      document.head.appendChild(script);
    });
  }, []);

  // Initialize map
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !googleMapsKey) return;

    try {
      await loadGoogleMapsScript(googleMapsKey);
      
      // Initialize map centered on start city
      const map = new google.maps.Map(mapRef.current, {
        zoom: 8,
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US, will be updated
        mapTypeId: 'roadmap', // Use string constant instead of enum
        mapId: 'routewise-map', // Required for AdvancedMarkerElement
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        draggable: false,
        panel: null,
        suppressMarkers: true, // We'll add our own markers
      });
      
      directionsRendererRef.current.setMap(map);
      infoWindowRef.current = new google.maps.InfoWindow();

      // Load route and POI markers
      await loadRoute();
      setIsLoading(false);
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  }, [googleMapsKey]);

  // Load route with waypoints
  const loadRoute = useCallback(async () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;

    const waypoints = checkpoints.map(checkpoint => ({
      location: checkpoint,
      stopover: true
    }));

    const request: google.maps.DirectionsRequest = {
      origin: startCity,
      destination: endCity,
      waypoints: waypoints,
      optimizeWaypoints: false,
      travelMode: 'DRIVING' as google.maps.TravelMode,
    };

    try {
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsServiceRef.current!.route(request, (result, status) => {
          if (status === 'OK' && result) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      directionsRendererRef.current.setDirections(result);
      
      // Add custom markers for start, end, and waypoints
      addRouteMarkers(result);
    } catch (err) {
      console.error('Failed to load route:', err);
      setError('Failed to load route directions');
    }
  }, [startCity, endCity, checkpoints]);

  // Add markers for route points
  const addRouteMarkers = (directionsResult: google.maps.DirectionsResult) => {
    if (!mapInstanceRef.current) return;

    const route = directionsResult.routes[0];
    if (!route) return;

    // Clear existing route markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    // Create start marker element
    const startElement = document.createElement('div');
    startElement.style.cssText = `
      width: 20px;
      height: 20px;
      background-color: #22C55E;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
      font-weight: bold;
    `;
    startElement.textContent = 'S';

    // Add start marker
    const startMarker = new google.maps.marker.AdvancedMarkerElement({
      position: route.legs[0].start_location,
      map: mapInstanceRef.current,
      title: `Start: ${startCity}`,
      content: startElement,
    });

    // Create end marker element
    const endElement = document.createElement('div');
    endElement.style.cssText = `
      width: 20px;
      height: 20px;
      background-color: #EF4444;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
      font-weight: bold;
    `;
    endElement.textContent = 'E';

    // Add end marker
    const endMarker = new google.maps.marker.AdvancedMarkerElement({
      position: route.legs[route.legs.length - 1].end_location,
      map: mapInstanceRef.current,
      title: `End: ${endCity}`,
      content: endElement,
    });

    markersRef.current.push(startMarker, endMarker);

    // Add checkpoint markers
    checkpoints.forEach((checkpoint, index) => {
      if (route.legs[index] && route.legs[index].end_location) {
        const checkpointElement = document.createElement('div');
        checkpointElement.style.cssText = `
          width: 16px;
          height: 16px;
          background-color: #F59E0B;
          border: 2px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: white;
          font-weight: bold;
        `;
        checkpointElement.textContent = (index + 1).toString();

        const checkpointMarker = new google.maps.marker.AdvancedMarkerElement({
          position: route.legs[index].end_location,
          map: mapInstanceRef.current,
          title: `Checkpoint: ${checkpoint}`,
          content: checkpointElement,
        });
        markersRef.current.push(checkpointMarker);
      }
    });
  };

  // Create or update POI markers
  const createPoiMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Remove markers for POIs that no longer exist
    const currentPoiIds = new Set(pois.map(poi => poi.placeId || poi.id));
    poiMarkersRef.current.forEach((marker, poiId) => {
      if (!currentPoiIds.has(poiId)) {
        marker.map = null;
        poiMarkersRef.current.delete(poiId);
      }
    });

    pois.forEach(poi => {
      if (!poi.address) return;

      // Skip if marker already exists
      const poiIdentifier = poi.placeId || poi.id;
      if (poiMarkersRef.current.has(poiIdentifier)) return;

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: poi.address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const isSelected = selectedPoiIds.includes(poi.id);
          const isHovered = hoveredPoi && (hoveredPoi.placeId || hoveredPoi.id) === (poi.placeId || poi.id);
          
          // Create marker element
          const markerElement = createMarkerElement(poi.category, poi, isSelected, isHovered);
          
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: results[0].geometry.location,
            map: mapInstanceRef.current,
            title: poi.name,
            content: markerElement,
          });

          // Add click listener
          marker.addListener('click', () => {
            if (onPoiClick) {
              onPoiClick(poi);
            }

            // Show info window
            if (infoWindowRef.current) {
              const content = `
                <div class="p-2 max-w-xs">
                  <h3 class="font-semibold text-sm">${poi.name}</h3>
                  <p class="text-xs text-gray-600 mb-2">${poi.category}</p>
                  <div class="flex items-center text-xs mb-1">
                    <span class="text-yellow-500">⭐</span>
                    <span class="ml-1">${poi.rating} (${poi.reviewCount} reviews)</span>
                  </div>
                  <p class="text-xs text-gray-500">${poi.address}</p>
                  ${onPoiSelect ? `
                    <button 
                      onclick="window.togglePoi(${poi.id})"
                      class="mt-2 px-2 py-1 text-xs ${isSelected ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} rounded"
                    >
                      ${isSelected ? 'Remove from Route' : 'Add to Route'}
                    </button>
                  ` : ''}
                </div>
              `;
              
              infoWindowRef.current.setContent(content);
              infoWindowRef.current.open(mapInstanceRef.current, marker);
            }
          });

          // Store the marker for future updates
          const poiIdentifier = poi.placeId || poi.id;
          poiMarkersRef.current.set(poiIdentifier, marker);
        }
      });
    });
  }, [pois, onPoiClick, onPoiSelect]);

  // Update marker icons based on selection and hover state
  const updateMarkerIcons = useCallback(() => {
    if (!mapInstanceRef.current) return;
    
    pois.forEach(poi => {
      const poiIdentifier = poi.placeId || poi.id;
      const marker = poiMarkersRef.current.get(poiIdentifier);
      if (marker) {
        const isSelected = selectedPoiIds.includes(poi.id);
        const isHovered = hoveredPoi && (hoveredPoi.placeId || hoveredPoi.id) === poiIdentifier;
        
        // Create new marker element with updated state
        const newMarkerElement = createMarkerElement(poi.category, poi, isSelected, isHovered);
        marker.content = newMarkerElement;
      }
    });
  }, [pois, selectedPoiIds, hoveredPoi]);

  // Setup global toggle function for info window buttons
  useEffect(() => {
    if (onPoiSelect) {
      (window as any).togglePoi = (poiId: number) => {
        const isSelected = selectedPoiIds.includes(poiId);
        onPoiSelect(poiId, !isSelected);
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
      };
    }

    return () => {
      delete (window as any).togglePoi;
    };
  }, [onPoiSelect, selectedPoiIds]);

  // Initialize map when API key is available
  useEffect(() => {
    if (googleMapsKey) {
      initializeMap();
    }
  }, [googleMapsKey, initializeMap]);

  // Create POI markers when pois change
  useEffect(() => {
    if (!isLoading && mapInstanceRef.current) {
      createPoiMarkers();
    }
  }, [pois, createPoiMarkers, isLoading]);

  // Update marker icons when selection or hover changes
  useEffect(() => {
    if (!isLoading && mapInstanceRef.current) {
      updateMarkerIcons();
    }
  }, [selectedPoiIds, hoveredPoi, updateMarkerIcons, isLoading]);


  // Update route when checkpoints change
  useEffect(() => {
    if (!isLoading && mapInstanceRef.current) {
      loadRoute();
    }
  }, [checkpoints, loadRoute, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all POI markers
      poiMarkersRef.current.forEach(marker => marker.map = null);
      poiMarkersRef.current.clear();
      
      // Clear route markers
      markersRef.current.forEach(marker => marker.map = null);
      markersRef.current = [];
    };
  }, []);

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-red-50 to-pink-100 rounded-lg border border-red-200 ${className}`} style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h4 className="text-lg font-semibold text-red-700 mb-2">Map Error</h4>
          <p className="text-red-600 text-sm mb-4 max-w-md">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const googleMapsDirectUrl = checkpoints.length > 0 
    ? `https://www.google.com/maps/dir/${encodeURIComponent(startCity)}/${checkpoints.map(c => encodeURIComponent(c)).join('/')}/${encodeURIComponent(endCity)}`
    : `https://www.google.com/maps/dir/${encodeURIComponent(startCity)}/${encodeURIComponent(endCity)}`;

  return (
    <div className={`relative rounded-lg overflow-hidden border border-slate-200 ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm text-slate-600">Loading interactive map...</p>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map controls overlay - Zoom buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 z-20">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (mapInstanceRef.current) {
              const currentZoom = mapInstanceRef.current.getZoom() || 8;
              mapInstanceRef.current.setZoom(currentZoom + 1);
            }
          }}
          className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg w-10 h-10 p-0 flex items-center justify-center"
          aria-label="Zoom in"
        >
          <span className="text-lg font-bold">+</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (mapInstanceRef.current) {
              const currentZoom = mapInstanceRef.current.getZoom() || 8;
              mapInstanceRef.current.setZoom(Math.max(1, currentZoom - 1));
            }
          }}
          className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg w-10 h-10 p-0 flex items-center justify-center"
          aria-label="Zoom out"
        >
          <span className="text-lg font-bold">−</span>
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20">
        <div className="text-xs font-semibold text-slate-700 mb-2">Map Legend</div>
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Start</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>End</span>
          </div>
          {checkpoints.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Checkpoint</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Points of Interest</span>
          </div>
        </div>
      </div>
    </div>
  );
};
