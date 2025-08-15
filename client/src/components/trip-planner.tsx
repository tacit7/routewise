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
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import type { Poi } from "@shared/schema";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { usePersonalizedTrips } from "@/hooks/use-personalized-trips";

interface TripPlannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TripPlanner({ isOpen, onClose }: TripPlannerProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Use enhanced trip management hooks
  const {
    tripPlaces,
    tripStats,
    removeFromTrip,
    clearTrip,
    reorderTrip,
    isRemovingFromTrip,
    isClearingTrip
  } = useTripPlaces();

  // Use personalization for trip insights
  const {
    tripInsights,
    isPersonalized
  } = usePersonalizedTrips();

  // Remove functions handled by hooks

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center">
            <Map className="h-6 w-6 text-primary mr-2" />
            <h2 className="text-2xl font-bold text-fg">My Trip</h2>
            <span className="ml-3 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {tripPlaces.length} {tripPlaces.length === 1 ? 'place' : 'places'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-fg hover:text-fg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Actions Bar */}
        {tripPlaces.length > 0 && (
          <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-surface-alt">
            <button
              onClick={exportTrip}
              className="flex items-center px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-alt transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export Trip
            </button>
            <button
              onClick={clearTrip}
              disabled={isClearingTrip}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearingTrip ? 'Clearing...' : 'Clear All'}
            </button>
          </div>
        )}

        {/* Trip Insights */}
        {tripPlaces.length > 0 && isPersonalized && (
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-fg flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Trip Insights
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-fg">Personalization Score:</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  tripInsights.overallScore >= 80 ? 'bg-green-100 text-green-700' :
                  tripInsights.overallScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {tripInsights.overallScore}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-fg">Budget</div>
                  <div className="text-muted-fg capitalize">{tripInsights.budgetAnalysis.budgetRange}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium text-fg">Duration</div>
                  <div className="text-muted-fg">{tripInsights.timeDistribution.estimatedDuration.toFixed(1)}h</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="font-medium text-fg">Avg Rating</div>
                  <div className="text-muted-fg">{tripStats.averageRating.toFixed(1)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium text-fg">Categories</div>
                  <div className="text-muted-fg">{Object.keys(tripStats.categories).length}</div>
                </div>
              </div>
            </div>

            {tripInsights.missingInterests.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium text-amber-800">Suggestion:</span>
                  <span className="text-amber-700 ml-1">
                    Consider adding places for: {tripInsights.missingInterests.join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tripPlaces.length === 0 ? (
            <div className="text-center py-12">
              <Map className="h-16 w-16 text-muted-fg mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-fg mb-2">No places added yet</h3>
              <p className="text-muted-fg">
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
                  <div key={place.id} className="bg-surface border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-muted-fg mr-3">
                              Stop #{index + 1}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
                              <i key={`category-icon-${place.id}`} className={`${categoryIcon} mr-1`} />
                              {place.category}
                            </span>
                          </div>

                          <h4 className="text-lg font-semibold text-fg mb-1">
                            {place.name}
                          </h4>

                          <div className="flex items-center text-sm text-muted-fg space-x-4 mb-2">
                            {place.rating && (
                              <div className="flex items-center">
                                <Star key={`star-${place.id}`} className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                                <span>{place.rating}</span>
                              </div>
                            )}
                            {place.timeFromStart && (
                              <div className="flex items-center">
                                <Clock key={`clock-${place.id}`} className="h-3 w-3 mr-1" />
                                <span>{place.timeFromStart}</span>
                              </div>
                            )}
                            {place.address && (
                              <div className="flex items-center">
                                <MapPin key={`mappin-${place.id}`} className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-xs">{place.address}</span>
                              </div>
                            )}
                          </div>

                          {/* Expandable Description */}
                          {place.description && (
                            <div className={`text-sm text-muted-fg ${!isExpanded ? 'line-clamp-2' : ''}`}>
                              {place.description}
                            </div>
                          )}
                        </div>

                        <div className="flex items-start space-x-2 ml-4">
                          {place.description && place.description.length > 100 && (
                            <button
                              onClick={() => toggleCardExpansion(place.id)}
                              className="text-muted-fg hover:text-fg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp key={`chevron-up-${place.id}`} className="h-5 w-5" />
                              ) : (
                                <ChevronDown key={`chevron-down-${place.id}`} className="h-5 w-5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => removeFromTrip(place.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 key={`trash-${place.id}`} className="h-5 w-5" />
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
          <div className="px-6 py-4 border-t border-border bg-surface-alt">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-fg">
                <Route className="h-4 w-4 inline mr-1" />
                Ready to plan your route with {tripPlaces.length} stops
              </div>
              <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-fg rounded-lg font-medium transition-colors">
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