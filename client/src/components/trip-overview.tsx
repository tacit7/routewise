import React from "react";
import { Calendar, MapPin, Clock } from "lucide-react";

interface TripOverviewProps {
  totalLocations: number;
  tripDuration: string;
  selectedLocations: number;
}

export function TripOverview({ totalLocations, tripDuration, selectedLocations }: TripOverviewProps) {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        Trip Overview
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Total Locations:
          </div>
          <div className="font-medium text-foreground">{selectedLocations}</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Trip Duration:
          </div>
          <div className="font-medium text-foreground">{tripDuration}</div>
        </div>
        
        {selectedLocations > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {selectedLocations} of {totalLocations} locations selected
            </div>
            <div className="mt-2 bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300" 
                style={{ width: `${(selectedLocations / totalLocations) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}