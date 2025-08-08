import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, LogIn, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function ItineraryPageShadcn({ mapsApiKey }: { mapsApiKey?: string }) {
  const [, setLocation] = useLocation();

  const [showMap, setShowMap] = useState<boolean>(() => {
  try { return JSON.parse(localStorage.getItem("itinerary.showMap") || "false"); } catch { return false; }
});

useEffect(() => localStorage.setItem("itinerary.showMap", JSON.stringify(showMap)), [showMap]);
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

  if (itineraryPlaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Trip Places Found</CardTitle>
            <CardDescription>You need to add places to your trip first.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Route Results
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const unassigned = useMemo(
    () => itineraryPlaces.filter((p) => !assignedPlaceIds.has(getIdentifier(p))),
    [itineraryPlaces, assignedPlaceIds]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="bg-card border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Route Results
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Input
                  type="text"
                  placeholder={generateTripTitle()}
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  className="text-2xl font-bold h-auto py-1 px-2 border-0 shadow-none focus-visible:ring-0"
                  style={{ minWidth: "200px" }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Organize your {itineraryPlaces.length} saved places into daily plans
                {!isAuthenticated && <Badge variant="secondary" className="ml-2">Sign in to save</Badge>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastSavedAt && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Check className="h-4 w-4" />
                Saved {lastSavedAt.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={isAuthenticated ? () => {} : () => setLocation("/")}
              disabled={isSaving || days.every((d) => d.places.length === 0)}
              variant={isAuthenticated ? "default" : "secondary"}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Saving...
                </>
              ) : isAuthenticated ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Trip
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In to Save
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={`day-${activeDay}`} onValueChange={(v) => setActiveDay(parseInt(v.replace("day-", "")))} className="flex-1 flex flex-col">
        <div className="bg-card border-b px-6">
          <TabsList className="h-auto p-0 bg-transparent">
            {days.map((day, index) => (
              <TabsTrigger key={index} value={`day-${index}`} className="rounded-b-none data-[state=active]:bg-background data-[state=active]:shadow-none">
                Day {index + 1}{day.title && <span className="ml-1 opacity-75">- {day.title}</span>}
              </TabsTrigger>
            ))}

            <Button variant="ghost" size="sm" onClick={handleAddDay} className="ml-2">
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
          />
          <TripPlacesGrid places={unassigned} onPlaceReturn={handlePlaceRemove} />
        </div>
      </Tabs>
    </div>
  );
}
