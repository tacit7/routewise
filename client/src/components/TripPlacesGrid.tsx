import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, EyeOff, MapPin, Star } from "lucide-react";
import type { ItineraryPlace } from "@/types/itinerary";
import { getIdentifier } from "@/utils/itinerary";
import { InteractiveMap } from "@/components/interactive-map";

export default function TripPlacesGrid({
  places,
  onPlaceReturn,
  mapsApiKey,
}: {
  places: ItineraryPlace[];
  onPlaceReturn?: (placeId: string | number) => void;
  mapsApiKey?: string;
}) {
  const [draggedItem, setDraggedItem] = useState<ItineraryPlace | null>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [showMap, setShowMap] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("tripPlaces.showMap") || "false"); }
    catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem("tripPlaces.showMap", JSON.stringify(showMap));
  }, [showMap]);

  return (
    <div
      className={`flex-1 p-6 transition-colors ${isDraggedOver ? "bg-primary/5" : ""}`}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggedOver(false);
        const placeData = e.dataTransfer.getData("application/json");
        if (!placeData) return;
        const place = JSON.parse(placeData) as ItineraryPlace;
        if (place.dayIndex !== undefined) {
          onPlaceReturn?.(getIdentifier(place));
        }
      }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDragEnter={() => setIsDraggedOver(true)}
      onDragLeave={(e) => {
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
          setIsDraggedOver(false);
        }
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-1">Your Trip Places</h2>
          <p className="text-muted-foreground text-sm">
            Drag places to schedule them, or drag scheduled places back here to unschedule
          </p>
        </div>
      </div>
      {showMap && mapsApiKey && places.length > 0 && (
        <div className="h-64 rounded-2xl overflow-hidden mb-4">
          <InteractiveMap
            startCity=""
            endCity=""
            checkpoints={[]}
            pois={places}
            selectedPoiIds={[]}
            hoveredPoi={null}
            onPoiClick={() => {}}
            onPoiSelect={() => {}}
            height="100%"
            className="w-full h-full"
            apiKey={mapsApiKey}
          />
        </div>
      )}
      {isDraggedOver && (
        <Card className="mt-2 border-primary bg-primary/10">
          <CardContent className="p-2">
            <p className="text-primary text-sm">Drop here to unschedule this place</p>
          </CardContent>
        </Card>
      )}
      <ScrollArea className="h-[calc(100vh-200px)] mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <Card
              key={getIdentifier(place)}
              className={`overflow-hidden hover:shadow-md transition-all cursor-move ${draggedItem && getIdentifier(draggedItem) === getIdentifier(place) ? "opacity-50 scale-95" : ""}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify(place));
                e.dataTransfer.effectAllowed = "copy";
                setDraggedItem(place);
              }}
              onDragEnd={() => setDraggedItem(null)}
            >
              {(place as any).imageUrl && (
                <div className="aspect-video relative overflow-hidden">
                  <img src={(place as any).imageUrl} alt={place.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{place.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{place.category}</Badge>
                  {place.rating && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      <span>{place.rating}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                {(place as any).address && (
                  <div className="flex items-start text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1 mt-0.5" />
                    <span className="line-clamp-2">{(place as any).address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
