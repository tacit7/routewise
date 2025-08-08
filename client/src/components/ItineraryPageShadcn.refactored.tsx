import React, { useMemo } from "react";
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
import type { ItineraryPlace } from "@/types/itinerary";
import { useItinerary } from "@/hooks/use-itinerary";

export default function ItineraryPageShadcnRefactored({ mapsApiKey }: { mapsApiKey?: string }) {
  const [, setLocation] = useLocation();
  const { tripPlaces } = useTripPlaces();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const {
    state: { days, activeDay, tripTitle },
    setActiveDay, setTitle, addDay,
    assignPlace, removePlace, updatePlace,
    assignedIds,
  } = useItinerary();

  const itineraryPlaces: ItineraryPlace[] = useMemo(() =>
    tripPlaces.map((p) => ({ ...p, dayIndex: undefined, dayOrder: undefined, notes: undefined })), [tripPlaces]);

  const unassigned = useMemo(() => itineraryPlaces.filter(p => !assignedIds.has(p.placeId ?? p.id)), [itineraryPlaces, assignedIds]);

  if (tripPlaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Trip Places Found</CardTitle>
            <CardDescription>You need to add places to your trip first.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/route-results")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Route Results
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="bg-card border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/route-results")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Route Results
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Input type="text" placeholder="My Trip" value={tripTitle} onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold h-auto py-1 px-2 border-0 shadow-none focus-visible:ring-0" style={{ minWidth: "200px" }} />
              </div>
              <p className="text-sm text-muted-foreground">
                Organize your {tripPlaces.length} saved places into daily plans
                {!isAuthenticated && <Badge variant="secondary" className="ml-2">Sign in to save</Badge>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Save wiring left as-is in your project */}
            <Button
              onClick={isAuthenticated ? () => {} : () => setLocation("/")}
              variant={isAuthenticated ? "default" : "secondary"}
            >
              {isAuthenticated ? (<><Save className="h-4 w-4 mr-2" />Save Trip</>) : (<><LogIn className="h-4 w-4 mr-2" />Sign In to Save</>)}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={`day-${activeDay}`} onValueChange={(v) => setActiveDay(parseInt(v.replace("day-", "")))} className="flex-1 flex flex-col">
        <div className="bg-card border-b px-6">
          <TabsList className="h-auto p-0 bg-transparent">
            {days.map((_, i) => (
              <TabsTrigger key={i} value={`day-${i}`} className="rounded-b-none data-[state=active]:bg-background data-[state=active]:shadow-none">
                Day {i + 1}
              </TabsTrigger>
            ))}
            <Button variant="ghost" size="sm" onClick={addDay} className="ml-2">
              <Plus className="h-4 w-4" />
            </Button>
          </TabsList>
        </div>

        <div className="flex-1 flex">
          <DailyItinerarySidebar
            day={days[activeDay] ?? days[0]}
            dayIndex={activeDay}
            onPlaceUpdate={updatePlace}
            onPlaceRemove={removePlace}
            onPlaceAssignment={assignPlace}
          />
          <TripPlacesGrid places={unassigned} onPlaceReturn={removePlace} mapsApiKey={mapsApiKey} />
        </div>
      </Tabs>
    </div>
  );
}
