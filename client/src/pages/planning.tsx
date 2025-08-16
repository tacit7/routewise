import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Check, LogIn, Save, X, FileText, Search, MapPin, Clock, Globe, Plus, Map, Route, Home, Shuffle, GitBranch, DollarSign, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-context";
import { authenticatedApiCall, API_CONFIG } from "@/lib/api-config";
import type { ItineraryPlace } from "@/types/itinerary";
import { getIdentifier } from "@/utils/itinerary";
import { DeveloperFab } from "@/components/developer-fab";
import ItineraryHeader from "@/components/ItineraryHeader";
import { LeafletMap } from "@/components/leaflet-map";
import { PlaceAutocomplete } from "@/components/place-autocomplete";
import { TripPlannerWithTabs } from "@/components/trip/TripPlannerWithTabs";
import { TabControlledRouteMap } from "@/components/maps/TabControlledRouteMap";
import type { MultiDayRouteData, ItineraryDay, RouteSegment } from "@/types/schema";

export default function PlanningPage({ mapsApiKey }: { mapsApiKey?: string }) {
  const [, setLocation] = useLocation();

  // Day-based itinerary state - simplified to index-based
  const [days, setDays] = useState<Array<{ title: string; places: ItineraryPlace[] }>>([{ title: "Day 1", places: [] }]);
  const [activeDay, setActiveDay] = useState<number>(0); // Track which day is selected for adding POIs (index-based)
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([0])); // Track which day accordions are open (index-based)
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
  const [activeTab, setActiveTab] = useState("destinations");
  const [hoveredPoi, setHoveredPoi] = useState<any>(null);
  const [homeBase, setHomeBase] = useState("");
  // Removed drag and drop functionality - using simple click-to-add instead

  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { tripPlaces, removeFromTrip } = useTripPlaces();
  
  // Debug trip places
  console.log('🎯 Planning page - trip places:', tripPlaces);

  // Load saved itinerary from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("itineraryData");
    console.log('📂 Loading from localStorage:', saved);
    if (saved) {
      try {
        const { days: rawDays, tripTitle: rawTitle, savedTripId: rawTripId, homeBase: rawHomeBase, activeDay: rawActiveDay } = JSON.parse(saved);
        console.log('📊 Parsed localStorage data:', { rawTripId, rawTitle, daysCount: rawDays?.length, rawHomeBase, rawActiveDay });
        if (Array.isArray(rawDays)) {
          // Convert old ID-based days to index-based days
          const indexBasedDays = rawDays.map((day: any, index: number) => ({
            title: day.title || `Day ${index + 1}`,
            places: day.places || []
          }));
          setDays(indexBasedDays);
          setTripTitle(rawTitle || "");
          setSavedTripId(rawTripId || null);
          setHomeBase(rawHomeBase || "");
          setActiveDay(rawActiveDay || 0);
          // Open the first day by default when loading
          setOpenDays(new Set([0]));
          console.log('✅ Set savedTripId to:', rawTripId || null);
        }
      } catch (e) {
        console.error('❌ Error parsing localStorage:', e);
      }
    } else {
      console.log('ℹ️ No itineraryData in localStorage');
      // Open the first day by default for new itineraries
      setOpenDays(new Set([0]));
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    const data = { days, tripTitle, savedTripId, homeBase, activeDay };
    console.log('💾 Saving to localStorage:', data);
    localStorage.setItem("itineraryData", JSON.stringify(data));
  }, [days, tripTitle, savedTripId, homeBase, activeDay]);

  // Get all places across all days for filtering
  const allItineraryPlaces = useMemo(() => 
    days.flatMap(day => day.places),
    [days]
  );

  // Convert itinerary places to POI format for map display - only show active day
  const mapPois = useMemo(() => {
    const activeDayData = days[activeDay];
    const activeDayPlaces = activeDayData?.places || [];
    
    return activeDayPlaces.map(place => ({
      id: place.id || 0,
      placeId: place.placeId || place.id?.toString(),
      name: place.name || "Unknown Place",
      category: place.category || "unknown",
      rating: place.rating?.toString() || "0",
      address: place.address || "",
      description: place.description || "",
      lat: place.lat || place.latitude || 0,
      lng: place.lng || place.longitude || 0,
      imageUrl: place.image || (place as any).photo_url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Enhanced fields
      accessibility: (place as any).accessibility,
      bestTimeToVisit: (place as any).bestTimeToVisit,
      durationSuggested: (place as any).durationSuggested,
      hiddenGem: (place as any).hiddenGem,
      tips: (place as any).tips,
      placeTypes: (place as any).placeTypes,
      reviewCount: (place as any).reviewCount || 0,
    }));
  }, [days, activeDay]);

  // Available places from trip places hook, filtered out already added ones
  const availablePlaces: ItineraryPlace[] = useMemo(
    () => tripPlaces.filter(p => !allItineraryPlaces.find(ip => getIdentifier(ip) === getIdentifier(p))),
    [tripPlaces, allItineraryPlaces]
  );

  // Add place to the active day's itinerary
  const handlePlaceAdd = (place: ItineraryPlace) => {
    const id = getIdentifier(place);
    const exists = allItineraryPlaces.find(p => getIdentifier(p) === id);
    if (exists) return;
    
    // Use activeDay index directly - no lookup needed
    if (activeDay >= days.length) return; // Active day out of bounds
    
    // Get default duration based on category
    const defaultDuration = getDefaultDurationForPlace(place);
    
    const updated: ItineraryPlace = { 
      ...place, 
      dayIndex: activeDay, 
      scheduledTime: "09:00", 
      dayOrder: days[activeDay].places.length,
      notes: undefined,
      userDuration: defaultDuration // Add user-settable duration
    };
    
    setDays(prev => {
      const newDays = [...prev];
      newDays[activeDay] = {
        ...newDays[activeDay],
        places: [...newDays[activeDay].places, updated]
      };
      return newDays;
    });
  };

  // Remove place from itinerary and renumber remaining places
  const handlePlaceRemove = (placeId: string | number) => {
    setDays(prev => 
      prev.map(day => {
        const filteredPlaces = day.places.filter(p => getIdentifier(p) !== placeId);
        // Renumber the remaining places in this day
        const renumberedPlaces = filteredPlaces.map((place, index) => ({
          ...place,
          dayOrder: index
        }));
        return {
          ...day,
          places: renumberedPlaces
        };
      })
    );
  };

  // Completely remove place from the trip (both itinerary and available places)
  const handlePlaceCompleteRemove = (placeId: string | number) => {
    // First remove from all days in the itinerary
    setDays(prev => 
      prev.map(day => {
        const filteredPlaces = day.places.filter(p => getIdentifier(p) !== placeId);
        const renumberedPlaces = filteredPlaces.map((place, index) => ({
          ...place,
          dayOrder: index
        }));
        return {
          ...day,
          places: renumberedPlaces
        };
      })
    );

    // Then remove from the trip places using the hook
    // Convert string placeId to number if needed
    const numericId = typeof placeId === 'string' ? parseInt(placeId) : placeId;
    removeFromTrip(numericId);
  };

  // Simple click-to-add functionality - no drag and drop

  // Add new day
  const handleAddDay = () => {
    const newDayNumber = days.length + 1;
    const newDay = {
      title: `Day ${newDayNumber}`,
      places: []
    };
    setDays(prev => [...prev, newDay]);
    // Auto-select the new day for adding POIs (index-based)
    const newDayIndex = days.length; // This will be the index of the new day
    setActiveDay(newDayIndex);
    // Close all accordions and open only the new day
    setOpenDays(new Set([newDayIndex]));
  };

  // Remove day (only if more than one day exists and not the first day)
  const handleRemoveDay = (dayIndex: number) => {
    if (days.length <= 1) return;
    if (dayIndex === 0) return; // Can't delete the first day
    
    setDays(prev => {
      // Get the day to be removed and its places
      const dayToRemove = prev[dayIndex];
      const placesToReturn = dayToRemove?.places || [];
      
      // Remove day-specific properties from places to make them available again
      const cleanedPlaces = placesToReturn.map(place => {
        const { dayIndex, scheduledTime, dayOrder, notes, ...cleanPlace } = place;
        return cleanPlace;
      });
      
      // Add the places back to tripPlaces by updating localStorage
      // This ensures they appear in available destinations
      if (cleanedPlaces.length > 0) {
        const currentTripPlaces = JSON.parse(localStorage.getItem('tripPlaces') || '[]');
        const updatedTripPlaces = [...currentTripPlaces, ...cleanedPlaces];
        localStorage.setItem('tripPlaces', JSON.stringify(updatedTripPlaces));
        
        // Force a re-render by triggering the tripPlaces hook
        // The useTripPlaces hook will pick up the localStorage changes
        window.dispatchEvent(new Event('storage'));
      }
      
      // Filter out the day to be removed and renumber titles
      const filteredDays = prev.filter((_, index) => index !== dayIndex);
      
      // Renumber the remaining days
      return filteredDays.map((day, index) => ({
        ...day,
        title: `Day ${index + 1}`
      }));
    });
    
    // Update open days state - remove deleted day and adjust indices
    setOpenDays(prev => {
      const newOpenDays = new Set<number>();
      prev.forEach(openIndex => {
        if (openIndex < dayIndex) {
          // Days before deleted day keep same index
          newOpenDays.add(openIndex);
        } else if (openIndex > dayIndex) {
          // Days after deleted day shift down by 1
          newOpenDays.add(openIndex - 1);
        }
        // Skip the deleted day index
      });
      return newOpenDays;
    });
    
    // If the active day was deleted or after deleted day, adjust activeDay
    if (activeDay === dayIndex) {
      setActiveDay(0); // Select first day
    } else if (activeDay > dayIndex) {
      setActiveDay(prev => prev - 1); // Shift down by 1
    }
  };

  // Update place duration
  const handlePlaceDurationChange = (placeId: string | number, duration: string) => {
    setDays(prev => 
      prev.map(day => ({
        ...day,
        places: day.places.map(place => 
          getIdentifier(place) === placeId 
            ? { ...place, userDuration: duration }
            : place
        )
      }))
    );
  };

  // Update place arrival time
  const handlePlaceArrivalTimeChange = (placeId: string | number, arrivalTime: string) => {
    setDays(prev => 
      prev.map(day => ({
        ...day,
        places: day.places.map(place => 
          getIdentifier(place) === placeId 
            ? { ...place, scheduledTime: arrivalTime }
            : place
        )
      }))
    );
  };

  // Update place description
  const handlePlaceDescriptionChange = (placeId: string | number, description: string) => {
    setDays(prev => 
      prev.map(day => ({
        ...day,
        places: day.places.map(place => 
          getIdentifier(place) === placeId 
            ? { ...place, userDescription: description }
            : place
        )
      }))
    );
  };

  // Get route alternatives for a specific day
  const handleGetRouteAlternatives = async (dayIndex: number) => {
    const day = days[dayIndex];
    if (!day || day.places.length < 2) {
      toast({
        title: "Not enough places",
        description: "Add at least 2 places to get route alternatives.",
        variant: "destructive",
      });
      return;
    }

    try {
      const waypoints = day.places.map(place => ({
        lat: place.lat || place.latitude || 0,
        lng: place.lng || place.longitude || 0,
        name: place.name || "Unknown Place",
        address: place.address || "",
      }));

      const alternativesRequest = {
        waypoints,
        day: dayIndex + 1 // Convert to 1-based for API
      };

      const response = await authenticatedApiCall<{
        alternatives: Array<{
          name: string;
          distance: string;
          duration: string;
          encodedPolyline: string;
          trafficDelay?: string;
        }>;
      }>(API_CONFIG.ENDPOINTS.ROUTES_ALTERNATIVES, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alternativesRequest),
      });

      // Display alternatives to user (could open a modal or sidebar)
      toast({
        title: "Route Alternatives Found",
        description: `Found ${response.alternatives.length} alternative routes for ${day.title}`,
      });

      // You could set state here to show alternatives in UI
      console.log('Route alternatives:', response.alternatives);

    } catch (error) {
      console.error('Failed to get route alternatives:', error);
      toast({
        title: "Failed to Get Alternatives",
        description: error instanceof Error ? error.message : "Unable to fetch route alternatives.",
        variant: "destructive",
      });
    }
  };

  // Get cost estimation for a specific day
  const handleGetCostEstimation = async (dayIndex: number) => {
    const day = days[dayIndex];
    if (!day || day.places.length < 2) {
      toast({
        title: "Not enough places",
        description: "Add at least 2 places to estimate costs.",
        variant: "destructive",
      });
      return;
    }

    try {
      const waypoints = day.places.map(place => ({
        lat: place.lat || place.latitude || 0,
        lng: place.lng || place.longitude || 0,
        name: place.name || "Unknown Place",
        address: place.address || "",
      }));

      const costRequest = {
        waypoints,
        day: dayIndex + 1, // Convert to 1-based for API
        fuelPrice: 3.50, // Could be user configurable
        vehicleEfficiency: 25 // mpg, could be user configurable
      };

      const response = await authenticatedApiCall<{
        totalDistance: string;
        totalDuration: string;
        estimatedFuelCost: number;
        estimatedTollCost?: number;
        estimatedParkingCost?: number;
        totalEstimatedCost: number;
      }>(API_CONFIG.ENDPOINTS.ROUTES_COSTS, {
        method: 'POST',
        body: JSON.stringify(costRequest),
      });

      toast({
        title: "Cost Estimation",
        description: `Estimated total cost for ${day.title}: $${response.totalEstimatedCost.toFixed(2)} (Fuel: $${response.estimatedFuelCost.toFixed(2)})`,
      });

    } catch (error) {
      console.error('Failed to get cost estimation:', error);
      toast({
        title: "Cost Estimation Failed",
        description: error instanceof Error ? error.message : "Unable to calculate cost estimates.",
        variant: "destructive",
      });
    }
  };

  const handleGoBack = () => setLocation("/route-results");

  // Optimize route order for a specific day
  const handleOptimizeRoute = async (dayIndex: number) => {
    const day = days[dayIndex];
    if (!day || day.places.length < 3) {
      toast({
        title: "Not enough places",
        description: "Add at least 3 places to optimize the route order.",
        variant: "destructive",
      });
      return;
    }

    try {
      const waypoints = day.places.map(place => ({
        lat: place.lat || place.latitude || 0,
        lng: place.lng || place.longitude || 0,
        name: place.name || "Unknown Place",
        address: place.address || "",
      }));

      const optimizeRequest = {
        waypoints,
        day: dayIndex + 1 // Convert to 1-based for API
      };

      toast({
        title: "Optimizing Route...",
        description: `Finding the best order for ${day.places.length} destinations.`,
      });

      const response = await authenticatedApiCall<{
        waypointOrder: number[];
        totalDistance: string;
        totalDuration: string;
        estimatedTimeSaved?: string;
      }>(API_CONFIG.ENDPOINTS.ROUTES_OPTIMIZE, {
        method: 'POST',
        body: JSON.stringify(optimizeRequest),
      });

      // Reorder places based on optimized waypoint order
      if (response.waypointOrder && response.waypointOrder.length === day.places.length) {
        const optimizedPlaces = response.waypointOrder.map(index => day.places[index]).filter(Boolean);
        
        setDays(prev => 
          prev.map((d, index) => {
            if (index === dayIndex) {
              return {
                ...d,
                places: optimizedPlaces.map((place, index) => ({
                  ...place,
                  dayOrder: index
                }))
              };
            }
            return d;
          })
        );

        toast({
          title: "Route Optimized!",
          description: `New route: ${response.totalDistance}, ${response.totalDuration}${response.estimatedTimeSaved ? ` (saved ${response.estimatedTimeSaved})` : ''}`,
        });
      }

    } catch (error) {
      console.error('Route optimization failed:', error);
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "Failed to optimize route. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate route for a specific day
  const handleCalculateRoute = async (dayIndex: number) => {
    const day = days[dayIndex];
    if (!day || day.places.length < 2) {
      toast({
        title: "Not enough places",
        description: "Add at least 2 places to calculate a route for this day.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare waypoints for the route API
      const waypoints = day.places.map(place => ({
        lat: place.lat || place.latitude || 0,
        lng: place.lng || place.longitude || 0,
        name: place.name || "Unknown Place",
        address: place.address || "",
      }));

      // Add home base as starting point if provided
      const startPoint = homeBase ? { 
        name: "Home Base", 
        address: homeBase,
        lat: 0, // Would need to geocode homeBase address
        lng: 0 
      } : waypoints[0];

      // Call backend routing API
      const routeRequest = {
        waypoints: homeBase ? [startPoint, ...waypoints] : waypoints,
        optimize: true, // Request route optimization
        day: dayIndex + 1 // Convert to 1-based for API
      };

      toast({
        title: "Calculating Route...",
        description: `Optimizing route for ${day.title} with ${day.places.length} destinations.`,
      });

      const response = await authenticatedApiCall<{
        encodedPolyline: string;
        totalDistance: string;
        totalDuration: string;
        waypointOrder: number[];
        optimizedWaypoints?: any[];
      }>(API_CONFIG.ENDPOINTS.ROUTES_CALCULATE, {
        method: 'POST',
        body: JSON.stringify(routeRequest),
      });

      // Update the day with the calculated route
      setDays(prev => 
        prev.map((d, index) => {
          if (index === dayIndex) {
            // If we got optimized waypoints, reorder the places
            let updatedPlaces = d.places;
            if (response.optimizedWaypoints && response.waypointOrder) {
              const reorderedPlaces = response.waypointOrder.map(index => d.places[index]).filter(Boolean);
              if (reorderedPlaces.length === d.places.length) {
                updatedPlaces = reorderedPlaces.map((place, index) => ({
                  ...place,
                  dayOrder: index
                }));
              }
            }

            return {
              ...d,
              places: updatedPlaces,
              route: response // Store the route data for this day
            };
          }
          return d;
        })
      );

      toast({
        title: "Route Calculated!",
        description: `Optimized route for ${day.title}: ${response.totalDistance}, ${response.totalDuration}`,
      });

    } catch (error) {
      console.error('Route calculation failed:', error);
      toast({
        title: "Route Calculation Failed",
        description: error instanceof Error ? error.message : "Failed to calculate route. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all destinations? This will clear your current itinerary.")) {
      setDays([{ id: 1, title: "Day 1", places: [] }]);
      setTripTitle("");
      setHomeBase("");
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

  // Get default duration for a place based on category (in minutes)
  const getDefaultDurationForPlace = (place: ItineraryPlace): string => {
    const category = place.category?.toLowerCase();
    
    // Duration in minutes
    let duration = 120; // default 2 hours
    
    if (category?.includes('restaurant') || category?.includes('food')) {
      duration = 90; // 1.5 hours
    } else if (category?.includes('museum') || category?.includes('gallery')) {
      duration = 180; // 3 hours
    } else if (category?.includes('park') || category?.includes('outdoor')) {
      duration = 150; // 2.5 hours
    } else if (category?.includes('shopping') || category?.includes('mall')) {
      duration = 120; // 2 hours
    } else if (category?.includes('attraction') || category?.includes('tourist')) {
      duration = 180; // 3 hours
    } else if (category?.includes('bar') || category?.includes('nightlife')) {
      duration = 120; // 2 hours
    }
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };

  // Parse duration string to minutes
  const parseDurationToMinutes = (duration: any): number => {
    if (!duration) return 120; // default 2 hours
    
    // Ensure duration is a string before calling string methods
    const durationStr = typeof duration === 'string' ? duration : String(duration);
    
    const hourMatch = durationStr.match(/(\d+)h/);
    const minuteMatch = durationStr.match(/(\d+)min/);
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    
    return (hours * 60) + minutes;
  };

  // Calculate total estimated duration for a day using user-set durations
  const getDayEstimatedDuration = (places: ItineraryPlace[]): string => {
    if (places.length === 0) return "0h";
    
    let totalMinutes = 0;
    places.forEach(place => {
      const userDuration = (place as any).userDuration;
      if (userDuration) {
        totalMinutes += parseDurationToMinutes(userDuration);
      } else {
        totalMinutes += 120; // default 2 hours
      }
    });
    
    // Add travel time between places (15 min per transition)
    if (places.length > 1) {
      totalMinutes += (places.length - 1) * 15;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };

  // Convert itinerary data to MultiDayRouteData format for the route map
  const convertToRouteData = (): MultiDayRouteData | null => {
    console.log('📊 convertToRouteData called with days:', days);
    
    if (days.length === 0 || days.every(day => day.places.length === 0)) {
      console.log('📊 No days or no places, returning null');
      return null;
    }

    // Convert days to ItineraryDay format
    const itineraryDays: ItineraryDay[] = days
      .filter(day => day.places.length > 0) // Only include days with places
      .map(day => {
        console.log(`📊 Processing day ${day.id}:`, day);
        const dayRoute = (day as any).route; // Get calculated route if available
        console.log(`📊 Day ${day.id} route:`, dayRoute);
        
        const waypoints = day.places.map(place => {
          const waypoint = {
            lat: place.lat || place.latitude || 0,
            lng: place.lng || place.longitude || 0,
            name: place.name || "Unknown Place",
            address: place.address || "",
          };
          console.log(`📊 Created waypoint for ${place.name}:`, waypoint);
          return waypoint;
        });
        
        return {
          day: day.id,
          title: day.title,
          waypoints: waypoints,
          route: dayRoute ? {
            encodedPolyline: dayRoute.encodedPolyline,
            totalDistance: dayRoute.totalDistance,
            totalDuration: dayRoute.totalDuration,
            waypointOrder: dayRoute.waypointOrder || day.places.map((_, index) => index),
            startCoords: { 
              lat: day.places[0]?.lat || day.places[0]?.latitude || 0, 
              lng: day.places[0]?.lng || day.places[0]?.longitude || 0 
            },
            endCoords: { 
              lat: day.places[day.places.length - 1]?.lat || day.places[day.places.length - 1]?.latitude || 0, 
              lng: day.places[day.places.length - 1]?.lng || day.places[day.places.length - 1]?.longitude || 0 
            },
          } : null,
          pois: day.places.map(place => ({
            id: place.id || 0,
            placeId: place.placeId || place.id?.toString() || "",
            name: place.name || "Unknown Place",
            category: place.category || "unknown",
            rating: place.rating?.toString() || "0",
            address: place.address || "",
            description: place.description || "",
            lat: place.lat || place.latitude || 0,
            lng: place.lng || place.longitude || 0,
            imageUrl: place.image || (place as any).photo_url || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        };
      });

    if (itineraryDays.length === 0) return null;

    // Create route data structure with calculated routes
    const routesByDay: Record<number, RouteSegment> = {};
    
    itineraryDays.forEach(day => {
      if (day.waypoints.length >= 2) {
        const dayData = days.find(d => d.id === day.day);
        const dayRoute = (dayData as any)?.route;
        
        if (dayRoute && dayRoute.encodedPolyline) {
          // Use calculated route from backend
          routesByDay[day.day] = {
            encodedPolyline: dayRoute.encodedPolyline,
            totalDistance: dayRoute.totalDistance,
            totalDuration: dayRoute.totalDuration,
            waypointOrder: dayRoute.waypointOrder || day.waypoints.map((_, index) => index),
            startCoords: { lat: day.waypoints[0].lat, lng: day.waypoints[0].lng },
            endCoords: { lat: day.waypoints[day.waypoints.length - 1].lat, lng: day.waypoints[day.waypoints.length - 1].lng },
          };
        } else {
          // Fallback to simple waypoint connection (no polyline)
          routesByDay[day.day] = {
            encodedPolyline: "", // No polyline without routing service
            totalDistance: getDayEstimatedDuration(dayData?.places || []),
            totalDuration: getDayEstimatedDuration(dayData?.places || []),
            waypointOrder: day.waypoints.map((_, index) => index),
            startCoords: { lat: day.waypoints[0].lat, lng: day.waypoints[0].lng },
            endCoords: { lat: day.waypoints[day.waypoints.length - 1].lat, lng: day.waypoints[day.waypoints.length - 1].lng },
          };
        }
      }
    });

    const result = {
      itinerary: {
        itinerary: itineraryDays,
        totalDays: itineraryDays.length,
        startLocation: itineraryDays[0]?.waypoints[0]?.name || "Start",
        endLocation: itineraryDays[itineraryDays.length - 1]?.waypoints[itineraryDays[itineraryDays.length - 1].waypoints.length - 1]?.name || "End",
      },
      routesByDay,
      allPois: itineraryDays.flatMap(day => day.pois || []),
    };
    
    console.log('📊 convertToRouteData final result:', result);
    console.log('📊 Routes by day keys:', Object.keys(routesByDay));
    console.log('📊 Itinerary days:', itineraryDays.length);
    
    return result;
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
        tripTitle={tripTitle}
        onTripTitleChange={setTripTitle}
        onSaveTrip={handleSaveTrip}
        onClearAll={handleClearAll}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-8">
          {/* Left Side - Itinerary */}
          <div className="w-96 flex flex-col h-[calc(100vh-120px)]">
            
            {/* Home Base Input */}
            <div className="mb-4">
              <PlaceAutocomplete
                value={homeBase}
                onSelect={(place) => setHomeBase(place.description)}
                placeholder="Home base (e.g., San Francisco, CA or 123 Main St)"
                className="h-12"
              />
            </div>
            
            {/* Scrollable Day Cards with Accordion */}
            <div className="flex-1 overflow-y-auto pr-2">
              <Accordion 
                type="multiple" 
                value={Array.from(openDays).map(String)}
                onValueChange={(value) => setOpenDays(new Set(value.map(Number)))}
                className="space-y-2"
              >
                {days.map((day, dayIndex) => {
                  const isSelected = activeDay === dayIndex;
                  return (
                    <AccordionItem key={dayIndex} value={dayIndex.toString()} className="border rounded-lg">
                      <Card className={`transition-all ${
                        isSelected ? 'ring-2 ring-primary bg-primary-50' : ''
                      }`}>
                        <AccordionTrigger 
                          className="px-4 py-3 hover:no-underline flex-row-reverse justify-end [&[data-state=closed]_.places-badge]:block [&[data-state=open]_.places-badge]:hidden"
                          onClick={() => setActiveDay(dayIndex)}
                        >
                          <div className="flex items-center justify-between w-full ml-3">
                            <div className="flex items-center gap-3">
                              <h2 className="text-lg font-semibold">{day.title}</h2>
                              {day.places.length > 0 && (
                                <Badge variant="secondary" className="text-xs places-badge hidden">
                                  {day.places.length} places
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {days.length > 1 && dayIndex !== 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDay(dayIndex);
                                  }}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  title="Remove day"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent 
                          className="px-4 pb-4"
                        >
                          {/* Day Info and Route Actions */}
                          {day.places.length > 0 && (
                            <div className="mb-4 pb-3 border-b border-border">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Estimated Duration
                                  </p>
                                  <p className="text-sm text-foreground mt-1">
                                    {getDayEstimatedDuration(day.places)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Route Action Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCalculateRoute(dayIndex)}
                                  className="flex items-center gap-2"
                                  disabled={day.places.length < 2}
                                >
                                  <Route className="h-4 w-4" />
                                  Calculate
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOptimizeRoute(dayIndex)}
                                  className="flex items-center gap-2"
                                  disabled={day.places.length < 3}
                                >
                                  <Shuffle className="h-4 w-4" />
                                  Optimize
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGetRouteAlternatives(dayIndex)}
                                  className="flex items-center gap-2"
                                  disabled={day.places.length < 2}
                                >
                                  <GitBranch className="h-4 w-4" />
                                  Alternatives
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGetCostEstimation(dayIndex)}
                                  className="flex items-center gap-2"
                                  disabled={day.places.length < 2}
                                >
                                  <DollarSign className="h-4 w-4" />
                                  Cost
                                </Button>
                              </div>
                            </div>
                          )}

                          {day.places.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed rounded-lg border-border bg-muted/30">
                              <p className="text-sm text-muted-foreground">
                                {isSelected 
                                  ? "Select places from the right to add to this day"
                                  : "Click this day to select it, then add locations"
                                }
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3 min-h-[100px] p-2 border-2 border-dashed rounded-lg border-transparent">
                              {day.places.map((place, placeIndex) => (
                                <div 
                                  key={getIdentifier(place)} 
                                  className="border-2 rounded-lg hover:border-primary transition-all overflow-hidden border-border"
                                >
                                  {/* POI Image - Full Width at Top */}
                                  <div className="w-full h-40 bg-muted relative">
                                    {place.image || (place as any).photo_url ? (
                                      <img 
                                        src={place.image || (place as any).photo_url}
                                        alt={place.name || 'Place image'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = '/placeholder-poi.jpg';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                        <MapPin className="h-12 w-12 text-gray-400" />
                                      </div>
                                    )}
                                    
                                    {/* Category badge overlaid on image */}
                                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                      {place.category && (
                                        <Badge variant="secondary" className="bg-gray-600 text-white border-0 text-[10px] px-1.5 py-0.5 h-5">
                                          {place.category}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Drag handle */}
                                    <div className="absolute bottom-2 left-2">
                                      <div className="text-white/70 hover:text-white bg-black/20 rounded p-1 transition-colors">
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                    </div>
                                    
                                    {/* Remove button overlaid on image */}
                                    <div className="absolute top-2 right-2">
                                      <button
                                        onClick={() => handlePlaceRemove(getIdentifier(place))}
                                        className="text-white hover:bg-orange-600/80 bg-orange-500/60 rounded-full p-1 transition-colors"
                                        title="Remove from this day (back to available)"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* POI Content */}
                                  <div className="p-4">
                                    <div className="space-y-3">
                                      <h3 className="font-medium text-foreground">
                                        {place.name || 'Unnamed Location'}
                                      </h3>
                                      
                                      {/* Description and Tips Display - from POI data */}
                                      {(place.description || ((place as any).tips && (place as any).tips.length > 0)) && (
                                        <div className="text-xs text-muted-foreground">
                                          {place.description && <p className="italic">{place.description}</p>}
                                          {(place as any).tips && (place as any).tips.length > 0 && (
                                            <p className={place.description ? "mt-1" : ""}>
                                              <strong>Tips:</strong> {(place as any).tips.join('. ')}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Arrival Time and Duration Inputs */}
                                      <div className="flex items-center gap-2">
                                        <Input
                                          placeholder="Arrival time"
                                          value={place.scheduledTime || ""}
                                          onChange={(e) => handlePlaceArrivalTimeChange(getIdentifier(place), e.target.value)}
                                          className="text-xs h-7 flex-1"
                                          title="Set arrival time for this place"
                                        />
                                        <Input
                                          placeholder="Duration"
                                          value={(place as any).userDuration || ""}
                                          onChange={(e) => handlePlaceDurationChange(getIdentifier(place), e.target.value)}
                                          className="text-xs h-7 flex-1"
                                          title="Set duration for this place"
                                        />
                                      </div>
                                      
                                      {/* User Notes Input */}
                                      <Input
                                        placeholder="Add notes or description..."
                                        value={(place as any).userDescription || ""}
                                        onChange={(e) => handlePlaceDescriptionChange(getIdentifier(place), e.target.value)}
                                        className="text-xs h-7 w-full"
                                        title="Add notes or description for this place"
                                      />
                                      
                                      <p className="text-xs text-muted-foreground">
                                        {place.address || 'No address'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
            
            {/* Add Day Button */}
            <div className="mt-4">
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
            <Card className="mt-4 p-4 bg-muted/30">
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
          
          {/* Right Side - Tabs for Destinations and Map */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="destinations" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Destinations
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Map & Routes
                </TabsTrigger>
              </TabsList>
              
              <TabsContent 
                value="destinations" 
                className="mt-0"
              >
                <div className="h-[calc(100vh-220px)]">
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
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-medium">Available Destinations</h2>
                      <p className="text-sm text-muted-foreground">
                        Adding to: <span className="font-medium text-primary">Day {activeDay + 1}</span>
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
                        <div 
                          key={getIdentifier(place)} 
                          className="border-2 rounded-lg hover:border-primary cursor-pointer transition-all overflow-hidden border-border group"
                          onClick={() => handlePlaceAdd(place)}
                          onMouseEnter={() => setHoveredPoi(place)}
                          onMouseLeave={() => setHoveredPoi(null)}
                        >
                          {/* POI Image - Full Width at Top */}
                          <div className="w-full h-40 bg-muted relative">
                            {place.image || (place as any).photo_url ? (
                              <img 
                                src={place.image || (place as any).photo_url}
                                alt={place.name || 'Place image'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-poi.jpg';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                <MapPin className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Category badge overlaid on image */}
                            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                              {place.category && (
                                <Badge variant="secondary" className="bg-gray-600 text-white border-0 text-[10px] px-1.5 py-0.5 h-5">
                                  {place.category}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Drag handle */}
                            <div className="absolute bottom-2 left-2">
                              <div className="text-white/70 hover:text-white bg-black/20 rounded p-1 transition-colors">
                                <GripVertical className="h-4 w-4" />
                              </div>
                            </div>
                            
                            {/* Action buttons overlaid on image */}
                            <div className="absolute top-2 right-2 flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlaceAdd(place);
                                }}
                                className="text-white hover:bg-black/20 rounded-full p-1 transition-colors"
                                title="Add to itinerary"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlaceCompleteRemove(getIdentifier(place));
                                }}
                                className="text-white hover:bg-red-600/80 bg-red-500/60 rounded-full p-1 transition-colors"
                                title="Remove from trip completely"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* POI Content */}
                          <div className="p-4">
                            <div className="space-y-2">
                              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {place.name || 'Unnamed Location'}
                              </h3>
                              
                              {/* Description and Tips - from POI data */}
                              {(place.description || ((place as any).tips && (place as any).tips.length > 0)) && (
                                <div className="text-xs text-muted-foreground line-clamp-3">
                                  {place.description && <p className="italic">{place.description}</p>}
                                  {(place as any).tips && (place as any).tips.length > 0 && (
                                    <p className={place.description ? "mt-1" : ""}>
                                      <strong>Tips:</strong> {(place as any).tips.join('. ')}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {place.address || 'No address available'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="map" className="mt-0 h-[calc(100vh-220px)]">
                {(() => {
                  const routeData = convertToRouteData();
                  
                  if (!routeData || routeData.itinerary.itinerary.length === 0) {
                    return (
                      <div className="h-full border-2 border-dashed border-border rounded-lg bg-muted/30 flex items-center justify-center">
                        <div className="text-center">
                          <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="font-medium text-foreground">No itinerary to display</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Add places to your days to see them on the map
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="h-full">
                      <TabControlledRouteMap
                        routeData={routeData}
                        activeDays="all"
                        height="calc(100vh - 220px)"
                        className="h-full rounded-lg border border-border overflow-hidden"
                      />
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
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
