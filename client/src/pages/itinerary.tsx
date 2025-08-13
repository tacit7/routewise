import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, LogIn, Plus, Save, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/header/BackButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-context";
import { authenticatedApiCall, API_CONFIG } from "@/lib/api-config";
import DailyItinerarySidebar from "@/components/DailyItinerarySidebar";
import TripPlacesGrid from "@/components/TripPlacesGrid";
import type { DayData, ItineraryPlace } from "@/types/itinerary";
import { getIdentifier } from "@/utils/itinerary";
import { InteractiveMap } from "@/components/interactive-map";
import { TopNav } from "@/features/marketing/top-nav";
import { DeveloperFab } from "@/components/developer-fab";

export default function ItineraryPageShadcn({ mapsApiKey }: { mapsApiKey?: string }) {
  const [, setLocation] = useLocation();

  const [showMap, setShowMap] = useState<boolean>(() => {
  try { return JSON.parse(localStorage.getItem("itinerary.showMap") || "false"); } catch { return false; }
});

  const [activeDay, setActiveDay] = useState(0);
  const [assignedPlaceIds, setAssignedPlaceIds] = useState<Set<string | number>>(new Set());
  const [days, setDays] = useState<DayData[]>([{ date: new Date(), title: "", places: [] }]);
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

  useEffect(() => {
    const saved = localStorage.getItem("itineraryData");
    console.log('📂 Loading from localStorage:', saved);
    if (saved) {
      try {
        const { days: rawDays, activeDay: rawActiveDay, tripTitle: rawTitle, savedTripId: rawTripId } = JSON.parse(saved);
        console.log('📊 Parsed localStorage data:', { rawTripId, rawTitle, daysCount: rawDays?.length });
        if (Array.isArray(rawDays)) {
          const restored = rawDays.map((d: any) => ({ ...d, date: new Date(d.date) }));
          setDays(restored);
          setActiveDay(rawActiveDay || 0);
          setTripTitle(rawTitle || "");
          setSavedTripId(rawTripId || null);
          console.log('✅ Set savedTripId to:', rawTripId || null);
          const assigned = new Set<string | number>();
          restored.forEach((day: DayData) => day.places.forEach((p) => assigned.add(getIdentifier(p))));
          setAssignedPlaceIds(assigned);
        }
      } catch (e) {
        console.error('❌ Error parsing localStorage:', e);
      }
    } else {
      console.log('ℹ️ No itineraryData in localStorage');
    }
  }, []);

  useEffect(() => {
    const data = { days, activeDay, tripTitle, savedTripId };
    console.log('💾 Saving to localStorage:', data);
    localStorage.setItem("itineraryData", JSON.stringify(data));
  }, [days, activeDay, tripTitle, savedTripId]);

  const itineraryPlaces: ItineraryPlace[] = useMemo(
    () => tripPlaces.map((p) => ({ ...p, dayIndex: undefined, scheduledTime: undefined, dayOrder: undefined, notes: undefined })),
    [tripPlaces]
  );

  const handleAddDay = () => {
    const date = new Date(Date.now() + days.length * 24 * 60 * 60 * 1000);
    setDays([...days, { date, title: "", places: [] }]);
    setActiveDay(days.length);
  };

  const handleDeleteDay = (dayIndex: number) => {
    if (days.length <= 1) return; // Don't delete if it's the only day
    
    // Remove places from that day from assignedPlaceIds
    const dayToDelete = days[dayIndex];
    dayToDelete.places.forEach((place) => {
      const id = getIdentifier(place);
      setAssignedPlaceIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });

    // Remove the day
    const newDays = days.filter((_, index) => index !== dayIndex);
    setDays(newDays);
    
    // Adjust active day if necessary
    if (activeDay >= newDays.length) {
      setActiveDay(newDays.length - 1);
    } else if (activeDay >= dayIndex) {
      setActiveDay(Math.max(0, activeDay - 1));
    }
  };

  const handlePlaceAssignment = (place: ItineraryPlace, dayIndex: number) => {
    const id = getIdentifier(place);
    if (assignedPlaceIds.has(id)) return;
    const updated: ItineraryPlace = { ...place, dayIndex, scheduledTime: "09:00", dayOrder: days[dayIndex].places.length };
    setDays((prev) => {
      const next = [...prev];
      next[dayIndex] = { ...next[dayIndex], places: [...next[dayIndex].places, updated] };
      return next;
    });
    setAssignedPlaceIds((prev) => new Set([...prev, id]));
  };

  const handlePlaceRemove = (placeId: string | number) => {
    setDays((prev) => prev.map((d) => ({ ...d, places: d.places.filter((p) => getIdentifier(p) !== placeId) })));
    setAssignedPlaceIds((prev) => {
      const n = new Set(prev);
      n.delete(placeId);
      return n;
    });
  };

  const handlePlaceAdd = (place: ItineraryPlace) => {
    handlePlaceAssignment(place, activeDay);
  };

  const handlePlaceUpdate = (placeId: string | number, updates: Partial<ItineraryPlace>) => {
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        places: d.places.map((p) => (getIdentifier(p) === placeId ? { ...p, ...updates } : p)),
      }))
    );
  };


  const handleGoBack = () => setLocation("/route-results");

  const handleNewTrip = () => {
    if (window.confirm("Start a new trip? This will clear your current itinerary.")) {
      // Clear all state
      setDays([{ date: new Date(), title: "", places: [] }]);
      setActiveDay(0);
      setTripTitle("");
      setSavedTripId(null);
      setAssignedPlaceIds(new Set());
      setLastSavedAt(null);
      setLastApiRequest(null);
      
      // Clear localStorage
      localStorage.removeItem('itineraryData');
      localStorage.removeItem('tripPlaces');
      
      toast({
        title: "New Trip Started",
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

    if (days.every(day => day.places.length === 0)) {
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
      // Get all scheduled places across all days
      const allScheduledPlaces = days.flatMap(day => day.places);
      
      // Extract start and end locations from first and last places
      const firstPlace = allScheduledPlaces.find(p => p.dayIndex === 0);
      const lastDayIndex = Math.max(...days.map((_, i) => i));
      const lastPlace = allScheduledPlaces.find(p => p.dayIndex === lastDayIndex);
      
      // Get unique cities for checkpoints
      const cities = new Set<string>();
      const stops: string[] = [];
      
      allScheduledPlaces.forEach((p) => {
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
      const interests = Array.from(new Set(allScheduledPlaces.map(p => p.category)));
      
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
    const scheduled = days.flatMap((d) => d.places);
    if (scheduled.length === 0) return "My Trip";
    const cities = new Set<string>();
    scheduled.forEach((p) => {
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

  const unassigned = useMemo(
    () => itineraryPlaces.filter((p) => !assignedPlaceIds.has(getIdentifier(p))),
    [itineraryPlaces, assignedPlaceIds]
  );

  if (itineraryPlaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <Card className="max-w-md" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--text)' }}>No Trip Places Found</CardTitle>
            <CardDescription style={{ color: 'var(--text-muted)' }}>You need to add places to your trip first.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              onClick={handleGoBack}
              className="focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Route Results
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
        <TopNav />
      
      {/* Page Header */}
      <div className="bg-white px-6 py-4 border-b">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex-1 max-w-md space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Enter trip title..."
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                className="font-medium text-lg h-10"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {days.length} day{days.length !== 1 ? 's' : ''} • {days.flatMap(d => d.places).length} places scheduled
              {savedTripId && (
                <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                  <Check className="h-3 w-3" />
                  Saved (ID: {savedTripId})
                </span>
              )}
            </p>
          </div>
          <div className="ml-4 flex items-center gap-2">
            {lastSavedAt && (
              <span className="text-sm text-gray-500">
                Saved {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
            {savedTripId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewTrip}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                New Trip
              </Button>
            )}
            <Button
              onClick={handleSaveTrip}
              disabled={isSaving || !isAuthenticated}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {savedTripId ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {savedTripId ? 'Update Trip' : 'Save Trip'}
                </>
              )}
            </Button>
            {!isAuthenticated && (
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={`day-${activeDay}`} onValueChange={(v) => setActiveDay(parseInt(v.replace("day-", "")))} className="flex-1 flex flex-col">
        <div className="border-b px-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <TabsList className="h-auto p-0 bg-transparent">
            {days.map((day, index) => (
              <div key={index} className="relative group">
                <TabsTrigger 
                  value={`day-${index}`} 
                  className="rounded-b-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] pr-8"
                  style={{ 
                    backgroundColor: activeDay === index ? 'var(--primary)' : 'transparent',
                    color: activeDay === index ? 'white' : 'var(--text)',
                    borderColor: 'var(--border)'
                  }}
                >
                  Day {index + 1}{day.title && <span className="ml-1 opacity-75">- {day.title}</span>}
                </TabsTrigger>
                {days.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDay(index);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all focus-ring hover:bg-gray-100"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: '#5f6368'
                    }}
                    title={`Delete Day ${index + 1}`}
                    aria-label={`Delete Day ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <Button variant="ghost" size="sm" onClick={handleAddDay} className="ml-2 hover:bg-[var(--surface-alt)] focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]" style={{ color: 'var(--text)' }}>
              <Plus className="h-4 w-4" />
            </Button>
          </TabsList>
        </div>

        <div className="flex-1 flex">
          <DailyItinerarySidebar
            day={days[activeDay] || days[0]}
            dayIndex={activeDay}
            onPlaceUpdate={handlePlaceUpdate}
            onPlaceRemove={handlePlaceRemove}
            onPlaceAssignment={handlePlaceAssignment}
            showMap={showMap}
            onToggleMap={() => setShowMap(!showMap)}
          />
          <div className="flex-1">
          {showMap ? (
              <InteractiveMap
                startCity="My Trip"
                endCity=""
                pois={days[activeDay]?.places || []} // Show places scheduled for the active day
                selectedPoiIds={days[activeDay]?.places.map(p => Number(getIdentifier(p))) || []}
                hoveredPoi={null}
                height="100%"
                className="w-full h-full"
            />
          ) : (
          <TripPlacesGrid places={unassigned} onPlaceReturn={handlePlaceRemove} onPlaceAdd={handlePlaceAdd} />
          )
          }
          </div>
        </div>
      </Tabs>
      
      {/* Developer Debug FOB */}
      <DeveloperFab 
        className="itinerary-page-fab"
        cacheInfo={{
          backendStatus: lastApiRequest?.status === 'success' ? 'hit' : 'unknown',
          backendType: 'Phoenix',
          environment: 'dev',
          queryStatus: 'fresh',
          pageType: 'explore-results', // Using explore-results as closest match
          apiEndpoint: lastApiRequest?.endpoint || '/api/trips',
          dataCount: days.flatMap(d => d.places).length,
          hasLocalData: Boolean(localStorage.getItem('itineraryData')),
          localStorageKeys: ['itineraryData', 'tripPlaces'].filter(key => localStorage.getItem(key))
        }}
        apiRequest={lastApiRequest || undefined}
      />
    </div>
  );
}
