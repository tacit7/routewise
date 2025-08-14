import React from "react";
import { MapPin } from "lucide-react";
import { POIListItem, type ComponentPOI } from "./poi-list-item";

interface POIListProps {
  pois: ComponentPOI[];
  onToggleTrip: (poi: ComponentPOI) => void;
  onPoiHover?: (poi: ComponentPOI | null) => void;
  isLoading?: boolean;
}

export function POIList({ pois, onToggleTrip, onPoiHover, isLoading }: POIListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading locations...</div>
      </div>
    );
  }

  if (pois.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="font-medium text-foreground mb-2">No locations found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters to find more places.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="p-4 border-b border-border bg-muted/20">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          Points of Interest
        </h2>
      </div>

      {/* POI Items */}
      <div>
        {pois.map((poi) => (
          <POIListItem
            key={poi.id}
            poi={poi}
            onToggleTrip={onToggleTrip}
            onHover={onPoiHover}
          />
        ))}
      </div>
    </div>
  );
}