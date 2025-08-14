import React from "react";
import { MapPin } from "lucide-react";

export function MapLegend() {
  return (
    <div className="absolute bottom-6 left-6 bg-card border border-border rounded-lg p-4 shadow-lg min-w-48">
      <h4 className="font-medium text-foreground mb-3">Legend</h4>
      
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <MapPin className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm text-foreground">Available locations</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <MapPin className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm text-foreground">In your itinerary</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-0.5 bg-blue-400"></div>
          <span className="text-sm text-foreground">Seine River</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Click on markers to see location details. Blue markers are in your itinerary.
        </p>
      </div>
    </div>
  );
}