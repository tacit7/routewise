import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Plus, GripVertical, Save, Check, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTripPlaces } from '@/hooks/use-trip-places';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-context';
import { Clock } from 'lucide-react';
import type { Poi } from '@shared/schema';

// Extended interface for itinerary organization
export interface ItineraryPlace extends Poi {
  dayIndex?: number;
  scheduledTime?: string; // Format: "HH:MM" (24-hour)
  dayOrder?: number;
  notes?: string;
}

export interface DayData {
  date: Date;
  title?: string;
  places: ItineraryPlace[];
  mileage?: number;
  driveTime?: string;
}

// Temporary placeholder components - will be built separately
const DayTabNavigation = ({ days, activeDay, onDaySelect, onAddDay }: {
  days: DayData[];
  activeDay: number;
  onDaySelect: (index: number) => void;
  onAddDay: () => void;
}) => (
  <div className="border-b bg-white px-6 py-3">
    <div className="flex items-center gap-2 overflow-x-auto">
      {days.map((day, index) => (
        <button
          key={index}
          onClick={() => onDaySelect(index)}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeDay === index
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Day {index + 1}
          {day.title && (
            <span className="ml-1 opacity-75">- {day.title}</span>
          )}
        </button>
      ))}
      <button
        onClick={onAddDay}
        className="flex-shrink-0 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
      >
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
  onPlaceAssignment
}: {
  day: DayData;
  dayIndex: number;
  onPlaceUpdate?: (placeId: string | number, updates: Partial<ItineraryPlace>) => void;
  onPlaceRemove?: (placeId: string | number) => void;
  onPlaceAssignment?: (place: ItineraryPlace, dayIndex: number) => void;
}) => {
  const [draggedOver, setDraggedOver] = useState(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(false);
    const placeData = e.dataTransfer.getData('application/json');
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
    e.dataTransfer.dropEffect = 'copy';
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

  // Sort places by scheduled time
  const sortedPlaces = [...day.places].sort((a, b) => {
    const timeA = a.scheduledTime || '00:00';
    const timeB = b.scheduledTime || '00:00';
    return timeA.localeCompare(timeB);
  });


  return (
    <div className="w-96 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Day {dayIndex + 1}</h2>
        {day.title && <p className="text-sm text-gray-600">{day.title}</p>}
        <p className="text-xs text-gray-500">
          {day.date.toLocaleDateString()}
        </p>
      </div>
      
      {/* Drop zone for places */}
      <div className="p-4">
        <div 
          className={`min-h-32 border-2 border-dashed rounded-lg p-4 transition-colors ${
            draggedOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {sortedPlaces.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drag places here to schedule them</p>
              <p className="text-xs text-gray-400">Set custom times for each place</p>
            </div>
          )}
          
          <div className="space-y-3">
            {sortedPlaces.map((place) => (
              <div
                key={place.placeId || place.id}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow group cursor-move"
                draggable
                onDragStart={(e) => {
                  console.log('Dragging place from sidebar:', place.name);
                  e.dataTransfer.setData('application/json', JSON.stringify(place));
                  e.dataTransfer.effectAllowed = 'move';
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">{place.name}</div>
                    <div className="text-xs text-gray-500 capitalize mb-2">{place.category}</div>
                    
                    {/* Time input */}
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <input
                        type="time"
                        value={place.scheduledTime || '09:00'}
                        onChange={(e) => handleTimeChange(place.placeId || place.id, e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {place.rating && (
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="text-yellow-500">⭐</span>
                        <span className="ml-1">{place.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      onClick={() => onPlaceRemove?.(place.placeId || place.id)}
                      className="text-gray-400 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TripPlacesGrid = ({ places, onPlaceReturn }: { 
  places: ItineraryPlace[]; 
  onPlaceReturn?: (placeId: string | number) => void;
}) => {
  const [draggedItem, setDraggedItem] = useState<ItineraryPlace | null>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const handleDragStart = (e: React.DragEvent, place: ItineraryPlace) => {
    e.dataTransfer.setData('application/json', JSON.stringify(place));
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedItem(place);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(false);
    const placeData = e.dataTransfer.getData('application/json');
    console.log('Drop received in TripPlacesGrid:', placeData);
    if (placeData) {
      const place = JSON.parse(placeData) as ItineraryPlace;
      console.log('Parsed place:', place.name, 'dayIndex:', place.dayIndex);
      // If place is from itinerary (has dayIndex), return it to available places
      if (place.dayIndex !== undefined) {
        console.log('Returning place to grid:', place.name);
        onPlaceReturn?.(place.placeId || place.id);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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
      className={`flex-1 p-6 overflow-y-auto transition-colors ${
        isDraggedOver ? 'bg-blue-50' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Your Trip Places</h2>
        <p className="text-gray-600 text-sm">
          Drag places to schedule them, or drag scheduled places back here to unschedule
        </p>
        {isDraggedOver && (
          <div className="mt-2 p-2 bg-blue-100 border border-blue-200 rounded text-blue-700 text-sm">
            Drop here to unschedule this place
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {places.map((place) => (
          <div
            key={place.id}
            className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-move ${
              draggedItem?.id === place.id ? 'opacity-50 scale-95' : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, place)}
            onDragEnd={handleDragEnd}
          >
            {place.imageUrl && (
              <img
                src={place.imageUrl}
                alt={place.name}
                className="w-full h-32 object-cover"
              />
            )}
            <div className="p-3">
              <h3 className="font-medium text-sm mb-1">{place.name}</h3>
              <p className="text-xs text-gray-600 mb-2 capitalize">{place.category}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <span className="text-yellow-500">⭐</span>
                  <span className="ml-1">{place.rating}</span>
                </div>
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
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
      title: '',
      places: [],
    }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [tripTitle, setTripTitle] = useState('');

  // Track which places are already assigned to avoid duplicates
  const [assignedPlaceIds, setAssignedPlaceIds] = useState<Set<string | number>>(new Set());

  // Load persisted itinerary data on mount
  useEffect(() => {
    const savedItinerary = localStorage.getItem('itineraryData');
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
          setTripTitle(savedTripTitle || '');
          
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
        console.error('Failed to load saved itinerary:', error);
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
    localStorage.setItem('itineraryData', JSON.stringify(itineraryData));
  }, [days, activeDay, tripTitle]);

  // Convert trip places to itinerary places
  const itineraryPlaces: ItineraryPlace[] = tripPlaces.map(place => ({
    ...place,
    dayIndex: undefined,
    timeOfDay: undefined,
    dayOrder: undefined,
    notes: undefined,
  }));

  const handleAddDay = () => {
    const newDay: DayData = {
      date: new Date(Date.now() + (days.length * 24 * 60 * 60 * 1000)), // Add days
      title: '',
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
      scheduledTime: '09:00', // Default time
      dayOrder: days[dayIndex].places.length,
    };

    setDays(prevDays => {
      const newDays = [...prevDays];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        places: [...newDays[dayIndex].places, updatedPlace],
      };
      return newDays;
    });

    setAssignedPlaceIds(prev => new Set([...Array.from(prev), placeIdentifier]));

    toast({
      title: "Place added!",
      description: `${place.name} added to Day ${dayIndex + 1}.`,
    });
  };

  const handlePlaceRemove = (placeId: string | number) => {
    setDays(prevDays => 
      prevDays.map(day => ({
        ...day,
        places: day.places.filter(p => {
          const identifier = p.placeId || p.id;
          return identifier !== placeId;
        }),
      }))
    );

    setAssignedPlaceIds(prev => {
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
    setDays(prevDays => 
      prevDays.map(day => ({
        ...day,
        places: day.places.map(place => {
          const identifier = place.placeId || place.id;
          if (identifier === placeId) {
            return { ...place, ...updates };
          }
          return place;
        }),
      }))
    );
  };


  const handleGoBack = () => {
    setLocation('/route-results');
  };

  // Generate a default trip title based on the first and last cities
  const generateTripTitle = () => {
    const scheduledPlaces = days.flatMap(day => day.places);
    if (scheduledPlaces.length === 0) return 'My Trip';
    
    const cities = new Set<string>();
    scheduledPlaces.forEach(place => {
      if (place.address) {
        // Extract city from address (simplified approach)
        const addressParts = place.address.split(',');
        if (addressParts.length > 1) {
          const city = addressParts[addressParts.length - 2]?.trim();
          if (city) cities.add(city);
        }
      }
    });
    
    const cityList = Array.from(cities);
    if (cityList.length === 0) return 'My Trip';
    if (cityList.length === 1) return `${cityList[0]} Trip`;
    if (cityList.length === 2) return `${cityList[0]} to ${cityList[1]}`;
    return `${cityList[0]} to ${cityList[cityList.length - 1]} (+${cityList.length - 2} more)`;
  };

  // Save trip to backend
  const handleSaveTrip = async () => {
    if (days.every(day => day.places.length === 0)) {
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
      const scheduledPlaces = days.flatMap(day => day.places);
      const cities = new Set<string>();
      
      scheduledPlaces.forEach(place => {
        if (place.address) {
          const addressParts = place.address.split(',');
          if (addressParts.length > 1) {
            const city = addressParts[addressParts.length - 2]?.trim();
            if (city) cities.add(city);
          }
        }
      });
      
      const cityList = Array.from(cities);
      const startCity = cityList[0] || 'Unknown';
      const endCity = cityList[cityList.length - 1] || startCity;
      const checkpoints = cityList.slice(1, -1);
      
      // Prepare itinerary data with day organization
      const itineraryData = {
        days: days.map((day, index) => ({
          dayNumber: index + 1,
          date: day.date.toISOString(),
          title: day.title || `Day ${index + 1}`,
          places: day.places.map(place => ({
            ...place,
            scheduledTime: place.scheduledTime || '09:00',
            notes: place.notes || ''
          }))
        }))
      };

      // Prepare trip data for API
      const tripData = {
        title: tripTitle || generateTripTitle(),
        startCity,
        endCity,
        checkpoints,
        routeData: {
          totalDays: days.length,
          totalPlaces: scheduledPlaces.length,
          itinerary: itineraryData
        },
        poisData: scheduledPlaces.map(place => ({
          id: place.id,
          placeId: place.placeId,
          name: place.name,
          address: place.address,
          category: place.category,
          rating: place.rating,
          reviewCount: place.reviewCount,
          scheduledTime: place.scheduledTime,
          dayIndex: place.dayIndex,
          notes: place.notes
        })),
        isPublic: false
      };

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        throw new Error(error.message || 'Failed to save trip');
      }

      const savedTrip = await response.json();
      setLastSavedAt(new Date());
      
      toast({
        title: "Trip saved successfully!",
        description: `Your trip "${savedTrip.title}" has been saved with ${scheduledPlaces.length} places across ${days.length} days.`,
      });

      // Store the saved trip ID for future updates
      localStorage.setItem('savedTripId', savedTrip.id.toString());
      
    } catch (error) {
      console.error('Error saving trip:', error);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Trip Places Found</h1>
          <p className="text-gray-600 mb-6">
            You need to add places to your trip first.
          </p>
          <Button onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Route Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
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
                  style={{ minWidth: '200px' }}
                />
              </div>
              <p className="text-sm text-gray-600">
                Organize your {tripPlaces.length} saved places into daily plans
                {!isAuthenticated && (
                  <span className="ml-2 text-amber-600">• Sign in to save your trip</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastSavedAt && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Check className="h-4 w-4 text-green-600" />
                Saved {lastSavedAt.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={isAuthenticated ? handleSaveTrip : () => {
                toast({
                  title: "Sign in to save your trip",
                  description: "Go to the home page to sign in with Google or create an account. Your progress is saved locally.",
                });
                setLocation('/');
              }}
              disabled={isSaving || days.every(day => day.places.length === 0)}
              className={isAuthenticated 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-green-600 hover:bg-green-700 text-white"
              }
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
      <DayTabNavigation
        days={days}
        activeDay={activeDay}
        onDaySelect={setActiveDay}
        onAddDay={handleAddDay}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Daily Itinerary Sidebar */}
        <DailyItinerarySidebar
          day={days[activeDay] || days[0]}
          dayIndex={activeDay}
          onPlaceUpdate={handlePlaceUpdate}
          onPlaceRemove={handlePlaceRemove}
          onPlaceAssignment={handlePlaceAssignment}
        />

        {/* Trip Places Grid */}
        <TripPlacesGrid 
          places={itineraryPlaces.filter(place => {
            const placeIdentifier = place.placeId || place.id;
            return !assignedPlaceIds.has(placeIdentifier);
          })}
          onPlaceReturn={handlePlaceRemove}
        />
      </div>
    </div>
  );
}