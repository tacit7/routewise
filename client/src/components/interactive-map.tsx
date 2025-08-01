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

// Create marker icon with category-specific colors
const createMarkerIcon = (category: string, isSelected = false): google.maps.Icon => {
  const color = getCategoryColor(category);
  const strokeColor = isSelected ? '#000000' : '#FFFFFF';
  const strokeWidth = isSelected ? 3 : 2;
  
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 0.8,
    strokeColor: strokeColor,
    strokeWeight: strokeWidth,
    scale: isSelected ? 12 : 8,
  };
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  startCity,
  endCity,
  checkpoints = [],
  pois = [],
  selectedPoiIds = [],
  onPoiClick,
  onPoiSelect,
  className = '',
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
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

  // Load Google Maps JavaScript API
  const loadGoogleMapsScript = useCallback((apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
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
        mapTypeId: google.maps.MapTypeId.ROADMAP,
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
      travelMode: google.maps.TravelMode.DRIVING,
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
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add start marker
    const startMarker = new google.maps.Marker({
      position: route.legs[0].start_location,
      map: mapInstanceRef.current,
      title: `Start: ${startCity}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#22C55E',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 10,
      },
    });

    // Add end marker
    const endMarker = new google.maps.Marker({
      position: route.legs[route.legs.length - 1].end_location,
      map: mapInstanceRef.current,
      title: `End: ${endCity}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 10,
      },
    });

    markersRef.current.push(startMarker, endMarker);

    // Add checkpoint markers
    checkpoints.forEach((checkpoint, index) => {
      if (route.legs[index] && route.legs[index].end_location) {
        const checkpointMarker = new google.maps.Marker({
          position: route.legs[index].end_location,
          map: mapInstanceRef.current,
          title: `Checkpoint: ${checkpoint}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#F59E0B',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 8,
          },
        });
        markersRef.current.push(checkpointMarker);
      }
    });
  };

  // Update POI markers
  const updatePoiMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing POI markers (keep route markers)
    const routeMarkerCount = 2 + checkpoints.length; // start + end + checkpoints
    const poiMarkers = markersRef.current.slice(routeMarkerCount);
    poiMarkers.forEach(marker => marker.setMap(null));
    markersRef.current = markersRef.current.slice(0, routeMarkerCount);

    // Add POI markers
    pois.forEach(poi => {
      if (!poi.address) return;

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: poi.address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const isSelected = selectedPoiIds.includes(poi.id);
          const marker = new google.maps.Marker({
            position: results[0].geometry.location,
            map: mapInstanceRef.current,
            title: poi.name,
            icon: createMarkerIcon(poi.category, isSelected),
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

          markersRef.current.push(marker);
        }
      });
    });
  }, [pois, selectedPoiIds, onPoiClick, onPoiSelect, checkpoints.length]);

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

  // Update POI markers when pois or selection changes
  useEffect(() => {
    if (!isLoading && mapInstanceRef.current) {
      updatePoiMarkers();
    }
  }, [pois, selectedPoiIds, updatePoiMarkers, isLoading]);

  // Update route when checkpoints change
  useEffect(() => {
    if (!isLoading && mapInstanceRef.current) {
      loadRoute();
    }
  }, [checkpoints, loadRoute, isLoading]);

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
      
      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.open(googleMapsDirectUrl, '_blank')}
          className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Open in Google Maps
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
