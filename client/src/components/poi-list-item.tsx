import React from "react";
import { Star, Plus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { POI } from "@/types/api";

export interface ComponentPOI {
  id: number;
  name: string;
  category: string;
  rating: number;
  isInTrip: boolean;
  address?: string;
  description?: string;
  imageUrl?: string;
  // Enhanced fields
  hiddenGem?: boolean;
  durationSuggested?: string;
  bestTimeToVisit?: string;
  accessibility?: string;
  tips?: string[];
  placeTypes?: string[];
}

interface POIListItemProps {
  poi: ComponentPOI;
  onToggleTrip: (poi: ComponentPOI) => void;
  onHover?: (poi: ComponentPOI | null) => void;
}

export function POIListItem({ poi, onToggleTrip, onHover }: POIListItemProps) {
  return (
    <div
      className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
      onMouseEnter={() => onHover?.(poi)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* POI Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">{poi.name}</h3>
            {poi.isInTrip && (
              <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
                In Trip
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground mb-2">{poi.category}</div>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-foreground">{poi.rating}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          variant={poi.isInTrip ? "secondary" : "default"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleTrip(poi);
          }}
          className={poi.isInTrip ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}
        >
          {poi.isInTrip ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}