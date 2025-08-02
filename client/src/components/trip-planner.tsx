import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Map,
  Trash2,
  Clock,
  Star,
  MapPin,
  Route,
  Download,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { Poi } from "@shared/schema";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TripPlannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TripPlanner({ isOpen, onClose }: TripPlannerProps) {
  const [tripPlaces, setTripPlaces] = useState<Poi[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    // Load trip places from localStorage
    const loadTripPlaces = () => {
      const saved = localStorage.getItem("tripPlaces");
      if (saved) {
        setTripPlaces(JSON.parse(saved));
      }
    };

    loadTripPlaces();

    // Listen for storage changes (for real-time updates)
    const handleStorageChange = () => {
      loadTripPlaces();
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener("tripUpdated", loadTripPlaces);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tripUpdated", loadTripPlaces);
    };
  }, []);

  const removeFromTrip = (poiId: number) => {
    const updatedPlaces = tripPlaces.filter(place => place.id !== poiId);
    setTripPlaces(updatedPlaces);
    localStorage.setItem("tripPlaces", JSON.stringify(updatedPlaces));
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("tripUpdated"));
    
    toast({
      title: "Removed from trip",
      description: "Place has been removed from your trip.",
    });
  };

  const clearTrip = () => {
    setTripPlaces([]);
    localStorage.removeItem("tripPlaces");
    window.dispatchEvent(new Event("tripUpdated"));
    
    toast({
      title: "Trip cleared",
      description: "All places have been removed from your trip.",
    });
  };

  const toggleCardExpansion = (poiId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(poiId)) {
      newExpanded.delete(poiId);
    } else {
      newExpanded.add(poiId);
    }
    setExpandedCards(newExpanded);
  };

  const exportTrip = () => {
    const tripData = {
      places: tripPlaces,
      exportDate: new Date().toISOString(),
      totalPlaces: tripPlaces.length,
    };

    const dataStr = JSON.stringify(tripData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `trip-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Trip exported",
      description: "Your trip has been downloaded as a JSON file.",
    });
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <Map className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">My Trip</h2>
            <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {tripPlaces.length} {tripPlaces.length === 1 ? 'place' : 'places'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Actions Bar */}
        {tripPlaces.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <button
              onClick={exportTrip}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Trip
            </button>
            <button
              onClick={clearTrip}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tripPlaces.length === 0 ? (
            <div className="text-center py-12">
              <Map className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No places added yet</h3>
              <p className="text-gray-500">
                Start adding places to your trip by clicking "Add to Trip" on any location card.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tripPlaces.map((place, index) => {
                const categoryIcon = getCategoryIcon(place.category);
                const categoryColor = getCategoryColor(place.category);
                const isExpanded = expandedCards.has(place.id);

                return (
                  <div key={place.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-gray-500 mr-3">
                              Stop #{index + 1}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
                              <i className={`${categoryIcon} mr-1`} />
                              {place.category}
                            </span>
                          </div>
                          
                          <h4 className="text-lg font-semibold text-gray-800 mb-1">
                            {place.name}
                          </h4>
                          
                          <div className="flex items-center text-sm text-gray-600 space-x-4 mb-2">
                            {place.rating && (
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                                <span>{place.rating}</span>
                              </div>
                            )}
                            {place.timeFromStart && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{place.timeFromStart}</span>
                              </div>
                            )}
                            {place.address && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-xs">{place.address}</span>
                              </div>
                            )}
                          </div>

                          {/* Expandable Description */}
                          {place.description && (
                            <div className={`text-sm text-gray-600 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                              {place.description}
                            </div>
                          )}
                        </div>

                        <div className="flex items-start space-x-2 ml-4">
                          {place.description && place.description.length > 100 && (
                            <button
                              onClick={() => toggleCardExpansion(place.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => removeFromTrip(place.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {tripPlaces.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <Route className="h-4 w-4 inline mr-1" />
                Ready to plan your route with {tripPlaces.length} stops
              </div>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                Plan Route
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}