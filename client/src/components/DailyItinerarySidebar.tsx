import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, GripVertical, Star, Trash2 } from "lucide-react";
import type { DayData, ItineraryPlace } from "@/types/itinerary";
import { getIdentifier, sortByTime } from "@/utils/itinerary";
import { Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function DailyItinerarySidebar({
  day,
  dayIndex,
  onPlaceUpdate,
  onPlaceRemove,
  onPlaceAssignment,
  showMap,
  onToggleMap,
}: {
  day: DayData;
  dayIndex: number;
  onPlaceUpdate?: (placeId: string | number, updates: Partial<ItineraryPlace>) => void;
  onPlaceRemove?: (placeId: string | number) => void;
  onPlaceAssignment?: (place: ItineraryPlace, dayIndex: number) => void;
  showMap: boolean;
  onToggleMap: () => void;
}) {
  const [draggedOver, setDraggedOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(false);
    const placeData = e.dataTransfer.getData("application/json");
    if (!placeData) return;
    const place = JSON.parse(placeData) as ItineraryPlace;
    if (place.dayIndex !== undefined) onPlaceRemove?.(getIdentifier(place));
    onPlaceAssignment?.(place, dayIndex);
  };

  const sortedPlaces = sortByTime(day.places);

  return (
    <Card className="w-96 h-full rounded-none border-0 border-r">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Day {dayIndex + 1}</span>
                <Button
        variant="ghost"
        size="icon"
        onClick={onToggleMap}
        aria-pressed={showMap}
        aria-label="Toggle map"
        title={showMap ? "Hide map" : "Show map"}
         >
        <MapIcon
          className={`h-4 w-4 ${showMap ? "text-green-500" : "text-gray-400"}`}
        />
      </Button>
        </CardTitle>
        {day.title && <CardDescription>{day.title}</CardDescription>}
        <CardDescription className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {day.date.toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div
          className={`min-h-32 border-2 border-dashed rounded-lg p-4 transition-colors bg-bg ${
            draggedOver ? "border-primary !bg-primary/5" : "border-border hover:border-muted-fg"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragEnter={() => setDraggedOver(true)}
          onDragLeave={(e) => {
            if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
              setDraggedOver(false);
            }
          }}
        >
          {sortedPlaces.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Drag places here to schedule them</p>
              <p className="text-xs text-muted-foreground mt-1">Set custom times for each place</p>
            </div>
          )}
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-3">
              {sortedPlaces.map((place) => (
                <Card
                  key={getIdentifier(place)}
                  className="group cursor-move hover:shadow-sm transition-shadow"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/json", JSON.stringify(place));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* POI Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={(place as any).imageUrl || '/placeholder-poi.jpg'}
                          alt={place.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1">{place.name}</div>
                        {(place as any).description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                            {(place as any).description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">{place.category}</Badge>
                          {place.rating && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                              <span>{place.rating}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={place.scheduledTime || "09:00"}
                            onChange={(e) => onPlaceUpdate?.(getIdentifier(place), { scheduledTime: e.target.value })}
                            className="h-7 w-24 text-sm"
                          />
                        </div>
                        {place.rating && (
                          <div className="flex items-center text-xs text-muted-foreground mt-2">
                            <Star className="h-3 w-3 mr-1" />
                            <span>{place.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent><p>Drag to reorder</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onPlaceRemove?.(getIdentifier(place))}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent><p>Remove from itinerary</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
