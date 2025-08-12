import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, LogIn, LogOut, Plus, Save, Settings, Share, User, X, UtensilsCrossed, Bed, Building, Gamepad2, MapPin, Search, Trees, Coffee, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/header/BackButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-context";
import { useAppDispatch, useAppSelector } from "@/store";
import { saveTrip } from "@/store/slices/tripSlice";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();
  const { tripPlaces } = useTripPlaces();
  const dispatch = useAppDispatch();
  const { loading: isSavingToServer } = useAppSelector(state => state.trips);

  // Developer debugging integration
  useEffect(() => {
    if (import.meta.env.DEV && (window as any).__devLog) {
      const devLog = (window as any).__devLog;
      
      // Log initial itinerary state
      devLog('Itinerary Page', 'Component Mounted', {
        totalDays: days.length,
        totalPlaces: days.reduce((sum, day) => sum + day.places.length, 0),
        unassignedPlaces: itineraryPlaces.length - assignedPlaceIds.size,
        tripTitle: tripTitle || generateTripTitle(),
        isAuthenticated
      });
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("itineraryData");
    if (saved) {
      try {
        const { days: rawDays, activeDay: rawActiveDay, tripTitle: rawTitle } = JSON.parse(saved);
        if (Array.isArray(rawDays)) {
          const restored = rawDays.map((d: any) => ({ ...d, date: new Date(d.date) }));
          setDays(restored);
          setActiveDay(rawActiveDay || 0);
          setTripTitle(rawTitle || "");
          const assigned = new Set<string | number>();
          restored.forEach((day: DayData) => day.places.forEach((p) => assigned.add(getIdentifier(p))));
          setAssignedPlaceIds(assigned);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("itineraryData", JSON.stringify({ days, activeDay, tripTitle }));
  }, [days, activeDay, tripTitle]);

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

    // Debug logging
    if (import.meta.env.DEV && (window as any).__devLog) {
      (window as any).__devLog('Itinerary', 'Place Assigned', {
        placeName: place.name,
        category: place.category,
        dayIndex: dayIndex + 1,
        totalPlacesInDay: days[dayIndex].places.length + 1
      });
    }
  };

  const handlePlaceRemove = (placeId: string | number) => {
    setDays((prev) => prev.map((d) => ({ ...d, places: d.places.filter((p) => getIdentifier(p) !== placeId) })));
    setAssignedPlaceIds((prev) => {
      const n = new Set(prev);
      n.delete(placeId);
      return n;
    });
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

  const handleSaveTrip = async () => {
    // Debug authentication state
    if (import.meta.env.DEV) {
      console.log('🔍 Save Trip Auth Debug:', {
        useAuthAuthenticated: isAuthenticated,
        user: user,
        hasGoogleToken: !!(window as any).google?.accounts,
        authManagerAuthenticated: (window as any).AuthManager?.isAuthenticated?.(),
        authManagerToken: (window as any).AuthManager?.getToken?.()
      });
    }

    if (!isAuthenticated) {
      setLocation("/");
      return;
    }

    if (days.every((d) => d.places.length === 0)) {
      toast({
        title: "Cannot Save Empty Trip",
        description: "Please add places to your itinerary before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Get meaningful start/end cities
      const getLocationName = (place?: ItineraryPlace): string => {
        if (!place) return "Unknown";
        if (place.address) {
          const parts = place.address.split(',');
          return parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim();
        }
        return place.name || "Unknown";
      };

      const firstDay = days[0];
      const lastDay = days[days.length - 1];
      const startCity = firstDay?.places.length > 0 ? getLocationName(firstDay.places[0]) : "Unknown";
      const endCity = lastDay?.places.length > 0 ? getLocationName(lastDay.places[lastDay.places.length - 1]) : "Unknown";

      // Format the trip data for saving
      const tripData = {
        route_data: {
          title: tripTitle || generateTripTitle(),
          days: days.map(day => ({
            ...day,
            date: day.date.toISOString(),
          })),
          total_places: days.reduce((sum, day) => sum + day.places.length, 0),
          duration_days: days.length,
          created_at: new Date().toISOString(),
        },
        start_city: startCity,
        end_city: endCity,
      };

      const result = await dispatch(saveTrip(tripData));
      
      if (saveTrip.fulfilled.match(result)) {
        setLastSavedAt(new Date());
        toast({
          title: "Trip Saved Successfully!",
          description: `Your trip "${tripTitle || generateTripTitle()}" has been saved.`,
        });
        
        // Debug logging
        if (import.meta.env.DEV && (window as any).__devLog) {
          (window as any).__devLog('Itinerary', 'Trip Saved Successfully', {
            tripTitle: tripTitle || generateTripTitle(),
            totalDays: days.length,
            totalPlaces: days.reduce((sum, day) => sum + day.places.length, 0),
            startCity,
            endCity
          });
        }
      } else if (saveTrip.rejected.match(result)) {
        throw new Error(result.payload as string || "Failed to save trip");
      }
    } catch (error) {
      console.error("Failed to save trip:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFilter = (category: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      const wasActive = newFilters.has(category);
      if (wasActive) {
        newFilters.delete(category);
      } else {
        newFilters.add(category);
      }
      
      // Debug logging
      if (import.meta.env.DEV && (window as any).__devLog) {
        (window as any).__devLog('Itinerary', 'Filter Toggled', {
          category,
          action: wasActive ? 'removed' : 'added',
          activeFilters: Array.from(newFilters),
          filteredCount: itineraryPlaces.filter(p => newFilters.size === 0 || newFilters.has(p.category)).length
        });
      }
      
      return newFilters;
    });
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

  const unassigned = useMemo(() => {
    let filtered = itineraryPlaces.filter((p) => !assignedPlaceIds.has(getIdentifier(p)));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((place) =>
        place.name.toLowerCase().includes(query) ||
        (place as any).description?.toLowerCase().includes(query) ||
        (place as any).address?.toLowerCase().includes(query) ||
        place.category.toLowerCase().includes(query)
      );
    }

    // Apply category filters
    if (activeFilters.size > 0) {
      filtered = filtered.filter((place) => activeFilters.has(place.category));
    }

    return filtered;
  }, [itineraryPlaces, assignedPlaceIds, searchQuery, activeFilters]);

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
      {/* Custom Navigation Bar */}
      <nav className="bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Add More Places */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="gap-2 hover:bg-[var(--surface-alt)] focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            style={{ color: 'var(--text)' }}
          >
            <Plus className="h-4 w-4" />
            Add More Places
          </Button>

          {/* Center: Trip Name Input */}
          <div className="flex-1 flex justify-center">
            <Input
              type="text"
              placeholder={generateTripTitle()}
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              className="text-center text-lg md:text-xl lg:text-2xl max-w-2xl border-0 shadow-none bg-transparent placeholder:text-gray-100 focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {/* Right: Save, Share, Avatar */}
          <div className="flex items-center gap-3">
            {/* Save Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveTrip}
                disabled={(isSaving || isSavingToServer) || days.every((d) => d.places.length === 0)}
                className="gap-2"
              >
                {(isSaving || isSavingToServer) ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></div>
                    Saving...
                  </>
                ) : isAuthenticated ? (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
              {lastSavedAt && isAuthenticated && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>

            {/* Share Button */}
            <Button variant="ghost" size="sm" className="gap-2">
              <Share className="h-4 w-4" />
              Share
            </Button>

            {/* Avatar with Dropdown */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.picture} alt={user.name || user.email} />
                      <AvatarFallback className="text-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>


      <Tabs value={`day-${activeDay}`} onValueChange={(v) => setActiveDay(parseInt(v.replace("day-", "")))} className="flex-1 flex flex-col">
        <div className="flex" style={{ backgroundColor: 'var(--surface)' }}>
          {/* Left Container - Tabs */}
          <div className="w-96 px-6 border-r" style={{ borderColor: 'var(--border)' }}>
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
          
          {/* Right Container - Search and Filters */}
          <div className="flex-1 px-6 flex items-center gap-3">
            {/* Search Field */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 w-48 text-sm"
              />
            </div>
            
            {/* Icon-only filters */}
            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleFilter("restaurant")}
                      className={`w-8 h-8 p-0 transition-colors ${
                        activeFilters.has("restaurant")
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <UtensilsCrossed className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Food</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleFilter("tourist_attraction")}
                      className={`w-8 h-8 p-0 transition-colors ${
                        activeFilters.has("tourist_attraction")
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Attractions</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleFilter("lodging")}
                      className={`w-8 h-8 p-0 transition-colors ${
                        activeFilters.has("lodging")
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <Bed className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lodging</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleFilter("museum")}
                      className={`w-8 h-8 p-0 transition-colors ${
                        activeFilters.has("museum")
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <Building className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Culture</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleFilter("amusement_park")}
                      className={`w-8 h-8 p-0 transition-colors ${
                        activeFilters.has("amusement_park")
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <Gamepad2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Entertainment</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleFilter("park")}
                      className={`w-8 h-8 p-0 transition-colors ${
                        activeFilters.has("park")
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <Trees className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Parks</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleFilter("cafe")}
                      className={`w-8 h-8 p-0 transition-colors ${
                        activeFilters.has("cafe")
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <Coffee className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cafes</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleFilter("bar")}
                      className={`w-8 h-8 p-0 transition-colors ${
                        activeFilters.has("bar")
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <Wine className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bars</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
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
          <TripPlacesGrid places={unassigned} onPlaceReturn={handlePlaceRemove} />
          )
          }
          </div>
        </div>
      </Tabs>

      {/* Developer FAB - Development only */}
      <DeveloperFab />
    </div>
  );
}
