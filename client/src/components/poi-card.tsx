import {
  Star,
  ArrowRight,
  MapPin,
  Clock,
  Heart,
  Plus,
  X,
  ExternalLink,
  Map,
  Loader2,
} from "lucide-react";
import type { Poi } from "@shared/schema";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { usePersonalizedTrips } from "@/hooks/use-personalized-trips";

interface PoiCardProps {
  poi: Poi;
  variant?: 'default' | 'grid' | 'compact';
  showRelevanceScore?: boolean;
}

export default function PoiCard({ poi, variant = 'default', showRelevanceScore = false }: PoiCardProps) {
  const categoryIcon = getCategoryIcon(poi.category);
  const categoryColor = getCategoryColor(poi.category);
  const [isAdded, setIsAdded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

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

  // Check if POI is already saved in places on mount and listen for updates
  useEffect(() => {
    const checkSavedStatus = () => {
      const savedPlaces = JSON.parse(localStorage.getItem("myPlaces") || "[]");
      
      // Use placeId as primary identifier if available, fallback to id
      const poiIdentifier = poi.placeId || poi.id;
      const isInSaved = savedPlaces.some((p: Poi) => (p.placeId || p.id) === poiIdentifier);
      
      setIsAdded(isInSaved);
    };

    checkSavedStatus();

    // Listen for storage updates
    window.addEventListener("storage", checkSavedStatus);

    return () => {
      window.removeEventListener("storage", checkSavedStatus);
    };
  }, [poi.id]);

  const handleAddPlace = () => {
    // Save to localStorage for persistence
    const savedPlaces = JSON.parse(localStorage.getItem("myPlaces") || "[]");
    const isAlreadySaved = savedPlaces.some((p: Poi) => p.id === poi.id);

    if (isAlreadySaved) {
      toast({
        title: "Already saved",
        description: `${poi.name} is already in your places.`,
      });
      return;
    }

    savedPlaces.push(poi);
    localStorage.setItem("myPlaces", JSON.stringify(savedPlaces));
    setIsAdded(true);

    toast({
      title: "Place added!",
      description: `${poi.name} has been added to your places.`,
    });
  };

  const handleAddToTrip = () => {
    addToTrip(poi);
  };

  const isGridVariant = variant === 'grid';
  const isCompactVariant = variant === 'compact';
  
  // Compact variant for sidebar display
  if (isCompactVariant) {
    return (
      <div className="bg-white rounded border hover:shadow-sm transition-all p-2">
        <div className="flex gap-2">
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-800 text-sm truncate">
              {poi.name}
            </h4>
            <p className="text-xs text-slate-600 line-clamp-1 mb-1">
              {poi.description}
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-xs text-slate-500">
                <Star className="h-3 w-3 text-yellow-400 mr-1" />
                {poi.rating}
              </div>
              <span className="text-xs text-slate-500">
                {poi.timeFromStart}
              </span>
            </div>
            {/* Compact Action Buttons */}
            <div className="flex gap-1">
              <button
                onClick={handleAddPlace}
                disabled={isAdded}
                className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                  isAdded
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isAdded ? (
                  <>
                    <Heart className="h-3 w-3 mr-1 fill-current" />
                    Saved
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    Save
                  </>
                )}
              </button>
              
              <button
                onClick={handleAddToTrip}
                disabled={isAddedToTrip || isAddingToTrip}
                className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                  isAddedToTrip
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : isAddingToTrip
                    ? "bg-purple-400 text-white cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col">
      <img
        src={poi.imageUrl}
        alt={poi.name}
        className={`w-full object-cover ${isGridVariant ? 'h-56' : 'h-48'}`}
      />
      <div className={`${isGridVariant ? 'p-4 flex-1 flex flex-col' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColor}`}
            >
              <i className={`${categoryIcon} mr-1`} />
              {poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}
            </span>
            {showRelevanceScore && isPersonalized && relevanceScore > 0.6 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                {Math.round(relevanceScore * 100)}% match
              </span>
            )}
          </div>
          <span className="text-slate-500 text-sm">{poi.timeFromStart}</span>
        </div>

        <h4 className={`font-semibold text-slate-800 mb-2 ${isGridVariant ? 'text-lg' : 'text-xl'}`}>
          {poi.name}
        </h4>
        <p className={`text-slate-600 ${isGridVariant ? 'mb-2 text-sm flex-1' : 'mb-3'}`}>{poi.description}</p>

        {poi.address && (
          <div className="flex items-center text-slate-500 text-sm mb-2">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="truncate">{poi.address}</span>
          </div>
        )}

        {poi.isOpen !== null && (
          <div className="flex items-center text-sm mb-3">
            <Clock className="h-3 w-3 mr-1" />
            <span className={poi.isOpen ? "text-green-600" : "text-red-600"}>
              {poi.isOpen ? "Open now" : "Closed"}
            </span>
            {poi.priceLevel && (
              <span className="ml-2 text-slate-500">
                {"$".repeat(poi.priceLevel)}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-accent fill-current" />
            <span className="font-medium">{poi.rating}</span>
            <span className="text-slate-500 text-sm">
              • {poi.reviewCount} reviews
            </span>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="text-primary hover:text-blue-700 font-medium flex items-center"
          >
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-2 ${isGridVariant ? 'mt-auto' : ''}`}>
          <button
            onClick={handleAddPlace}
            disabled={isAdded}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
              isAdded
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
            }`}
          >
            {isAdded ? (
              <>
                <Heart className="h-4 w-4 mr-2 fill-current" />
                Saved
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Save Place
              </>
            )}
          </button>
          
          <button
            onClick={handleAddToTrip}
            disabled={isAddedToTrip || isAddingToTrip}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
              isAddedToTrip
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : isAddingToTrip
                ? "bg-purple-400 text-white cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md"
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={poi.imageUrl}
                alt={poi.name}
                className="w-full h-64 object-cover rounded-t-xl"
              />
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
              >
                <X className="h-5 w-5" />
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
                <span className="text-slate-500 text-sm">
                  {poi.timeFromStart}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                {poi.name}
              </h3>
              <p className="text-slate-600 mb-4">{poi.description}</p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {poi.address && (
                  <div className="flex items-start text-slate-600">
                    <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{poi.address}</span>
                  </div>
                )}

                <div className="flex items-center text-slate-600">
                  <Star className="h-5 w-5 mr-2 text-accent fill-current" />
                  <span className="font-medium">{poi.rating}</span>
                  <span className="text-slate-500 ml-1">
                    ({poi.reviewCount} reviews)
                  </span>
                </div>

                {poi.isOpen !== null && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span
                      className={
                        poi.isOpen
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {poi.isOpen ? "Open now" : "Closed"}
                    </span>
                  </div>
                )}

                {poi.priceLevel && (
                  <div className="flex items-center text-slate-600">
                    <span className="mr-2">Price:</span>
                    <span className="font-medium">
                      {"$".repeat(poi.priceLevel)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddPlace}
                  disabled={isAdded}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                    isAdded
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Heart className="h-5 w-5 mr-2 fill-current" />
                      Saved to Places
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Save Place
                    </>
                  )}
                </button>

                <button
                  onClick={handleAddToTrip}
                  disabled={isAddedToTrip || isAddingToTrip}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                    isAddedToTrip
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : isAddingToTrip
                      ? "bg-purple-400 text-white cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md"
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
                    className="flex items-center justify-center px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
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
