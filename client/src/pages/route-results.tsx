import { useLocation } from "wouter";
import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, MapPin, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Poi } from "@shared/schema";
import PoiCard from "@/components/poi-card";
import ItineraryComponent from "@/components/itinerary-component-enhanced";
import { InteractiveMap } from "@/components/interactive-map";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface RouteData {
  startCity: string;
  endCity: string;
}

// Helper function to extract city from POI data
const extractCityFromPoi = (poi: Poi): string | null => {
  // For checkpoint POIs, use timeFromStart
  if (poi.timeFromStart && poi.timeFromStart.startsWith('In ')) {
    return poi.timeFromStart.replace('In ', '').toLowerCase().trim();
  }
  
  // For route POIs, try to extract city from address
  if (poi.address) {
    // Split address and look for city, state pattern
    const addressParts = poi.address.split(',').map(part => part.trim());
    
    // Look for a part that contains a state abbreviation (2 uppercase letters)
    const statePattern = /\b[A-Z]{2}\b/;
    const stateIndex = addressParts.findIndex(part => statePattern.test(part));
    
    if (stateIndex > 0) {
      // City should be the part before the state
      const cityPart = addressParts[stateIndex - 1];
      // Remove any numbers or street suffixes to get just the city name
      const cityMatch = cityPart.match(/([A-Za-z\s]+)/);
      if (cityMatch) {
        const city = cityMatch[1].trim().toLowerCase();
        // Filter out obvious street names
        if (!city.match(/\b(street|road|avenue|drive|boulevard|lane|way|place|court|circle)\b/i)) {
          return city;
        }
      }
    }
    
    // Fallback: look for common city names in the address
    const commonCities = [
      'austin', 'dallas', 'houston', 'san antonio', 'fort worth', 'el paso',
      'arlington', 'corpus christi', 'plano', 'lubbock', 'irving', 'garland',
      'amarillo', 'grand prairie', 'brownsville', 'pasadena', 'mesquite',
      'mckinney', 'carrollton', 'beaumont', 'abilene', 'round rock', 'richardson',
      'midland', 'lewisville', 'college station', 'pearland', 'denton', 'sugar land'
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

export default function RouteResults() {
  const [, setLocation] = useLocation();
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [checkpoints, setCheckpoints] = useState<string[]>([]);
  const [showCheckpointForm, setShowCheckpointForm] = useState<boolean>(false);
  const [selectedPoiIds, setSelectedPoiIds] = useState<number[]>([]);
  const [newCheckpoint, setNewCheckpoint] = useState<string>('');
  const { toast } = useToast();

  // Fetch Google Maps API key
  const { data: mapsApiData, isLoading: mapsApiLoading } = useQuery<{ apiKey: string }>({
    queryKey: ["/api/maps-key"],
  });

  // Fetch POIs for things to do along the specific route
  const { data: pois, isLoading: poisLoading } = useQuery<Poi[]>({
    queryKey: ["/api/pois", routeData?.startCity, routeData?.endCity],
    queryFn: async () => {
      if (!routeData) return [];
      const params = new URLSearchParams({
        start: routeData.startCity,
        end: routeData.endCity
      });
      const response = await fetch(`/api/pois?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch places along route');
      }
      return response.json();
    },
    enabled: !!routeData, // Only run query when we have route data
  });

  // Fetch POIs for checkpoint cities
  const { data: checkpointPois, isLoading: checkpointPoisLoading } = useQuery<Poi[]>({
    queryKey: ["/api/checkpoint-pois", checkpoints],
    queryFn: async () => {
      if (checkpoints.length === 0) return [];
      
      const allCheckpointPois: Poi[] = [];
      
      // Fetch places for each checkpoint
      for (const checkpoint of checkpoints) {
        try {
          const response = await fetch(`/api/pois?checkpoint=${encodeURIComponent(checkpoint)}`);
          if (response.ok) {
            const checkpointPlaces: Poi[] = await response.json();
            allCheckpointPois.push(...checkpointPlaces);
          }
        } catch (error) {
          console.error(`Failed to fetch places for checkpoint ${checkpoint}:`, error);
        }
      }
      
      return allCheckpointPois;
    },
    enabled: checkpoints.length > 0,
  });

  // Combine route POIs and checkpoint POIs
  const allPois = [...(pois || []), ...(checkpointPois || [])];
  
  // Remove duplicates based on placeId
  const uniquePois = allPois.filter((poi, index, self) => 
    index === self.findIndex(p => p.placeId === poi.placeId)
  );

  // Generate available cities from actual POI data instead of hardcoded route cities
  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    
    // Add route cities
    if (routeData) {
      citySet.add(routeData.startCity.toLowerCase());
      citySet.add(routeData.endCity.toLowerCase());
    }
    
    // Add checkpoint cities
    checkpoints.forEach(checkpoint => {
      citySet.add(checkpoint.toLowerCase());
    });
    
    // Debug: log some POI data to understand the structure
    if (uniquePois.length > 0) {
      console.log('Sample POI data:', uniquePois.slice(0, 3).map(poi => ({
        name: poi.name,
        address: poi.address,
        timeFromStart: poi.timeFromStart,
        extractedCity: extractCityFromPoi(poi)
      })));
    }
    
    // Add cities extracted from POI data
    uniquePois.forEach(poi => {
      const city = extractCityFromPoi(poi);
      if (city) {
        citySet.add(city);
      }
    });
    
    const cities = Array.from(citySet).map(city => 
      city.charAt(0).toUpperCase() + city.slice(1)
    ).sort();
    
    console.log('Available cities:', cities);
    return cities;
  }, [uniquePois, routeData, checkpoints]);

  const filteredPois = uniquePois.filter(poi => {
    const categoryMatch = selectedCategory === 'all' || poi.category === selectedCategory;
    
    // City filtering
    let cityMatch = selectedCity === 'all';
    
    if (!cityMatch && selectedCity !== 'all') {
      const poiCity = extractCityFromPoi(poi);
      
      if (poiCity) {
        cityMatch = poiCity === selectedCity.toLowerCase();
      } else {
        // If we can't determine the POI's city, include it for route cities
        const routeCitiesLower = [
          routeData?.startCity.toLowerCase(), 
          routeData?.endCity.toLowerCase()
        ].filter(Boolean);
        
        cityMatch = routeCitiesLower.includes(selectedCity.toLowerCase());
      }
    }
    
    return categoryMatch && cityMatch;
  });

  const handleUpdateSelectedPois = (selectedIds: number[]) => {
    setSelectedPoiIds(selectedIds);
    console.log('Selected POI IDs:', selectedIds);
  };

  const handlePoiClick = (poi: Poi) => {
    console.log('POI clicked:', poi.name);
    // Could show details modal or scroll to POI card
  };

  const handlePoiSelect = (poiId: number, selected: boolean) => {
    if (selected) {
      setSelectedPoiIds(prev => [...prev, poiId]);
    } else {
      setSelectedPoiIds(prev => prev.filter(id => id !== poiId));
    }
  };

  useEffect(() => {
    // Get route data from URL parameters or localStorage
    const searchParams = new URLSearchParams(window.location.search);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    if (start && end) {
      setRouteData({ startCity: start, endCity: end });
    } else {
      // Try to get from localStorage as fallback
      const savedData = localStorage.getItem('routeData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setRouteData(parsed);
        } catch {
          // If parsing fails, redirect to home
          setLocation('/');
        }
      } else {
        setLocation('/');
      }
    }
  }, [setLocation]);

  // Don't render anything until we have route data
  if (!routeData) {
    return null;
  }

  // Prepare waypoints for Google Maps embed
  const waypoints = checkpoints.join('|');
  
  const googleMapsDirectUrl = checkpoints.length > 0 
    ? `https://www.google.com/maps/dir/${encodeURIComponent(routeData.startCity)}/${checkpoints.map(c => encodeURIComponent(c)).join('/')}/${encodeURIComponent(routeData.endCity)}`
    : `https://www.google.com/maps/dir/${encodeURIComponent(routeData.startCity)}/${encodeURIComponent(routeData.endCity)}`;
  
  const googleMapsEmbedUrl = checkpoints.length > 0
    ? `https://www.google.com/maps/embed/v1/directions?key=${mapsApiData?.apiKey || ''}&origin=${encodeURIComponent(routeData.startCity)}&destination=${encodeURIComponent(routeData.endCity)}&waypoints=${encodeURIComponent(waypoints)}&mode=driving`
    : `https://www.google.com/maps/embed/v1/directions?key=${mapsApiData?.apiKey || ''}&origin=${encodeURIComponent(routeData.startCity)}&destination=${encodeURIComponent(routeData.endCity)}&mode=driving`;

  const handleSaveRoute = async () => {
    if (!routeData || uniquePois.length === 0) return;
    
    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startCity: routeData.startCity,
          endCity: routeData.endCity,
          poisIds: uniquePois.map(poi => poi.id),
          checkpoints: checkpoints,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save route');
      }

      const checkpointText = checkpoints.length > 0 ? ` with ${checkpoints.length} checkpoint${checkpoints.length > 1 ? 's' : ''}` : '';
      toast({
        title: "Route Saved!",
        description: `Your route from ${routeData.startCity} to ${routeData.endCity}${checkpointText} has been saved with ${uniquePois.length} places.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save route. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addCheckpoint = () => {
    if (newCheckpoint.trim() && !checkpoints.includes(newCheckpoint.trim())) {
      setCheckpoints([...checkpoints, newCheckpoint.trim()]);
      setNewCheckpoint('');
      setShowCheckpointForm(false);
      toast({
        title: "Checkpoint Added",
        description: `Added ${newCheckpoint.trim()} to your route`,
      });
    }
  };

  const removeCheckpoint = (checkpoint: string) => {
    setCheckpoints(checkpoints.filter(c => c !== checkpoint));
    toast({
      title: "Checkpoint Removed",
      description: `Removed ${checkpoint} from your route`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="flex items-center text-slate-600 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSaveRoute}
                disabled={!pois || pois.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Save Route
              </Button>
            </div>

          {/* Itinerary Component */}
          {uniquePois.length > 0 && (
            <ItineraryComponent
              startCity={routeData.startCity}
              endCity={routeData.endCity}
              checkpoints={checkpoints}
              pois={uniquePois}
              onUpdateSelectedPois={handleUpdateSelectedPois}
            />
          )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Route Info Card */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Main Route</h1>
                  <div className="flex items-center text-blue-100">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span className="text-lg">{routeData.startCity}</span>
                    <ArrowLeft className="h-5 w-5 mx-3 rotate-180" />
                    <Flag className="h-5 w-5 mr-2" />
                    <span className="text-lg">{routeData.endCity}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-100">Total Places Found</div>
                  <div className="text-3xl font-bold">{uniquePois.length}</div>
                  {checkpoints.length > 0 && (
                    <div className="text-xs text-blue-200">Including checkpoint places</div>
                  )}
                </div>
              </div>
            </div>

            {/* Checkpoints Section */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Checkpoints</h3>
                <Button
                  onClick={() => setShowCheckpointForm(!showCheckpointForm)}
                  variant="outline"
                  size="sm"
                >
                  {showCheckpointForm ? 'Cancel' : 'Add Checkpoint'}
                </Button>
              </div>

              {showCheckpointForm && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={newCheckpoint}
                    onChange={(e) => setNewCheckpoint(e.target.value)}
                    placeholder="Enter city or landmark"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addCheckpoint()}
                  />
                  <Button onClick={addCheckpoint} size="sm">
                    Add
                  </Button>
                </div>
              )}

              {checkpoints.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {checkpoints.map((checkpoint, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{checkpoint}</span>
                      <button
                        onClick={() => removeCheckpoint(checkpoint)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No checkpoints added. Add strategic stops to customize your route.</p>
              )}
            </div>

            {/* Interactive Google Maps Component */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Interactive Route Map</h3>
                <div className="text-sm text-slate-600">
                  Click POI markers to view details
                </div>
              </div>
              
              <InteractiveMap
                startCity={routeData.startCity}
                endCity={routeData.endCity}
                checkpoints={checkpoints}
                pois={uniquePois}
                selectedPoiIds={selectedPoiIds}
                onPoiClick={handlePoiClick}
                onPoiSelect={handlePoiSelect}
                height="500px"
                className="w-full"
              />
            </div>
          </div>

          {/* POIs Display */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Amazing Places Along Your Route
            </h2>

            {(poisLoading || checkpointPoisLoading) && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!poisLoading && !checkpointPoisLoading && uniquePois.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Places Found</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  We couldn't find any places along this route. Try a different route or check back later as we add more locations.
                </p>
              </div>
            )}

            {uniquePois.length > 0 && (
              <>
                {/* Loading indicator for checkpoint places */}
                {checkpoints.length > 0 && checkpointPoisLoading && (
                  <div className="mb-4 text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                      Loading places from your checkpoints...
                    </div>
                  </div>
                )}

                {/* City Filters */}
                {availableCities.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-700 mb-3 text-center">Filter by City:</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button 
                        onClick={() => setSelectedCity('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedCity === 'all' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        All Cities ({uniquePois.length})
                      </button>
                      {availableCities.map((city) => {
                        const cityCount = uniquePois.filter(poi => {
                          const poiCity = extractCityFromPoi(poi);
                          return poiCity === city.toLowerCase() || 
                                 (routeData?.startCity.toLowerCase() === city.toLowerCase() && !poiCity) ||
                                 (routeData?.endCity.toLowerCase() === city.toLowerCase() && !poiCity);
                        }).length;
                        
                        return (
                          <button 
                            key={city}
                            onClick={() => setSelectedCity(city)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              selectedCity === city 
                                ? 'bg-green-600 text-white' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {city} ({cityCount})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category Filters */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-slate-700 mb-3 text-center">Filter by Category:</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button 
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === 'all' 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      All Categories ({filteredPois.length})
                    </button>
                    <button 
                      onClick={() => setSelectedCategory('restaurant')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === 'restaurant' 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Restaurants ({uniquePois.filter(p => p.category === 'restaurant').length})
                    </button>
                    <button 
                      onClick={() => setSelectedCategory('attraction')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === 'attraction' 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Attractions ({uniquePois.filter(p => p.category === 'attraction').length})
                    </button>
                    <button 
                      onClick={() => setSelectedCategory('park')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === 'park' 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Parks ({uniquePois.filter(p => p.category === 'park').length})
                    </button>
                    <button 
                      onClick={() => setSelectedCategory('scenic')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === 'scenic' 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Scenic ({uniquePois.filter(p => p.category === 'scenic').length})
                    </button>
                    <button 
                      onClick={() => setSelectedCategory('market')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === 'market' 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Markets ({uniquePois.filter(p => p.category === 'market').length})
                    </button>
                    <button 
                      onClick={() => setSelectedCategory('historic')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === 'historic' 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Historic ({uniquePois.filter(p => p.category === 'historic').length})
                    </button>
                  </div>
                </div>

                {/* Places Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPois.map((poi, index) => (
                    <PoiCard key={poi.placeId || poi.id || `poi-${index}`} poi={poi} />
                  ))}
                </div>
                
                {filteredPois.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-600">No places found with the selected filters. Try adjusting your city or category selection.</p>
                  </div>
                )}

                {/* Summary Stats */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {uniquePois.filter(p => p.category === 'restaurant').length}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">Restaurants</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {uniquePois.filter(p => p.category === 'attraction').length}
                    </div>
                    <div className="text-sm text-green-700 font-medium">Attractions</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-700">
                      {uniquePois.filter(p => p.category === 'park').length}
                    </div>
                    <div className="text-sm text-purple-700 font-medium">Parks & Nature</div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700">
                      {uniquePois.filter(p => parseFloat(p.rating) >= 4.5).length}
                    </div>
                    <div className="text-sm text-amber-700 font-medium">Highly Rated</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}