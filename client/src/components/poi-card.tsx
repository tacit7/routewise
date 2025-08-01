import {
  Star,
  ArrowRight,
  MapPin,
  Clock,
  Heart,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";
import type { Poi } from "@shared/schema";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PoiCardProps {
  poi: Poi;
}

export default function PoiCard({ poi }: PoiCardProps) {
  const categoryIcon = getCategoryIcon(poi.category);
  const categoryColor = getCategoryColor(poi.category);
  const [isAdded, setIsAdded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <img
        src={poi.imageUrl}
        alt={poi.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColor}`}
          >
            <i className={`${categoryIcon} mr-1`} />
            {poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}
          </span>
          <span className="text-slate-500 text-sm">{poi.timeFromStart}</span>
        </div>

        <h4 className="text-xl font-semibold text-slate-800 mb-2">
          {poi.name}
        </h4>
        <p className="text-slate-600 mb-3">{poi.description}</p>

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

        {/* Add to Places Button */}
        <button
          onClick={handleAddPlace}
          disabled={isAdded}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
            isAdded
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
          }`}
        >
          {isAdded ? (
            <>
              <Heart className="h-4 w-4 mr-2 fill-current" />
              Added to My Places
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add to My Places
            </>
          )}
        </button>
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
                      Added to My Places
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Add to My Places
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
