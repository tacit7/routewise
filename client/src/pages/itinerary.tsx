import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, LogIn, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/header/BackButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-context";
import DailyItinerarySidebar from "@/components/DailyItinerarySidebar";
import TripPlacesGrid from "@/components/TripPlacesGrid";
import type { DayData, ItineraryPlace } from "@/types/itinerary";
import { getIdentifier } from "@/utils/itinerary";
import { InteractiveMap } from "@/components/interactive-map";
import { TopNav } from "@/features/marketing/top-nav";

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

  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { tripPlaces } = useTripPlaces();

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
      <div className="bg-white px-6 py-4">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <Input
              type="text"
              placeholder="Search places..."
              className="w-full"
            />
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
    </div>
  );
}
