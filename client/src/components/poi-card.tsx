import { Star, ArrowRight, MapPin, Clock } from "lucide-react";
import type { Poi } from "@shared/schema";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils";

interface PoiCardProps {
  poi: Poi;
}

export default function PoiCard({ poi }: PoiCardProps) {
  const categoryIcon = getCategoryIcon(poi.category);
  const categoryColor = getCategoryColor(poi.category);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <img 
        src={poi.imageUrl} 
        alt={poi.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColor}`}>
            <i className={`${categoryIcon} mr-1`} />
            {poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}
          </span>
          <span className="text-slate-500 text-sm">{poi.timeFromStart}</span>
        </div>
        
        <h4 className="text-xl font-semibold text-slate-800 mb-2">{poi.name}</h4>
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-accent fill-current" />
            <span className="font-medium">{poi.rating}</span>
            <span className="text-slate-500 text-sm">• {poi.reviewCount} reviews</span>
          </div>
          <button className="text-primary hover:text-blue-700 font-medium flex items-center">
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
