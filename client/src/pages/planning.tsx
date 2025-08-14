import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Check, LogIn, Save, X, FileText, Search, MapPin, Clock, Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-context";
import { authenticatedApiCall, API_CONFIG } from "@/lib/api-config";
import type { ItineraryPlace } from "@/types/itinerary";
import { getIdentifier } from "@/utils/itinerary";
import { DeveloperFab } from "@/components/developer-fab";
import ItineraryHeader from "@/components/ItineraryHeader";

export default function PlanningPage({ mapsApiKey }: { mapsApiKey?: string }) {
  const [, setLocation] = useLocation();

  // Day-based itinerary state
  const [days, setDays] = useState<Array<{ id: number; title: string; places: ItineraryPlace[] }>>([{ id: 1, title: "Day 1", places: [] }]);
  const [selectedDayId, setSelectedDayId] = useState<number>(1); // Track which day is selected for adding POIs
  const [availableFilter, setAvailableFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [tripTitle, setTripTitle] = useState("");
  const [savedTripId, setSavedTripId] = useState<number | null>(() => {
    console.log('🔄 Initial savedTripId state loading...');
    return null;
  });
  const [lastApiRequest, setLastApiRequest] = useState<{
    endpoint: string;
    method: string;
    body: string;
    timestamp: Date;
    status?: 'pending' | 'success' | 'error';
    response?: any;
  } | null>(null);

  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { tripPlaces } = useTripPlaces();
  
  // Debug trip places
  console.log('🎯 Planning page - trip places:', tripPlaces);

  // Load saved itinerary from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("itineraryData");
    console.log('📂 Loading from localStorage:', saved);
    if (saved) {
      try {
        const { days: rawDays, tripTitle: rawTitle, savedTripId: rawTripId } = JSON.parse(saved);
        console.log('📊 Parsed localStorage data:', { rawTripId, rawTitle, daysCount: rawDays?.length });
        if (Array.isArray(rawDays)) {
          setDays(rawDays);
          setTripTitle(rawTitle || "");
          setSavedTripId(rawTripId || null);
          console.log('✅ Set savedTripId to:', rawTripId || null);
        }
      } catch (e) {
        console.error('❌ Error parsing localStorage:', e);
      }
    } else {
      console.log('ℹ️ No itineraryData in localStorage');
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    const data = { days, tripTitle, savedTripId };
    console.log('💾 Saving to localStorage:', data);
    localStorage.setItem("itineraryData", JSON.stringify(data));
  }, [days, tripTitle, savedTripId]);

  // Get all places across all days for filtering
  const allItineraryPlaces = useMemo(() => 
    days.flatMap(day => day.places),
    [days]
  );

  // Available places from trip places hook, filtered out already added ones
  const availablePlaces: ItineraryPlace[] = useMemo(
    () => tripPlaces.filter(p => !allItineraryPlaces.find(ip => getIdentifier(ip) === getIdentifier(p))),
    [tripPlaces, allItineraryPlaces]
  );

  // Add place to the selected day's itinerary
  const handlePlaceAdd = (place: ItineraryPlace) => {
    const id = getIdentifier(place);
    const exists = allItineraryPlaces.find(p => getIdentifier(p) === id);
    if (exists) return;
    
    const selectedDayIndex = days.findIndex(day => day.id === selectedDayId);
    if (selectedDayIndex === -1) return; // Selected day not found
    
    const updated: ItineraryPlace = { 
      ...place, 
      dayIndex: selectedDayIndex, 
      scheduledTime: "09:00", 
      dayOrder: days[selectedDayIndex].places.length,
      notes: undefined 
    };
    
    setDays(prev => {
      const newDays = [...prev];
      newDays[selectedDayIndex] = {
        ...newDays[selectedDayIndex],
        places: [...newDays[selectedDayIndex].places, updated]
      };
      return newDays;
    });
  };

  // Remove place from itinerary
  const handlePlaceRemove = (placeId: string | number) => {
    setDays(prev => 
      prev.map(day => ({
        ...day,
        places: day.places.filter(p => getIdentifier(p) !== placeId)
      }))
    );
  };

  // Add new day
  const handleAddDay = () => {
    const newDayNumber = days.length + 1;
    const newDay = {
      id: newDayNumber,
      title: `Day ${newDayNumber}`,
      places: []
    };
    setDays(prev => [...prev, newDay]);
    // Auto-select the new day for adding POIs
    setSelectedDayId(newDayNumber);
  };

  // Remove day (only if more than one day exists)
  const handleRemoveDay = (dayId: number) => {
    if (days.length <= 1) return;
    setDays(prev => prev.filter(day => day.id !== dayId));
  };


  const handleGoBack = () => setLocation("/route-results");

  const handleClearAll = () => {
    if (window.confirm("Clear all destinations? This will clear your current itinerary.")) {
      setDays([{ id: 1, title: "Day 1", places: [] }]);
      setTripTitle("");
      setSavedTripId(null);
      setLastSavedAt(null);
      setLastApiRequest(null);
      
      // Clear localStorage
      localStorage.removeItem('itineraryData');
      localStorage.removeItem('tripPlaces');
      
      toast({
        title: "Itinerary Cleared",
        description: "You can now plan a new itinerary from scratch.",
      });
    }
  };

  const handleSaveTrip = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your trip.",
        variant: "destructive",
      });
      return;
    }

    if (allItineraryPlaces.length === 0) {
      toast({
        title: "No Places Added",
        description: "Add some places to your itinerary before saving.",
        variant: "destructive",
      });
      return;
    }

    // Validate trip title
    const finalTripTitle = tripTitle?.trim() || generateTripTitle();
    if (finalTripTitle === "My Trip" || finalTripTitle === "") {
      toast({
        title: "Trip Title Required",
        description: "Please enter a descriptive title for your trip.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Extract start and end locations from first and last places
      const firstPlace = allItineraryPlaces[0];
      const lastPlace = allItineraryPlaces[allItineraryPlaces.length - 1];
      
      // Get unique cities for checkpoints
      const cities = new Set<string>();
      const stops: string[] = [];
      
      allItineraryPlaces.forEach((p) => {
        const addr = p.address;
        if (addr) {
          const parts = addr.split(",");
          if (parts.length > 1) {
            const city = parts[parts.length - 2]?.trim();
            if (city) cities.add(city);
          }
        }
      });
      
      const cityList = Array.from(cities);
      const startCity = firstPlace?.address || cityList[0] || "Unknown";
      const endCity = lastPlace?.address || cityList[cityList.length - 1] || startCity;
      
      // Middle cities as stops (excluding start and end)
      if (cityList.length > 2) {
        stops.push(...cityList.slice(1, -1));
      }
      
      // Extract unique interests/categories
      const interests = Array.from(new Set(allItineraryPlaces.map(p => p.category)));
      
      // Create trip data structure for Phoenix backend (Method 1 - Direct)
      const tripData = {
        title: finalTripTitle,
        start_city: startCity,
        end_city: endCity,
        trip_type: "road-trip", // Valid trip type from schema
        is_public: false
      };

      // Determine if this is a new trip or update
      const isUpdate = savedTripId !== null;
      const endpoint = isUpdate ? `${API_CONFIG.ENDPOINTS.TRIPS}/${savedTripId}` : API_CONFIG.ENDPOINTS.TRIPS;
      const method = isUpdate ? 'PUT' : 'POST';
      
      console.log('💾 Save operation:', { 
        isUpdate, 
        savedTripId, 
        endpoint, 
        method 
      });

      // Capture API request details for FOB
      const requestBody = JSON.stringify({
        trip: tripData
      });

      const apiRequest = {
        endpoint,
        method,
        body: requestBody,
        timestamp: new Date(),
        status: 'pending' as const
      };

      setLastApiRequest(apiRequest);

      // Log to developer console
      if ((window as any).__devLog) {
        (window as any).__devLog('Itinerary Save', `API Request Started (${isUpdate ? 'Update' : 'Create'})`, {
          endpoint: apiRequest.endpoint,
          method: apiRequest.method,
          tripId: savedTripId,
          bodySize: requestBody.length,
          timestamp: apiRequest.timestamp.toISOString()
        });
      }

      // Use appropriate endpoint based on whether trip exists
      const response = await authenticatedApiCall<{ data: any }>(
        endpoint,
        {
          method,
          body: requestBody,
        }
      );

      // Update API request with success
      setLastApiRequest(prev => prev ? {
        ...prev,
        status: 'success',
        response: response
      } : null);

      if ((window as any).__devLog) {
        (window as any).__devLog('Itinerary Save', 'API Request Success', {
          responseReceived: true,
          responseData: response,
          isUpdate,
          totalTime: Date.now() - apiRequest.timestamp.getTime() + 'ms'
        });
      }

      // Store trip ID for future updates (only if this was a create operation)
      if (!isUpdate) {
        // Check different possible response structures
        const tripId = response.id || response.data?.id || response.trip?.id;
        if (tripId) {
          setSavedTripId(tripId);
          console.log('🎯 Trip ID saved:', tripId);
        } else {
          console.warn('⚠️ No trip ID found in response:', response);
        }
      }

      setLastSavedAt(new Date());
      toast({
        title: isUpdate ? "Trip Updated!" : "Trip Saved!",
        description: isUpdate 
          ? "Your itinerary changes have been saved successfully." 
          : "Your itinerary has been saved successfully.",
      });

      // Note: Keep localStorage to maintain trip ID for future updates
      // Only clear if user explicitly wants to start a new trip
      
      // Optionally redirect to trips list or saved trip view
      // setLocation(`/trips/${response.id}`);

    } catch (err) {
      // Update API request with error
      setLastApiRequest(prev => prev ? {
        ...prev,
        status: 'error',
        response: {
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      } : null);

      if ((window as any).__devLog) {
        (window as any).__devLog('Itinerary Save', 'API Request Error', {
          error: err instanceof Error ? err.message : 'Unknown error',
          errorObject: err
        });
      }

      console.error('Error saving trip:', err);
      toast({
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Failed to save trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateTripTitle = () => {
    if (allItineraryPlaces.length === 0) return "My Trip";
    const cities = new Set<string>();
    allItineraryPlaces.forEach((p) => {
      const addr = (p as any).address as string | undefined;
      if (!addr) return;
      const parts = addr.split(",");
      if (parts.length > 1) {
        const city = parts[parts.length - 2]?.trim();
        if (city) cities.add(city);
      }
    });
    const list = Array.from(cities);
    if (list.length === 0) return "My Trip";
    if (list.length === 1) return `${list[0]} Trip`;
    if (list.length === 2) return `${list[0]} to ${list[1]}`;
    return `${list[0]} to ${list[list.length - 1]} (+${list.length - 2} more)`;
  };

  // Filter available places based on search and category
  const filteredAvailablePlaces = useMemo(() => {
    let filtered = availablePlaces;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(place => 
        place.name?.toLowerCase().includes(query) ||
        place.address?.toLowerCase().includes(query) ||
        place.category?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (availableFilter !== "All") {
      filtered = filtered.filter(place => place.category === availableFilter);
    }
    
    return filtered;
  }, [availablePlaces, searchQuery, availableFilter]);
  
  // Get unique categories for filtering
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("All");
    availablePlaces.forEach(place => {
      if (place.category) cats.add(place.category);
    });
    return Array.from(cats);
  }, [availablePlaces]);
  
  // Calculate trip summary
  const tripSummary = useMemo(() => {
    const destinations = allItineraryPlaces.length;
    const cities = new Set<string>();
    
    allItineraryPlaces.forEach(place => {
      const addr = place.address;
      if (addr) {
        const parts = addr.split(",");
        if (parts.length > 1) {
          const city = parts[parts.length - 2]?.trim();
          if (city) cities.add(city);
        }
      }
    });
    
    return {
      destinations,
      cities: cities.size,
      days: days.length
    };
  }, [allItineraryPlaces, days]);

  if (tripPlaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Trip Places Found</CardTitle>
            <CardDescription>You need to add places to your trip first.</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <Button onClick={handleGoBack}>
              Back to Route Results
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <ItineraryHeader
        lastSavedAt={lastSavedAt}
        savedTripId={savedTripId}
        isSaving={isSaving}
        isAuthenticated={isAuthenticated}
        onSaveTrip={handleSaveTrip}
        onClearAll={handleClearAll}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-8">
          {/* Left Side - Itinerary */}
          <div className="w-96 space-y-4">
            {/* Trip Title */}
            <div>
              <Input
                placeholder="My Paris Trip"
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                className="font-medium text-lg h-12"
              />
              <div className="mt-2 flex items-center gap-2">
                {savedTripId && (
                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-3 w-3" />
                    Saved (ID: {savedTripId})
                  </span>
                )}
              </div>
            </div>
            
            {/* Day Cards */}
            <div className="space-y-4">
              {days.map((day, dayIndex) => {
                const isSelected = selectedDayId === day.id;
                return (
                  <Card key={day.id} className={`p-4 transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-primary bg-primary-50' : 'hover:shadow-md'
                  }`} onClick={() => setSelectedDayId(day.id)}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold">{day.title}</h2>
                        {isSelected && (
                          <Badge variant="default">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {days.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent day selection when clicking remove
                              handleRemoveDay(day.id);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            title="Remove day"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  
                  {day.places.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        {isSelected 
                          ? "Select locations from the right to add to this day"
                          : "Click this day to select it, then add locations"
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {day.places.map((place, placeIndex) => (
                        <Card key={getIdentifier(place)} className="p-3 hover:shadow-md transition-shadow border-l-4 border-l-primary">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                              placeIndex === 0 ? 'bg-green-600' : 
                              placeIndex === 1 ? 'bg-emerald-600' : 
                              placeIndex === 2 ? 'bg-teal-600' :
                              'bg-slate-500'
                            }`}>
                              {placeIndex + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-foreground truncate">
                                {place.name || 'Unnamed Location'}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {place.address || 'No address'}
                              </p>
                              {place.category && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {place.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePlaceRemove(getIdentifier(place))}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                title="Remove from itinerary"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
                );
              })}
              
              {/* Add Day Button */}
              <Button
                variant="outline"
                onClick={handleAddDay}
                className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-solid"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Day
              </Button>
            </div>
            
            {/* Trip Summary */}
            <Card className="p-4 bg-muted/30">
              <h3 className="font-medium text-sm mb-3">Trip Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Destinations</span>
                  <span className="font-medium">{tripSummary.destinations}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Duration</span>
                  <span className="font-medium">{tripSummary.days} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cities</span>
                  <span className="font-medium">{tripSummary.cities}</span>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Right Side - Available Destinations */}
          <div className="flex-1">
            {/* Search and Filter */}
            <div className="mb-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={availableFilter === category ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setAvailableFilter(category)}
                    className="h-8 text-xs"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Available Destinations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium">Available Destinations</h2>
                  <p className="text-sm text-muted-foreground">
                    Adding to: <span className="font-medium text-primary">Day {selectedDayId}</span>
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {filteredAvailablePlaces.length} locations
                </span>
              </div>
              
              {filteredAvailablePlaces.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">No destinations found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search or category filters
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAvailablePlaces.map((place) => (
                    <Card key={getIdentifier(place)} className="p-4 hover:shadow-md transition-all cursor-pointer group" onClick={() => handlePlaceAdd(place)}>
                      <div className="space-y-2">
                        <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                          {place.name || 'Unnamed Location'}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {place.address || 'No address available'}
                        </p>
                        {place.category && (
                          <Badge variant="secondary" className="text-xs">
                            {place.category}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Developer Debug FOB */}
      <DeveloperFab 
        className="itinerary-page-fab"
        cacheInfo={{
          backendStatus: lastApiRequest?.status === 'success' ? 'hit' : 'unknown',
          backendType: 'Phoenix',
          environment: 'dev',
          queryStatus: 'fresh',
          pageType: 'itinerary',
          apiEndpoint: lastApiRequest?.endpoint || '/api/trips',
          dataCount: allItineraryPlaces.length,
          hasLocalData: Boolean(localStorage.getItem('itineraryData')),
          localStorageKeys: ['itineraryData', 'tripPlaces'].filter(key => localStorage.getItem(key))
        }}
        apiRequest={lastApiRequest || undefined}
      />
    </div>
  );
}
