import { useState, useEffect } from 'react';
import { MapPin, Flag, Clock, Route, CheckCircle, Navigation, Save, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import type { Poi } from '@/types/schema';

interface ItineraryComponentProps {
  startCity: string;
  endCity: string;
  checkpoints: string[];
  pois: Poi[];
  onUpdateSelectedPois: (selectedIds: number[]) => void;
  onSaveRoute: () => void;
  poisCount: number;
}

interface RouteData {
  distance: string;
  duration: string;
  start_address: string;
  end_address: string;
  polyline: string;
  route_points: { lat: number; lng: number }[];
}

interface ItineraryStop {
  type: 'city' | 'poi';
  name: string;
  description?: string;
  estimatedTime?: string;
  travelTimeToNext?: string;
  category?: string;
  rating?: string;
  poi?: Poi;
  distanceFromStart?: number;
  coordinates?: { lat: number; lng: number };
}

export default function ItineraryComponent({ 
  startCity, 
  endCity, 
  checkpoints, 
  pois, 
  onUpdateSelectedPois,
  onSaveRoute,
  poisCount
}: ItineraryComponentProps) {
  const [selectedPoiIds, setSelectedPoiIds] = useState<Set<number>>(new Set());
  const [poisWithDistances, setPoisWithDistances] = useState<Poi[]>([]);

  // Fetch actual route data from backend
  const { data: routeData, isLoading: routeLoading } = useQuery<RouteData>({
    queryKey: ['/api/route', startCity, endCity],
    queryFn: async () => {
      const params = new URLSearchParams({
        origin: startCity,
        destination: endCity,
      });
      const response = await fetch(`/api/route?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch route data');
      }
      return response.json();
    },
    enabled: !!(startCity && endCity),
  });

  // Calculate POI positions along route when route data is available
  useEffect(() => {
    if (routeData?.route_points && pois.length > 0) {
      const poisWithPositions = pois.map(poi => {
        // Extract coordinates from POI (you might need to adjust based on your data structure)
        const poiCoords = extractPoiCoordinates(poi);
        
        if (poiCoords) {
          const distanceFromStart = calculateDistanceAlongRoute(
            routeData.route_points,
            poiCoords
          );
          
          return {
            ...poi,
            distanceFromStart,
            coordinates: poiCoords
          };
        }
        
        return poi;
      });

      // Sort POIs by distance from start
      const sortedPois = poisWithPositions
        .filter(poi => poi.distanceFromStart !== undefined)
        .sort((a, b) => (a.distanceFromStart || 0) - (b.distanceFromStart || 0));

      setPoisWithDistances(sortedPois);
    }
  }, [routeData, pois]);

  // Extract coordinates from POI data
  const extractPoiCoordinates = (poi: Poi): { lat: number; lng: number } | null => {
    // This depends on your POI data structure
    // You might have coordinates stored differently
    if (poi.address) {
      // In a real implementation, you'd geocode the address
      // For now, return null to use fallback logic
      return null;
    }
    return null;
  };

  // Calculate distance along route to POI
  const calculateDistanceAlongRoute = (
    routePoints: { lat: number; lng: number }[],
    poiCoords: { lat: number; lng: number }
  ): number => {
    let minDistance = Infinity;
    let closestPointIndex = 0;
    let totalDistance = 0;

    // Find closest point on route to POI
    for (let i = 0; i < routePoints.length; i++) {
      const distance = calculateHaversineDistance(routePoints[i], poiCoords);
      if (distance < minDistance) {
        minDistance = distance;
        closestPointIndex = i;
      }
    }

    // Calculate cumulative distance to closest point
    for (let i = 0; i < closestPointIndex; i++) {
      if (i < routePoints.length - 1) {
        totalDistance += calculateHaversineDistance(routePoints[i], routePoints[i + 1]);
      }
    }

    return totalDistance;
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateHaversineDistance = (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Generate time estimates based on route progress
  const estimateTimeFromDistance = (distanceKm: number, totalDistanceKm: number): string => {
    if (!routeData?.duration) return 'Unknown';
    
    // Parse duration from Google format (e.g., \"3 hours 45 mins\")
    const durationMatch = routeData.duration.match(/(\\d+)\\s*hour?s?\\s*(\\d+)?\\s*min?s?/);
    if (!durationMatch) return 'Unknown';
    
    const hours = parseInt(durationMatch[1]) || 0;
    const minutes = parseInt(durationMatch[2]) || 0;
    const totalMinutes = hours * 60 + minutes;
    
    // Calculate progress percentage
    const progressPercent = distanceKm / totalDistanceKm;
    const estimatedMinutes = Math.round(totalMinutes * progressPercent);
    
    const startTime = 9 * 60; // 9:00 AM in minutes
    const currentTime = startTime + estimatedMinutes;
    
    const displayHours = Math.floor(currentTime / 60) % 24;
    const displayMinutes = currentTime % 60;
    
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}`;
  };

  // Build smart itinerary with real positioning
  const buildSmartItinerary = (): ItineraryStop[] => {
    const stops: ItineraryStop[] = [];
    
    if (!routeData) {
      // Fallback to basic structure if no route data
      return buildBasicItinerary();
    }

    // Parse total distance
    const totalDistanceMatch = routeData.distance.match(/(\\d+\\.?\\d*)/);
    const totalDistanceKm = totalDistanceMatch ? parseFloat(totalDistanceMatch[1]) : 100;

    // Start city
    stops.push({
      type: 'city',
      name: startCity,
      description: `Starting point • ${routeData.distance} • ${routeData.duration}`,
      estimatedTime: '9:00 AM',
      distanceFromStart: 0
    });

    // Insert POIs and checkpoints in order of route progression
    const allStops = [
      ...poisWithDistances.map(poi => ({
        type: 'poi' as const,
        name: poi.name,
        description: poi.description || '',
        category: poi.category,
        rating: poi.rating,
        poi: poi,
        distanceFromStart: poi.distanceFromStart || 0,
        estimatedTime: estimateTimeFromDistance(poi.distanceFromStart || 0, totalDistanceKm)
      })),
      ...checkpoints.map((checkpoint, index) => ({
        type: 'city' as const,
        name: checkpoint,
        description: 'Planned checkpoint',
        distanceFromStart: totalDistanceKm * (0.3 + index * 0.3), // Rough estimate
        estimatedTime: estimateTimeFromDistance(totalDistanceKm * (0.3 + index * 0.3), totalDistanceKm)
      }))
    ].sort((a, b) => a.distanceFromStart - b.distanceFromStart);

    stops.push(...allStops);

    // End city
    stops.push({
      type: 'city',
      name: endCity,
      description: 'Final destination',
      estimatedTime: estimateTimeFromDistance(totalDistanceKm, totalDistanceKm),
      distanceFromStart: totalDistanceKm
    });

    // Calculate travel times between stops
    for (let i = 0; i < stops.length - 1; i++) {
      const currentDistance = stops[i].distanceFromStart || 0;
      const nextDistance = stops[i + 1].distanceFromStart || 0;
      const segmentDistance = nextDistance - currentDistance;
      
      if (segmentDistance > 0) {
        const estimatedMinutes = Math.round(segmentDistance * 1.2); // Rough estimate: 1.2 min per km
        stops[i].travelTimeToNext = `${estimatedMinutes} min`;
      }
    }

    return stops;
  };

  // Fallback basic itinerary structure
  const buildBasicItinerary = (): ItineraryStop[] => {
    const stops: ItineraryStop[] = [];
    
    stops.push({
      type: 'city',
      name: startCity,
      description: 'Starting point of your journey',
      estimatedTime: '9:00 AM'
    });

    checkpoints.forEach((checkpoint, index) => {
      stops.push({
        type: 'city',
        name: checkpoint,
        description: 'Checkpoint stop',
        estimatedTime: `${11 + index * 2}:00 ${index < 2 ? 'AM' : 'PM'}`
      });
    });

    stops.push({
      type: 'city',
      name: endCity,
      description: 'Final destination',
      estimatedTime: '4:30 PM'
    });

    return stops;
  };

  const handlePoiToggle = (poi: Poi, checked: boolean) => {
    const newSelected = new Set(selectedPoiIds);
    
    if (checked && poi.id) {
      newSelected.add(poi.id);
    } else if (poi.id) {
      newSelected.delete(poi.id);
    }
    
    setSelectedPoiIds(newSelected);
    onUpdateSelectedPois(Array.from(newSelected));
  };

  const itineraryStops = buildSmartItinerary();
  const cityStops = itineraryStops.filter(stop => stop.type === 'city');
  const selectedPois = itineraryStops.filter(stop => 
    stop.type === 'poi' && stop.poi?.id && selectedPoiIds.has(stop.poi.id)
  );

  if (routeLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Calculating Your Route...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Your Complete Itinerary
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {routeData ? 
                `${routeData.distance} • ${routeData.duration} • ${selectedPoiIds.size} stops selected` :
                `Journey from ${startCity} to ${endCity} • ${selectedPoiIds.size} stops selected`
              }
            </p>
          </div>
          <Button
            onClick={onSaveRoute}
            disabled={poisCount === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Route
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Route Overview */}
          {routeData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Navigation className="h-4 w-4" />
                <span className="font-medium">Route Overview</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Total Distance:</span> {routeData.distance}
                </div>
                <div>
                  <span className="text-blue-600">Estimated Time:</span> {routeData.duration}
                </div>
              </div>
            </div>
          )}

          {/* City Route */}
          <div>
            <h3 className="font-medium mb-4">Main Route</h3>
            <div className="overflow-x-auto pb-4">
              <div className="relative flex items-center justify-between min-w-full">
                {/* Connector Line - Behind Icons */}
                {cityStops.length === 2 && (
                  <div className="absolute inset-x-0 top-6 flex items-center justify-center pointer-events-none">
                    <div className="w-full max-w-[calc(100%-6rem)] h-0.5 bg-blue-300"></div>
                  </div>
                )}
                
                {cityStops.map((stop, index) => (
                  <div key={`city-${index}`} className="flex flex-col items-center relative z-10">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white">
                      {index === 0 ? (
                        <MapPin className="h-6 w-6 text-blue-600" />
                      ) : index === cityStops.length - 1 ? (
                        <Flag className="h-6 w-6 text-green-600" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    
                    {/* Stop Info */}
                    <div className="mt-3 text-center max-w-[150px]">
                      <h4 className="font-semibold text-sm">{stop.name}</h4>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{stop.estimatedTime}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{stop.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Available POIs */}
          <div>
            <h3 className="font-medium mb-4">Available Stops Along Route</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {poisWithDistances.map((poi) => (
                <PoiCheckboxItem 
                  key={poi.id} 
                  poi={poi} 
                  isSelected={selectedPoiIds.has(poi.id!)}
                  onToggle={handlePoiToggle}
                  estimatedTime={estimateTimeFromDistance(
                    poi.distanceFromStart || 0, 
                    routeData ? parseFloat(routeData.distance) || 100 : 100
                  )}
                />
              ))}
            </div>
          </div>

          {/* Selected POIs Summary */}
          {selectedPois.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Your Selected Stops</h3>
              <div className="space-y-2">
                {selectedPois.map((stop) => (
                  <div key={stop.poi?.id} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                    <div>
                      <span className="font-medium text-green-800">{stop.name}</span>
                      <span className="ml-2 text-sm text-green-600">({stop.category})</span>
                    </div>
                    <span className="text-sm text-green-600">{stop.estimatedTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Trip Summary</p>
                <p className="text-sm text-muted-foreground">
                  {cityStops.length} cities • {selectedPoiIds.size} attractions selected
                </p>
              </div>
              <Button 
                className="gap-2"
                disabled={selectedPoiIds.size === 0}
                onClick={() => {
                  // Here you could trigger route recalculation with selected POIs
                  console.log('Updating route with selected POIs:', Array.from(selectedPoiIds));
                }}
              >
                <CheckCircle className="h-4 w-4" />
                Update Route ({selectedPoiIds.size})
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced POI checkbox item with time estimate
interface PoiCheckboxItemProps {
  poi: Poi;
  isSelected: boolean;
  onToggle: (poi: Poi, checked: boolean) => void;
  estimatedTime?: string;
}

function PoiCheckboxItem({ poi, isSelected, onToggle, estimatedTime }: PoiCheckboxItemProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
      isSelected 
        ? 'border-green-300 bg-green-50' 
        : 'border-slate-200 hover:bg-slate-50'
    }`}>
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onToggle(poi, checked as boolean)}
      />
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm truncate">{poi.name}</p>
          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
            {poi.category}
          </span>
          {poi.rating && (
            <span className="text-xs text-yellow-600">
              ⭐ {poi.rating}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          {poi.address && (
            <p className="text-xs text-muted-foreground truncate flex-1">{poi.address}</p>
          )}
          {estimatedTime && (
            <span className="text-xs text-blue-600 ml-2">{estimatedTime}</span>
          )}
        </div>
      </div>
    </div>
  );
}