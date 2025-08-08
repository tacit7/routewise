// this file is at client/src/pages dir

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Poi } from "@shared/schema";
import { ArrowLeft, Check, Clock, Eye, EyeOff, GripVertical, LogIn, Map, Plus, Save } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth-context";
import { InteractiveMap } from "@/components/interactive-map";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTripPlaces } from "@/hooks/use-trip-places";

// Extended interface for itinerary organization
export interface ItineraryPlace extends Poi {
  dayIndex?: number;
  scheduledTime?: string; // Format: "HH:MM" (24-hour)
  dayOrder?: number;
  notes?: string;
}

// Sortable Place Item Component
const SortablePlaceItem = ({
  place,
  onTimeChange,
  onRemove,
}: {
  place: ItineraryPlace;
  onTimeChange: (placeId: string | number, newTime: string) => void;
  onRemove: (placeId: string | number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: place.placeId || place.id,
    data: {
      type: "place",
      place,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTimeChange = (newTime: string) => {
    onTimeChange(place.placeId || place.id, newTime);
  };

  return (
    <div ref={setNodeRef} style={style} className={`itinerary-card group ${isDragging ? "itinerary-card-dragging" : ""}`}>
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3 p-3 pb-0">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>
            {place.name}
          </div>
          <div className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
            {place.category}
          </div>
        </div>

        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 transition-colors">
          <GripVertical className="h-4 w-4 transition-colors" style={{ color: "var(--text-muted)" }} />
        </div>
      </div>

      {/* Body Row */}
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-3">
          {/* Time pill */}
          <div className="time-pill">
            <Clock className="h-3 w-3 mr-2 inline" style={{ color: "var(--text-muted)" }} />
            <input
              type="time"
              value={place.scheduledTime || "09:00"}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="bg-transparent border-none outline-none text-sm"
              style={{ color: "var(--text)" }}
            />
          </div>

          {/* Rating pill */}
          {place.rating && (
            <div className="rating-pill">
              <span style={{ color: "var(--warning)" }}>⭐</span>
              <span>{place.rating}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(place.placeId || place.id)}
          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-red-50 hover:text-red-500"
          style={{ color: "var(--text-muted)" }}
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export interface DayData {
  date: Date;
  title?: string;
  places: ItineraryPlace[];
  mileage?: number;
  driveTime?: string;
}

// Temporary placeholder components - will be built separately
const DayTabNavigation = ({
  days,
  activeDay,
  onDaySelect,
  onAddDay,
}: {
  days: DayData[];
  activeDay: number;
  onDaySelect: (index: number) => void;
  onAddDay: () => void;
}) => (
  <div
    className="border-b px-6 py-3"
    style={{
      background: "var(--surface)",
      borderColor: "var(--border)",
    }}
  >
    <div className="flex items-center gap-2 overflow-x-auto">
      {days.map((day, index) => (
        <button
          key={index}
          onClick={() => onDaySelect(index)}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
            activeDay === index ? "day-tab-active" : "day-tab"
          }`}
        >
          Day {index + 1}
          {day.title && <span className="ml-1 opacity-75">- {day.title}</span>}
        </button>
      ))}
      <button onClick={onAddDay} className="flex-shrink-0 px-3 py-2 rounded-lg day-tab">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const DailyItinerarySidebar = ({
  day,
  dayIndex,
  onPlaceUpdate,
  onPlaceRemove,
  onPlaceAssignment,
  onPlaceReorder,
  mapsApiKey,
}: {
  day: DayData;
  dayIndex: number;
  onPlaceUpdate?: (placeId: string | number, updates: Partial<ItineraryPlace>) => void;
  onPlaceRemove?: (placeId: string | number) => void;
  onPlaceAssignment?: (place: ItineraryPlace, dayIndex: number) => void;
  onPlaceReorder?: (dayIndex: number, places: ItineraryPlace[]) => void;
  mapsApiKey?: string;
}) => {
  const [draggedOver, setDraggedOver] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(true);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(false);
    const placeData = e.dataTransfer.getData("application/json");
    if (placeData) {
      const place = JSON.parse(placeData) as ItineraryPlace;

      // If place is already in itinerary (has dayIndex), remove it first
      if (place.dayIndex !== undefined) {
        onPlaceRemove?.(place.placeId || place.id);
      }

      onPlaceAssignment?.(place, dayIndex);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDraggedOver(false);
    }
  };

  const handleTimeChange = (placeId: string | number, newTime: string) => {
    onPlaceUpdate?.(placeId, { scheduledTime: newTime });
  };

  // Use dayOrder for sorting instead of time, fallback to time if no dayOrder
  const sortedPlaces = [...day.places].sort((a, b) => {
    if (a.dayOrder !== undefined && b.dayOrder !== undefined) {
      return a.dayOrder - b.dayOrder;
    }
    const timeA = a.scheduledTime || "00:00";
    const timeB = b.scheduledTime || "00:00";
    return timeA.localeCompare(timeB);
  });

  const placeIds = sortedPlaces.map((place) => place.placeId || place.id);

  return (
    <div
      className="w-96 h-full overflow-y-auto"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Section Header */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              Day {dayIndex + 1}
            </h2>
            {day.title && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {day.title}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {day.date.toLocaleDateString()}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsMapVisible(!isMapVisible)} className="flex items-center gap-1">
            {isMapVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Drop zone for places */}
      <div className="p-4">
        <div
          className={`min-h-32 p-4 transition-all ${draggedOver ? "drop-zone-active" : "drop-zone"}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {sortedPlaces.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
                Drag places here to start your day
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Set custom times for each place
              </p>
            </div>
          )}

          {sortedPlaces.length > 0 && (
            <SortableContext items={placeIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {sortedPlaces.map((place) => (
                  <SortablePlaceItem
                    key={place.placeId || place.id}
                    place={place}
                    onTimeChange={handleTimeChange}
                    onRemove={onPlaceRemove!}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>

      {/* Map Section */}
      {isMapVisible && sortedPlaces.length > 0 && (
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            Day {dayIndex + 1} Route
          </h3>
          <div className="h-64 itinerary-card overflow-hidden">
            {mapsApiKey ? (
              <InteractiveMap
                startCity={sortedPlaces[0]?.address?.split(",")[0] || sortedPlaces[0]?.name || ""}
                endCity={sortedPlaces[sortedPlaces.length - 1]?.address?.split(",")[0] || sortedPlaces[sortedPlaces.length - 1]?.name || ""}
                checkpoints={[]}
                pois={sortedPlaces}
                selectedPoiIds={[]}
                hoveredPoi={null}
                onPoiClick={() => {}}
                onPoiSelect={() => {}}
                height="100%"
                className="w-full h-full"
                apiKey={mapsApiKey}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center p-4">
                  <Map className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">Map not available</p>
                  <p className="text-xs text-gray-500">Google Maps API key not found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TripPlacesGrid = ({ places, onPlaceReturn }: { places: ItineraryPlace[]; onPlaceReturn?: (placeId: string | number) => void }) => {
  const [draggedItem, setDraggedItem] = useState<ItineraryPlace | null>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const handleDragStart = (e: React.DragEvent, place: ItineraryPlace) => {
    e.dataTransfer.setData("application/json", JSON.stringify(place));
    e.dataTransfer.effectAllowed = "copy";
    setDraggedItem(place);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(false);
    const placeData = e.dataTransfer.getData("application/json");
    console.log("Drop received in TripPlacesGrid:", placeData);
    if (placeData) {
      const place = JSON.parse(placeData) as ItineraryPlace;
      console.log("Parsed place:", place.name, "dayIndex:", place.dayIndex);
      // If place is from itinerary (has dayIndex), return it to available places
      if (place.dayIndex !== undefined) {
        console.log("Returning place to grid:", place.name);
        onPlaceReturn?.(place.placeId || place.id);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggedOver(false);
    }
  };

  return (
    <div
      className={`flex-1 p-6 overflow-y-auto transition-colors ${isDraggedOver ? "bg-blue-50" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {places.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Check className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--primary)" }} />
            <p className="text-lg font-medium mb-2" style={{ color: "var(--text)" }}>
              All places scheduled!
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              You've successfully organized all your trip places into daily itineraries.
            </p>
          </div>
        </div>
      ) : (
        <div className="trip-places-panel mb-4">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
            Your Trip Places
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Drag places to schedule them, or drag scheduled places back here to unschedule
          </p>

          {isDraggedOver && (
            <div
              className="mb-4 p-3 rounded border-2 border-dashed"
              style={{
                borderColor: "var(--primary-200)",
                background: "var(--primary-50)",
                color: "var(--text-muted)",
              }}
            >
              Drop here to unschedule this place
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.map((place) => (
              <div
                key={place.id}
                className={`itinerary-card overflow-hidden cursor-move ${draggedItem?.id === place.id ? "itinerary-card-dragging" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, place)}
                onDragEnd={handleDragEnd}
                onMouseEnter={() => handlePoiHover(place)}
                onMouseLeave={() => handlePoiHover(null)}
              >
                {place.imageUrl && <img src={place.imageUrl} alt={place.name} className="w-full h-32 object-cover rounded-t-2xl" />}
                <div className="p-3">
                  {/* Header Row */}
                  <div className="mb-3">
                    <h3 className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>
                      {place.name}
                    </h3>
                    <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                      {place.category}
                    </p>
                  </div>

                  {/* Body Row */}
                  <div className="flex items-center justify-between">
                    {place.rating && (
                      <div className="rating-pill">
                        <span style={{ color: "var(--warning)" }}>⭐</span>
                        <span>{place.rating}</span>
                      </div>
                    )}
                    <GripVertical className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ItineraryPage() {
  const [, setLocation] = useLocation();
  const { tripPlaces } = useTripPlaces();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [activeDay, setActiveDay] = useState(0);
  const [days, setDays] = useState<DayData[]>([
    {
      date: new Date(),
      title: "",
      places: [],
    },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [tripTitle, setTripTitle] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | number | null>(null);

  // Drag sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag distance before activating
      },
    }),
  );

  // Track which places are already assigned to avoid duplicates
  const [assignedPlaceIds, setAssignedPlaceIds] = useState<Set<string | number>>(new Set());

  // Get maps API key from route results (similar to route-results page)
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);

  useEffect(() => {
    let foundApiKey = null;

    // First, try to get API key from stored route data (set by route-results page)
    const storedRouteData = localStorage.getItem("routeData");
    if (storedRouteData && !foundApiKey) {
      try {
        const routeData = JSON.parse(storedRouteData);
        // Phoenix API returns maps_api_key in the route data
        if (routeData.maps_api_key) {
          foundApiKey = routeData.maps_api_key;
          console.log("✅ Using maps API key from route data");
        } else if (routeData.routeData?.maps_api_key) {
          // Sometimes nested in routeData
          foundApiKey = routeData.routeData.maps_api_key;
          console.log("✅ Using maps API key from nested route data");
        }
      } catch (error) {
        console.log("❌ Could not parse route data for API key:", error);
      }
    }

    // Also check explore data as fallback
    const storedExploreData = localStorage.getItem("exploreData");
    if (!foundApiKey && storedExploreData) {
      try {
        const exploreData = JSON.parse(storedExploreData);
        if (exploreData.maps_api_key) {
          foundApiKey = exploreData.maps_api_key;
          console.log("✅ Using maps API key from explore data");
        }
      } catch (error) {
        console.log("❌ Could not parse explore data for API key:", error);
      }
    }

    if (foundApiKey) {
      setMapsApiKey(foundApiKey);
    } else {
      console.log("⚠️ No maps API key found in localStorage");
    }
  }, []);

  // Load persisted itinerary data on mount
  useEffect(() => {
    const savedItinerary = localStorage.getItem("itineraryData");
    if (savedItinerary) {
      try {
        const { days: savedDays, activeDay: savedActiveDay, tripTitle: savedTripTitle } = JSON.parse(savedItinerary);
        if (savedDays && Array.isArray(savedDays)) {
          // Convert date strings back to Date objects
          const restoredDays = savedDays.map((day: any) => ({
            ...day,
            date: new Date(day.date),
          }));
          setDays(restoredDays);
          setActiveDay(savedActiveDay || 0);
          setTripTitle(savedTripTitle || "");

          // Rebuild assigned place IDs
          const assignedIds = new Set<string | number>();
          restoredDays.forEach((day: DayData) => {
            day.places.forEach((place) => {
              const identifier = place.placeId || place.id;
              if (identifier) assignedIds.add(identifier);
            });
          });
          setAssignedPlaceIds(assignedIds);
        }
      } catch (error) {
        console.error("Failed to load saved itinerary:", error);
      }
    }
  }, []);

  // Persist itinerary data whenever it changes
  useEffect(() => {
    const itineraryData = {
      days,
      activeDay,
      tripTitle,
    };
    localStorage.setItem("itineraryData", JSON.stringify(itineraryData));
  }, [days, activeDay, tripTitle]);

  // Convert trip places to itinerary places
  const itineraryPlaces: ItineraryPlace[] = tripPlaces.map((place) => ({
    ...place,
    dayIndex: undefined,
    timeOfDay: undefined,
    dayOrder: undefined,
    notes: undefined,
  }));

  const handleAddDay = () => {
    const newDay: DayData = {
      date: new Date(Date.now() + days.length * 24 * 60 * 60 * 1000), // Add days
      title: "",
      places: [],
    };
    setDays([...days, newDay]);
    setActiveDay(days.length); // Switch to new day
  };

  const handlePlaceAssignment = (place: ItineraryPlace, dayIndex: number) => {
    const placeIdentifier = place.placeId || place.id;

    // Check if place is already assigned
    if (assignedPlaceIds.has(placeIdentifier)) {
      toast({
        title: "Already assigned",
        description: `${place.name} is already assigned to a day.`,
        variant: "destructive",
      });
      return;
    }

    const updatedPlace: ItineraryPlace = {
      ...place,
      dayIndex,
      scheduledTime: "09:00", // Default time
      dayOrder: days[dayIndex].places.length, // Add to end of day
    };

    setDays((prevDays) => {
      const newDays = [...prevDays];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        places: [...newDays[dayIndex].places, updatedPlace],
      };
      return newDays;
    });

    setAssignedPlaceIds((prev) => new Set([...Array.from(prev), placeIdentifier]));

    toast({
      title: "Place added!",
      description: `${place.name} added to Day ${dayIndex + 1}.`,
    });
  };

  const handlePlaceRemove = (placeId: string | number) => {
    setDays((prevDays) =>
      prevDays.map((day) => ({
        ...day,
        places: day.places.filter((p) => {
          const identifier = p.placeId || p.id;
          return identifier !== placeId;
        }),
      })),
    );

    setAssignedPlaceIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(placeId);
      return newSet;
    });

    toast({
      title: "Place removed",
      description: "Place has been removed from your itinerary.",
    });
  };

  const handlePlaceUpdate = (placeId: string | number, updates: Partial<ItineraryPlace>) => {
    setDays((prevDays) =>
      prevDays.map((day) => ({
        ...day,
        places: day.places.map((place) => {
          const identifier = place.placeId || place.id;
          if (identifier === placeId) {
            return { ...place, ...updates };
          }
          return place;
        }),
      })),
    );
  };

  const handlePlaceReorder = (dayIndex: number, newPlaces: ItineraryPlace[]) => {
    setDays((prevDays) => {
      const newDays = [...prevDays];
      // Update dayOrder for each place based on new position
      const updatedPlaces = newPlaces.map((place, index) => ({
        ...place,
        dayOrder: index,
      }));
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        places: updatedPlaces,
      };
      return newDays;
    });
  };

  // Drag event handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Get the data from the dragged item
    const activeData = active.data.current;

    if (activeData?.type === "place") {
      // This is a place being reordered within a day
      const activePlace = activeData.place as ItineraryPlace;
      const activeDayIndex = activePlace.dayIndex;

      if (activeDayIndex !== undefined) {
        const activeDay = days[activeDayIndex];
        const oldIndex = activeDay.places.findIndex((p) => (p.placeId || p.id) === active.id);
        const newIndex = activeDay.places.findIndex((p) => (p.placeId || p.id) === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newPlaces = arrayMove(activeDay.places, oldIndex, newIndex);
          handlePlaceReorder(activeDayIndex, newPlaces);

          toast({
            title: "Place reordered",
            description: `${activePlace.name} moved to position ${newIndex + 1}`,
          });
        }
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over for potential future cross-day dragging
    // For now, we keep reordering within the same day
  };

  const handleGoBack = () => {
    setLocation("/route-results");
  };

  // Generate a default trip title based on the first and last cities
  const generateTripTitle = () => {
    const scheduledPlaces = days.flatMap((day) => day.places);
    if (scheduledPlaces.length === 0) return "My Trip";

    const cities = new Set<string>();
    scheduledPlaces.forEach((place) => {
      if (place.address) {
        // Extract city from address (simplified approach)
        const addressParts = place.address.split(",");
        if (addressParts.length > 1) {
          const city = addressParts[addressParts.length - 2]?.trim();
          if (city) cities.add(city);
        }
      }
    });

    const cityList = Array.from(cities);
    if (cityList.length === 0) return "My Trip";
    if (cityList.length === 1) return `${cityList[0]} Trip`;
    if (cityList.length === 2) return `${cityList[0]} to ${cityList[1]}`;
    return `${cityList[0]} to ${cityList[cityList.length - 1]} (+${cityList.length - 2} more)`;
  };

  // Save trip to backend
  const handleSaveTrip = async () => {
    if (days.every((day) => day.places.length === 0)) {
      toast({
        title: "Nothing to save",
        description: "Please add some places to your itinerary before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Generate route data from scheduled places
      const scheduledPlaces = days.flatMap((day) => day.places);
      const cities = new Set<string>();

      scheduledPlaces.forEach((place) => {
        if (place.address) {
          const addressParts = place.address.split(",");
          if (addressParts.length > 1) {
            const city = addressParts[addressParts.length - 2]?.trim();
            if (city) cities.add(city);
          }
        }
      });

      const cityList = Array.from(cities);
      const startCity = cityList[0] || "Unknown";
      const endCity = cityList[cityList.length - 1] || startCity;
      const checkpoints = cityList.slice(1, -1);

      // Prepare itinerary data with day organization
      const itineraryData = {
        days: days.map((day, index) => ({
          dayNumber: index + 1,
          date: day.date.toISOString(),
          title: day.title || `Day ${index + 1}`,
          places: day.places.map((place) => ({
            ...place,
            scheduledTime: place.scheduledTime || "09:00",
            notes: place.notes || "",
          })),
        })),
      };

      // Prepare trip data for API
      const tripData = {
        trip: {
          title: tripTitle || generateTripTitle(),
          startCity,
          endCity,
          checkpoints,
          routeData: {
            totalDays: days.length,
            totalPlaces: scheduledPlaces.length,
            itinerary: itineraryData,
          },
          poisData: scheduledPlaces.map((place) => ({
            id: place.id,
            placeId: place.placeId,
            name: place.name,
            address: place.address,
            category: place.category,
            rating: place.rating,
            reviewCount: place.reviewCount,
            scheduledTime: place.scheduledTime,
            dayIndex: place.dayIndex,
            notes: place.notes,
          })),
          isPublic: false,
        },
      };

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripData),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401) {
          toast({
            title: "Sign in required",
            description: "Please sign in to your account to save your trip. Your progress will be preserved.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.message || "Failed to save trip");
      }

      const savedTrip = await response.json();
      setLastSavedAt(new Date());

      toast({
        title: "Trip saved successfully!",
        description: `Your trip "${savedTrip.title}" has been saved with ${scheduledPlaces.length} places across ${days.length} days.`,
      });

      // Store the saved trip ID for future updates
      localStorage.setItem("savedTripId", savedTrip.id.toString());
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({
        title: "Failed to save trip",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (tripPlaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center p-8 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text)" }}>
            You've scheduled all your places
          </h1>
          <p className="mb-6" style={{ color: "var(--text-muted)" }}>
            Add more places to your trip or go back to see your route.
          </p>
          <Button
            onClick={handleGoBack}
            className="font-medium text-white transition-all"
            style={{
              backgroundColor: "var(--primary)",
              borderRadius: "var(--radius)",
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Route Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
        {/* Header */}
        <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="hover:bg-gray-100 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Route Results
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="text"
                    placeholder={generateTripTitle()}
                    value={tripTitle}
                    onChange={(e) => setTripTitle(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-none outline-none focus:bg-gray-50 rounded px-2 py-1 flex-1"
                    style={{
                      minWidth: "200px",
                      color: "var(--text)",
                    }}
                  />
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Organize your {tripPlaces.length} saved places into daily plans
                  {!isAuthenticated && (
                    <span className="ml-2" style={{ color: "var(--warning)" }}>
                      • Sign in to save your trip
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastSavedAt && (
                <div className="text-sm flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <Check className="h-4 w-4" style={{ color: "var(--success)" }} />
                  Saved {lastSavedAt.toLocaleTimeString()}
                </div>
              )}
              <Button
                onClick={
                  isAuthenticated
                    ? handleSaveTrip
                    : () => {
                        toast({
                          title: "Sign in to save your trip",
                          description: "Go to the home page to sign in with Google or create an account. Your progress is saved locally.",
                        });
                        setLocation("/");
                      }
                }
                disabled={isSaving || days.every((day) => day.places.length === 0)}
                className="font-medium text-white transition-all"
                style={{
                  backgroundColor: "var(--primary)",
                  borderRadius: "var(--radius)",
                }}
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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

        {/* Day Navigation */}
        <DayTabNavigation days={days} activeDay={activeDay} onDaySelect={setActiveDay} onAddDay={handleAddDay} />

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Daily Itinerary Sidebar */}
          <DailyItinerarySidebar
            day={days[activeDay] || days[0]}
            dayIndex={activeDay}
            onPlaceUpdate={handlePlaceUpdate}
            onPlaceRemove={handlePlaceRemove}
            onPlaceAssignment={handlePlaceAssignment}
            onPlaceReorder={handlePlaceReorder}
            mapsApiKey={mapsApiKey || undefined}
          />

          {/* Trip Places Grid */}
          <TripPlacesGrid
            places={itineraryPlaces.filter((place) => {
              const placeIdentifier = place.placeId || place.id;
              return !assignedPlaceIds.has(placeIdentifier);
            })}
            onPlaceReturn={handlePlaceRemove}
            mapsApiKey={mapsApiKey || undefined}
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragId ? (
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg opacity-90">
              <div className="font-medium text-sm">Reordering...</div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
