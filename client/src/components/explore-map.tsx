import React from "react";
import { MapLegend } from "./map-legend";
import { MapToggle, type MapView } from "./map-toggle";
import type { ComponentPOI } from "./poi-list-item";

interface ExploreMapProps {
  pois: ComponentPOI[];
  hoveredPoi: ComponentPOI | null;
  currentView: MapView;
  onViewChange: (view: MapView) => void;
  onPoiClick?: (poi: ComponentPOI) => void;
}

export function ExploreMap({ 
  pois, 
  hoveredPoi, 
  currentView, 
  onViewChange, 
  onPoiClick 
}: ExploreMapProps) {
  // Filter POIs based on current view
  const visiblePois = currentView === "itinerary" 
    ? pois.filter(poi => poi.isInTrip)
    : pois;

  return (
    <div className="relative h-full bg-gradient-to-br from-green-100 to-blue-100">
      {/* Map Container - Placeholder for now */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">Interactive Map</h3>
          <p className="text-muted-foreground mb-4">
            Showing {visiblePois.length} locations
          </p>
          
          {/* Mock markers visualization */}
          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
            {visiblePois.slice(0, 8).map((poi) => (
              <div
                key={poi.id}
                className={`
                  w-4 h-4 rounded-full cursor-pointer transition-all duration-200
                  ${poi.isInTrip ? 'bg-blue-500' : 'bg-red-500'}
                  ${hoveredPoi?.id === poi.id ? 'scale-150 ring-2 ring-white' : ''}
                `}
                onClick={() => onPoiClick?.(poi)}
                title={poi.name}
              />
            ))}
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground">
            Google Maps integration will be added here
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <MapToggle currentView={currentView} onViewChange={onViewChange} />
      
      {/* Map Legend */}
      <MapLegend />
    </div>
  );
}