import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, ExternalLink, MapPin, Flag, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Poi } from "@shared/schema";
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
}

// POI category to marker color mapping
const getCategoryColor = (category: string): string => {
  const colors = {
    restaurant: "#FF6B6B", // Red
    attraction: "#4ECDC4", // Teal
    park: "#45B7D1", // Blue
    scenic: "#96CEB4", // Green
    market: "#FFEAA7", // Yellow
    historic: "#DDA0DD", // Plum
    default: "#74B9FF", // Light blue
  };
  return colors[category as keyof typeof colors] || colors.default;
};

// Create custom owl-themed SVG marker
const createOwlMarkerSVG = (
  baseColor: string,
  isSelected = false,
  isHovered = false
): string => {
  const size = isSelected || isHovered ? 32 : 28;
  const shadowIntensity = isHovered ? 0.4 : 0.3;
  const glowEffect = isSelected ? `filter="drop-shadow(0 0 8px ${baseColor})"` : '';
  
  return `
    <svg width="${size}" height="${size * 1.2}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" ${glowEffect}>
      <!-- Pin Drop Shadow -->
      <ellipse cx="50" cy="115" rx="15" ry="3" fill="rgba(0,0,0,${shadowIntensity})" />
      
      <!-- Pin Body -->
      <path d="M50 10 C30 10, 15 25, 15 45 C15 65, 50 100, 50 100 C50 100, 85 65, 85 45 C85 25, 70 10, 50 10 Z" 
            fill="${baseColor}" stroke="white" stroke-width="2"/>
      
      <!-- Owl Face Background -->
      <circle cx="50" cy="40" r="22" fill="rgba(255,255,255,0.9)"/>
      
      <!-- Owl Eyes -->
      <circle cx="42" cy="35" r="8" fill="white"/>
      <circle cx="58" cy="35" r="8" fill="white"/>
      
      <!-- Owl Eye Details -->
      <circle cx="42" cy="35" r="5" fill="${baseColor}"/>
      <circle cx="58" cy="35" r="5" fill="${baseColor}"/>
      <circle cx="42" cy="35" r="2" fill="white"/>
      <circle cx="58" cy="35" r="2" fill="white"/>
      
      <!-- Owl Beak -->
      <path d="M47 42 L50 48 L53 42 Z" fill="${baseColor}"/>
      
      <!-- Owl Eyebrows -->
      <path d="M35 28 C38 25, 46 25, 48 28" stroke="${baseColor}" stroke-width="2" fill="none"/>
      <path d="M52 28 C54 25, 62 25, 65 28" stroke="${baseColor}" stroke-width="2" fill="none"/>
      
      <!-- Decorative Elements -->
      <circle cx="65" cy="25" r="3" fill="rgba(255,255,255,0.6)"/>
      <path d="M30 50 C25 45, 25 55, 30 50" fill="rgba(255,255,255,0.4)"/>
      <path d="M70 50 C75 45, 75 55, 70 50" fill="rgba(255,255,255,0.4)"/>
    </svg>
  `;
};

// Create marker element with custom owl SVG
const createMarkerElement = (
  category: string,
  poi: any,
  isSelected = false,
  isHovered = false
): HTMLElement => {
  let color = getCategoryColor(category);

  if (isSelected) {
    color = "#22C55E"; // Green color when selected
  }

  const markerElement = document.createElement("div");
  markerElement.style.cssText = `
    cursor: pointer;
    opacity: ${isHovered ? "1.0" : "0.85"};
    transition: all 0.3s ease;
    transform: ${isHovered ? "scale(1.1)" : "scale(1)"};
    z-index: ${isSelected ? "1000" : isHovered ? "999" : "1"};
    position: relative;
  `;

  markerElement.innerHTML = createOwlMarkerSVG(color, isSelected, isHovered);

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
  className = "",
  height = "400px",
}) => {
  // Trip management hook
  const { isInTrip, addToTrip, isAddingToTrip } = useTripPlaces();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const poiMarkersRef = useRef<
    Map<number, google.maps.marker.AdvancedMarkerElement>
  >(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(
    null
  );
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleMapsKey, setGoogleMapsKey] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  // Fetch Google Maps API key
  useEffect(() => {
    const fetchMapsKey = async () => {
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
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]'
      );
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

      const script = document.createElement("script");
      // Use the recommended async loading pattern with loading=async parameter
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;

      // Set up load and error handlers before appending to DOM
      script.addEventListener("load", () => {
        // Ensure the API is fully loaded with all required properties
        const checkApiReady = () => {
          if (
            window.google &&
            window.google.maps &&
            window.google.maps.Map &&
            window.google.maps.MapTypeId &&
            window.google.maps.marker &&
            window.google.maps.marker.AdvancedMarkerElement
          ) {
            resolve();
          } else {
            // Wait a bit more for the API to fully initialize
            setTimeout(checkApiReady, 100);
          }
        };
        checkApiReady();
      });

      script.addEventListener("error", () => {
        reject(new Error("Failed to load Google Maps"));
      });

      document.head.appendChild(script);
    });
  }, []);

  // Initialize map
  const initializeMap = useCallback(async () => {
    if (!googleMapsKey || !mapRef.current) return;
    
    // Double-check that the DOM element is valid before passing to Google Maps
    const mapElement = mapRef.current;
    if (!(mapElement instanceof HTMLElement) || !mapElement.isConnected) {
      console.warn("Map DOM element is not ready or not connected");
      return;
    }

    try {
      await loadGoogleMapsScript(googleMapsKey);

      // Initialize map centered on start city
      const map = new google.maps.Map(mapElement, {
        zoom: 8,
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US, will be updated
        mapTypeId: "roadmap", // Use string constant instead of enum
        mapId: "routewise-map", // Required for AdvancedMarkerElement
        zoomControl: true,
        mapTypeControl: false,
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

      setIsLoading(false);
    } catch (err) {
      console.error("Map initialization error:", err);
      setError("Failed to initialize map");
      setIsLoading(false);
    }
  }, [googleMapsKey, loadGoogleMapsScript]);

  // Verify city exists using geocoding
  const verifyCity = useCallback((cityName: string): Promise<boolean> => {
    if (!cityName?.trim()) return Promise.resolve(false);
    
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ address: cityName }, (results, status) => {
        const isValid = status === 'OK' && results && results.length > 0;
        console.log(`City verification for "${cityName}":`, isValid);
        resolve(isValid);
      });
    });
  }, []);

  // Load route with waypoints
  const loadRoute = useCallback(async () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;

    // First verify cities exist to avoid Google Directions NOT_FOUND errors
    console.log('Verifying cities before routing...');
    const [startValid, endValid] = await Promise.all([
      verifyCity(startCity),
      verifyCity(endCity)
    ]);

    if (!startValid) {
      console.warn(`Start city "${startCity}" could not be found`);
      setError(`Could not find location "${startCity}". Please check the city name.`);
      return;
    }

    if (!endValid) {
      console.warn(`End city "${endCity}" could not be found`);
      setError(`Could not find location "${endCity}". Please check the city name.`);
      return;
    }

    console.log('Cities verified successfully, calculating route...');

    const waypoints = checkpoints.map((checkpoint) => ({
      location: checkpoint,
      stopover: true,
    }));

    const request: google.maps.DirectionsRequest = {
      origin: startCity,
      destination: endCity,
      waypoints: waypoints,
      optimizeWaypoints: false,
      travelMode: "DRIVING" as google.maps.TravelMode,
    };

    try {
      const result = await new Promise<google.maps.DirectionsResult>(
        (resolve, reject) => {
          directionsServiceRef.current!.route(request, (result, status) => {
            if (status === "OK" && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          });
        }
      );

      directionsRendererRef.current.setDirections(result);

      // Add custom markers for start, end, and waypoints
      addRouteMarkers(result);
    } catch (err) {
      console.error("Failed to load route:", err);
      if (err.message.includes('NOT_FOUND')) {
        setError(`No driving route found between ${startCity} and ${endCity}. Try different cities or check spelling.`);
      } else {
        setError("Failed to calculate route. Please try again.");
      }
    }
  }, [startCity, endCity, checkpoints, verifyCity]);

  // Add markers for route points
  const addRouteMarkers = (directionsResult: google.maps.DirectionsResult) => {
    if (!mapInstanceRef.current) return;

    const route = directionsResult.routes[0];
    if (!route) return;

    // Clear existing route markers
    markersRef.current.forEach((marker) => (marker.map = null));
    markersRef.current = [];

    // Create start marker element
    const startElement = document.createElement("div");
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
    startElement.textContent = "S";

    // Add start marker
    const startMarker = new google.maps.marker.AdvancedMarkerElement({
      position: route.legs[0].start_location,
      map: mapInstanceRef.current,
      title: `Start: ${startCity}`,
      content: startElement,
    });

    // Create end marker element
    const endElement = document.createElement("div");
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
    endElement.textContent = "E";

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
        const checkpointElement = document.createElement("div");
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
    
    console.log('Creating POI markers:', pois.length, 'POIs');

    // Remove markers for POIs that no longer exist
    const currentPoiIds = new Set(pois.map((poi) => poi.placeId || poi.id));
    poiMarkersRef.current.forEach((marker, poiId) => {
      if (!currentPoiIds.has(poiId)) {
        marker.map = null;
        poiMarkersRef.current.delete(poiId);
      }
    });

    pois.forEach((poi) => {
      console.log('Processing POI:', poi.name, 'has address:', !!poi.address);
      if (!poi.address) return;

      // Skip if marker already exists
      const poiIdentifier = poi.placeId || poi.id;
      if (poiMarkersRef.current.has(poiIdentifier)) return;

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: poi.address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const isSelected = selectedPoiIds.includes(poi.id);
          const isHovered =
            hoveredPoi &&
            (hoveredPoi.placeId || hoveredPoi.id) === (poi.placeId || poi.id);

          // Create marker element
          const markerElement = createMarkerElement(
            poi.category,
            poi,
            isSelected,
            isHovered
          );

          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: results[0].geometry.location,
            map: mapInstanceRef.current,
            title: poi.name,
            content: markerElement,
          });

          // Add click listener
          marker.addListener("click", () => {
            if (onPoiClick) {
              onPoiClick(poi);
            }

            // Show info window with image and Add to Trip functionality
            if (infoWindowRef.current) {
              const isAddedToTrip = isInTrip(poi);
              const isCurrentlyAdding = isAddingToTrip; // Get current loading state
              
              const content = `
                <div class="p-3 max-w-sm">
                  ${poi.imageUrl ? `
                    <img 
                      src="${poi.imageUrl}" 
                      alt="${poi.name}" 
                      class="w-full h-32 object-cover rounded mb-2"
                    />
                  ` : ''}
                  <h3 class="font-semibold text-base mb-1">${poi.name}</h3>
                  <p class="text-xs text-gray-600 capitalize mb-2">${poi.category}</p>
                  ${poi.description ? `<p class="text-sm text-gray-700 mb-2">${poi.description}</p>` : ''}
                  <div class="flex items-center text-xs mb-1">
                    <span class="text-yellow-500">⭐</span>
                    <span class="ml-1">${poi.rating} (${poi.reviewCount} reviews)</span>
                  </div>
                  ${poi.address ? `<p class="text-xs text-gray-500 mb-3">${poi.address}</p>` : ''}
                  
                  <div class="flex justify-center">
                    <button
                      onclick="window.addPoiToTrip('${poi.placeId || poi.id}')"
                      ${isAddedToTrip ? 'disabled' : ''}
                      class="py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                        isAddedToTrip
                          ? 'bg-purple-100 text-purple-700 border border-purple-200 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md cursor-pointer'
                      }"
                      id="add-to-trip-btn-${poi.placeId || poi.id}"
                    >
                      ${isAddedToTrip ? 
                          '✓ In Trip' : 
                          '+ Add to Trip'
                      }
                    </button>
                  </div>
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

    pois.forEach((poi) => {
      const poiIdentifier = poi.placeId || poi.id;
      const marker = poiMarkersRef.current.get(poiIdentifier);
      if (marker) {
        const isSelected = selectedPoiIds.includes(poi.id);
        const isHovered =
          hoveredPoi && (hoveredPoi.placeId || hoveredPoi.id) === poiIdentifier;

        // Create new marker element with updated state
        const newMarkerElement = createMarkerElement(
          poi.category,
          poi,
          isSelected,
          isHovered
        );
        marker.content = newMarkerElement;
      }
    });
  }, [pois, selectedPoiIds, hoveredPoi]);

  // Setup global function for Add to Trip functionality
  useEffect(() => {
    (window as any).addPoiToTrip = (poiIdentifier: string | number) => {
      // Find the POI by placeId or id
      const poi = pois.find(p => (p.placeId || p.id) === poiIdentifier);
      if (poi && !isInTrip(poi) && !isAddingToTrip) {
        // Update button to show loading state
        const button = document.getElementById(`add-to-trip-btn-${poiIdentifier}`);
        if (button) {
          button.innerHTML = '⏳ Adding...';
          button.disabled = true;
          button.className = button.className.replace(
            'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md cursor-pointer',
            'bg-purple-400 text-white cursor-not-allowed'
          );
        }
        
        // Add to trip
        addToTrip(poi);
        
        // The InfoWindow will be closed and updated by the trip state change
        setTimeout(() => {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
        }, 1000); // Give time for success toast
      }
    };

    return () => {
      delete (window as any).addPoiToTrip;
    };
  }, [pois, addToTrip, isInTrip, isAddingToTrip]);

  // Set mounted state when component mounts
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Initialize map when API key is available and component is mounted
  useEffect(() => {
    if (googleMapsKey && isMounted && mapRef.current) {
      // Add a small delay to ensure DOM is fully stable
      const timeoutId = setTimeout(() => {
        initializeMap();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [googleMapsKey, isMounted, initializeMap]);

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
      poiMarkersRef.current.forEach((marker) => (marker.map = null));
      poiMarkersRef.current.clear();

      // Clear route markers
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
    };
  }, []);

  if (error) {
    return (
      <div
        className={`bg-gradient-to-br from-red-50 to-pink-100 border border-red-200 ${className}`}
        style={{ height }}
      >
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

  const googleMapsDirectUrl =
    checkpoints.length > 0
      ? `https://www.google.com/maps/dir/${encodeURIComponent(
          startCity
        )}/${checkpoints
          .map((c) => encodeURIComponent(c))
          .join("/")}/${encodeURIComponent(endCity)}`
      : `https://www.google.com/maps/dir/${encodeURIComponent(
          startCity
        )}/${encodeURIComponent(endCity)}`;

  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-slate-200 ${className}`}
      style={{ height }}
    >
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
        <div className="text-xs font-semibold text-slate-700 mb-2">
          Map Legend
        </div>
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
