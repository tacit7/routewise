import {
  Star,
  ArrowRight,
  MapPin,
  Clock,
  X,
  ExternalLink,
  Map,
  Loader2,
} from "lucide-react";
import type { Poi } from "@/types/schema";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { usePersonalizedTrips } from "@/hooks/use-personalized-trips";
import TimeScheduler from "@/components/time-scheduler";

interface PoiCardProps {
  poi: Poi;
  variant?: 'default' | 'grid' | 'compact';
  showRelevanceScore?: boolean;
  onTimeChange?: (poiId: number, newTime: string) => void;
  showTimeScheduler?: boolean;
}

export default function PoiCard({ 
  poi, 
  variant = 'default', 
  showRelevanceScore = false,
  onTimeChange,
  showTimeScheduler = false
}: PoiCardProps) {
  const categoryIcon = getCategoryIcon(poi.category);
  const categoryColor = getCategoryColor(poi.category);
  const [showDetails, setShowDetails] = useState(false);

  // Use enhanced trip management hooks
  const {
    isInTrip,
    addToTrip,
    isAddingToTrip
  } = useTripPlaces();

  // Check if this specific POI is in the trip
  const isAddedToTrip = isInTrip(poi);

  // Use personalization for relevance scoring
  const {
    calculateRelevanceScore,
    isPersonalized
  } = usePersonalizedTrips();

  // Calculate relevance score for display
  const relevanceScore = isPersonalized ? calculateRelevanceScore(poi) : 0;

  const handleAddToTrip = () => {
    addToTrip(poi);
  };

  const handleTimeChange = (newTime: string) => {
    onTimeChange?.(poi.id, newTime);
  };

  const isGridVariant = variant === 'grid';
  const isCompactVariant = variant === 'compact';
  
  // Compact variant for sidebar display
  if (isCompactVariant) {
    return (
      <div className="rounded border border-border bg-surface hover:shadow-sm transition-all p-2">
        <div className="flex gap-2">
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate text-fg">
              {poi.name}
            </h4>
            <p className="text-xs line-clamp-1 mb-1 text-muted-fg">
              {poi.description}
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-xs text-muted-fg">
                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                {poi.rating}
              </div>
              {showTimeScheduler ? (
                <TimeScheduler
                  scheduledTime={poi.scheduledTime}
                  onTimeChange={handleTimeChange}
                  size="sm"
                />
              ) : (
                <span className="text-xs text-muted-fg">
                  {poi.timeFromStart}
                </span>
              )}
            </div>
            {/* Centered Add to Trip Button */}
            <div className="flex justify-center">
              <button
                onClick={handleAddToTrip}
                disabled={isAddedToTrip || isAddingToTrip}
                className={`py-1 px-3 rounded text-xs font-medium transition-all duration-200 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                  isAddedToTrip
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : isAddingToTrip
                    ? 'bg-primary text-primary-fg opacity-60 cursor-not-allowed'
                    : 'bg-primary text-primary-fg hover:bg-primary/90'
                }`}
              >
                {isAddingToTrip ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Adding...
                  </>
                ) : isAddedToTrip ? (
                  <>
                    <Map className="h-3 w-3 mr-1 fill-current" />
                    In Trip
                  </>
                ) : (
                  <>
                    <Map className="h-3 w-3 mr-1" />
                    Add to Trip
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col bg-surface">
      <img
        src={poi.imageUrl}
        alt={poi.name}
        className={`w-full object-cover ${isGridVariant ? 'h-40' : 'h-48'}`}
      />
      <div className={`${isGridVariant ? 'p-3 flex-1 flex flex-col' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColor}`}
            >
              <i className={`${categoryIcon} mr-1`} />
              {poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}
            </span>
            {showRelevanceScore && isPersonalized && relevanceScore > 0.6 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {Math.round(relevanceScore * 100)}% match
              </span>
            )}
          </div>
          {showTimeScheduler ? (
            <TimeScheduler
              scheduledTime={poi.scheduledTime}
              onTimeChange={handleTimeChange}
              size="md"
            />
          ) : (
            <span className="text-sm text-muted-fg">{poi.timeFromStart}</span>
          )}
        </div>

        <h4 className={`font-semibold mb-2 text-fg ${isGridVariant ? 'text-lg' : 'text-xl'}`}>
          {poi.name}
        </h4>
        <p className={`text-muted-fg ${isGridVariant ? 'mb-2 text-sm flex-1' : 'mb-3'}`}>{poi.description}</p>

        {poi.address && (
          <div className="flex items-center text-sm mb-2 text-muted-fg">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="truncate">{poi.address}</span>
          </div>
        )}

        {poi.isOpen !== null && (
          <div className="flex items-center text-sm mb-3">
            <Clock className="h-3 w-3 mr-1" />
            <span className={poi.isOpen ? 'text-green-600' : 'text-red-600'}>
              {poi.isOpen ? "Open now" : "Closed"}
            </span>
            {poi.priceLevel && (
              <span className="ml-2 text-muted-fg">
                {"$".repeat(poi.priceLevel)}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            <span className="font-medium text-fg">{poi.rating}</span>
            <span className="text-sm text-muted-fg">
              • {poi.reviewCount} reviews
            </span>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="font-medium flex items-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded px-2 py-1 text-primary hover:opacity-80"
          >
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        {/* Centered Add to Trip Button */}
        <div className={`flex justify-center ${isGridVariant ? 'mt-auto' : ''}`}>
          <button
            onClick={handleAddToTrip}
            disabled={isAddedToTrip || isAddingToTrip}
            className={`py-2 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
              isAddedToTrip
                ? 'bg-primary/10 text-primary border border-primary/20'
                : isAddingToTrip
                ? 'bg-primary text-primary-fg opacity-60 cursor-not-allowed'
                : 'bg-primary text-primary-fg hover:bg-primary/90'
            }`}
          >
            {isAddingToTrip ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : isAddedToTrip ? (
              <>
                <Map className="h-4 w-4 mr-2 fill-current" />
                In Trip
              </>
            ) : (
              <>
                <Map className="h-4 w-4 mr-2" />
                Add to Trip
              </>
            )}
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-surface">
            <div className="relative">
              <img
                src={poi.imageUrl}
                alt={poi.name}
                className="w-full h-64 object-cover rounded-t-xl"
              />
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 rounded-full p-2 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg bg-surface/90 hover:bg-surface"
              >
                <X className="h-5 w-5 text-fg" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColor}`}
                >
                  <i className={`${categoryIcon} mr-1`} />
                  {poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}
                </span>
                {showTimeScheduler ? (
                  <TimeScheduler
                    scheduledTime={poi.scheduledTime}
                    onTimeChange={handleTimeChange}
                    size="md"
                  />
                ) : (
                  <span className="text-sm text-muted-fg">
                    {poi.timeFromStart}
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold mb-3 text-fg">
                {poi.name}
              </h3>
              <p className="mb-4 text-muted-fg">{poi.description}</p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {poi.address && (
                  <div className="flex items-start text-muted-fg">
                    <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{poi.address}</span>
                  </div>
                )}

                <div className="flex items-center text-muted-fg">
                  <Star className="h-5 w-5 mr-2 fill-current text-yellow-500" />
                  <span className="font-medium text-fg">{poi.rating}</span>
                  <span className="ml-1 text-muted-fg">
                    ({poi.reviewCount} reviews)
                  </span>
                </div>

                {poi.isOpen !== null && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span className={`font-medium ${poi.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {poi.isOpen ? "Open now" : "Closed"}
                    </span>
                  </div>
                )}

                {poi.priceLevel && (
                  <div className="flex items-center text-muted-fg">
                    <span className="mr-2">Price:</span>
                    <span className="font-medium">
                      {"$".repeat(poi.priceLevel)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleAddToTrip}
                  disabled={isAddedToTrip || isAddingToTrip}
                  className={`py-3 px-8 rounded-lg font-medium transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                    isAddedToTrip
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : isAddingToTrip
                      ? 'bg-primary text-primary-fg opacity-60 cursor-not-allowed'
                      : 'bg-primary text-primary-fg hover:bg-primary/90'
                  }`}
                >
                  {isAddingToTrip ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : isAddedToTrip ? (
                    <>
                      <Map className="h-5 w-5 mr-2 fill-current" />
                      Added to Trip
                    </>
                  ) : (
                    <>
                      <Map className="h-5 w-5 mr-2" />
                      Add to Trip
                    </>
                  )}
                </button>

                {poi.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      poi.name + " " + poi.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ml-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg bg-secondary text-muted-fg hover:bg-primary/10"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    View on Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
