import { useState } from 'react';
import { MapPin, Flag, Clock, Route, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Poi } from '@/types/schema';

interface ItineraryComponentProps {
  startCity: string;
  endCity: string;
  checkpoints: string[];
  pois: Poi[];
  onUpdateSelectedPois: (selectedIds: number[]) => void;
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
  isSelected?: boolean;
}

export default function ItineraryComponent({ 
  startCity, 
  endCity, 
  checkpoints, 
  pois, 
  onUpdateSelectedPois 
}: ItineraryComponentProps) {
  const [selectedPoiIds, setSelectedPoiIds] = useState<Set<number>>(new Set());

  // Generate mock travel times (in real app, use Google Directions API)
  const generateTravelTime = (index: number): string => {
    const times = ['45 min', '1 hr 15 min', '2 hrs', '1 hr 30 min', '3 hrs', '45 min'];
    return times[index % times.length] || '1 hr';
  };

  // Build itinerary stops in order
  const buildItinerary = (): ItineraryStop[] => {
    const stops: ItineraryStop[] = [];
    
    // Start city
    stops.push({
      type: 'city',
      name: startCity,
      description: 'Starting point of your journey',
      estimatedTime: '9:00 AM',
      travelTimeToNext: checkpoints.length > 0 ? generateTravelTime(0) : generateTravelTime(0)
    });

    // Add checkpoints
    checkpoints.forEach((checkpoint, index) => {
      stops.push({
        type: 'city',
        name: checkpoint,
        description: 'Checkpoint stop',
        estimatedTime: '11:30 AM', // Mock time
        travelTimeToNext: index < checkpoints.length - 1 ? generateTravelTime(index + 1) : generateTravelTime(index + 1)
      });
    });

    // End city
    stops.push({
      type: 'city',
      name: endCity,
      description: 'Final destination',
      estimatedTime: '4:30 PM', // Mock time
    });

    return stops;
  };

  // Group POIs by location relevance
  const groupPoisByLocation = () => {
    const grouped = {
      start: pois.filter(poi => poi.timeFromStart?.includes('1') || poi.timeFromStart?.includes('2')).slice(0, 3),
      middle: pois.filter(poi => poi.timeFromStart?.includes('3') || poi.timeFromStart?.includes('4')).slice(0, 3),
      end: pois.filter(poi => poi.timeFromStart?.includes('5') || poi.timeFromStart?.includes('6')).slice(0, 3),
      checkpoints: pois.filter(poi => poi.timeFromStart?.startsWith('In ')),
    };
    return grouped;
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

  const itineraryStops = buildItinerary();
  const groupedPois = groupPoisByLocation();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Your Complete Itinerary
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Step-by-step journey from {startCity} to {endCity}
          {selectedPoiIds.size > 0 && ` • ${selectedPoiIds.size} stops selected`}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {itineraryStops.map((stop, index) => (
            <div key={index} className="relative">
              {/* Connection line */}
              {index < itineraryStops.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-slate-300"></div>
              )}
              
              {/* Stop marker */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  {index === 0 ? (
                    <MapPin className="h-6 w-6 text-blue-600" />
                  ) : index === itineraryStops.length - 1 ? (
                    <Flag className="h-6 w-6 text-green-600" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{stop.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{stop.estimatedTime}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{stop.description}</p>
                  
                  {/* Show relevant POIs for this stop */}
                  {index === 0 && groupedPois.start.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Near {startCity}:</h4>
                      <div className="space-y-2">
                        {groupedPois.start.map((poi) => (
                          <PoiCheckboxItem 
                            key={poi.id} 
                            poi={poi} 
                            isSelected={selectedPoiIds.has(poi.id!)}
                            onToggle={handlePoiToggle}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Middle stops */}
                  {index > 0 && index < itineraryStops.length - 1 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">In {stop.name}:</h4>
                      <div className="space-y-2">
                        {groupedPois.checkpoints
                          .filter(poi => poi.timeFromStart?.includes(stop.name))
                          .map((poi) => (
                            <PoiCheckboxItem 
                              key={poi.id} 
                              poi={poi} 
                              isSelected={selectedPoiIds.has(poi.id!)}
                              onToggle={handlePoiToggle}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* End city POIs */}
                  {index === itineraryStops.length - 1 && groupedPois.end.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Near {endCity}:</h4>
                      <div className="space-y-2">
                        {groupedPois.end.map((poi) => (
                          <PoiCheckboxItem 
                            key={poi.id} 
                            poi={poi} 
                            isSelected={selectedPoiIds.has(poi.id!)}
                            onToggle={handlePoiToggle}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Travel time to next stop */}
                  {stop.travelTimeToNext && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Route className="h-4 w-4" />
                      <span>Drive {stop.travelTimeToNext} to next stop</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Summary */}
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Trip Summary</p>
                <p className="text-sm text-muted-foreground">
                  {itineraryStops.length} stops • {selectedPoiIds.size} places to visit
                </p>
              </div>
              <Button 
                variant="outline" 
                className="gap-2"
                disabled={selectedPoiIds.size === 0}
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

// POI checkbox item component
interface PoiCheckboxItemProps {
  poi: Poi;
  isSelected: boolean;
  onToggle: (poi: Poi, checked: boolean) => void;
}

function PoiCheckboxItem({ poi, isSelected, onToggle }: PoiCheckboxItemProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onToggle(poi, checked as boolean)}
      />
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
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
        {poi.address && (
          <p className="text-xs text-muted-foreground truncate">{poi.address}</p>
        )}
      </div>
    </div>
  );
}