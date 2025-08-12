import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, EyeOff, MapPin, Star } from "lucide-react";
import type { ItineraryPlace } from "@/types/itinerary";
import { getIdentifier } from "@/utils/itinerary";
import { InteractiveMap } from "@/components/interactive-map";
import { useDraggable, useDroppable } from "@dnd-kit/core";

function DraggablePlaceCard({ place }: { place: ItineraryPlace }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: getIdentifier(place),
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? 0.95 : 1,
  } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`overflow-hidden hover:shadow-md transition-all cursor-move ${isDragging ? "shadow-lg z-10" : ""}`}
    >
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={(place as any).imageUrl || '/placeholder-poi.jpg'} 
          alt={place.name} 
          className="w-full h-full object-cover" 
        />
        {/* Category badge on image */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs bg-black/60 text-white backdrop-blur-sm border-0">
            {place.category.charAt(0).toUpperCase() + place.category.slice(1).replace('_', ' ')}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{place.name}</CardTitle>
        {(place as any).description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {(place as any).description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {place.rating && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
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
  );
}

export default function TripPlacesGrid({
  places,
  onPlaceReturn,
  mapsApiKey,
}: {
  places: ItineraryPlace[];
  onPlaceReturn?: (placeId: string | number) => void;
  mapsApiKey?: string;
}) {
  const [showMap, setShowMap] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("tripPlaces.showMap") || "false"); }
    catch { return false; }
  });

  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned-drop-zone',
  });

  useEffect(() => {
    localStorage.setItem("tripPlaces.showMap", JSON.stringify(showMap));
  }, [showMap]);

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-6 border-t transition-colors ${isOver ? "bg-primary/5" : ""}`}
    >
      {showMap && places.length > 0 && (
        <div className="h-64 rounded-2xl overflow-hidden mb-4">
          <InteractiveMap
            initialViewport={{
              north: 40.7829,
              south: 40.7489,
              east: -73.9441,
              west: -73.9901
            }}
            initialZoom={10}
            filters={{
              min_rating: 3.0,
            }}
            height="100%"
            className="w-full h-full"
            apiKey={mapsApiKey}
          />
        </div>
      )}
      {isOver && (
        <Card className="mt-2 border-primary bg-primary/10">
          <CardContent className="p-2">
            <p className="text-primary text-sm">Drop here to unschedule this place</p>
          </CardContent>
        </Card>
      )}
      <ScrollArea className="h-[calc(100vh-200px)] mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <DraggablePlaceCard key={getIdentifier(place)} place={place} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
