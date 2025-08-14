import React from "react";
import { Button } from "@/components/ui/button";

export type MapView = "all" | "itinerary";

interface MapToggleProps {
  currentView: MapView;
  onViewChange: (view: MapView) => void;
}

export function MapToggle({ currentView, onViewChange }: MapToggleProps) {
  return (
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg p-1 shadow-lg">
      <div className="flex">
        <Button
          variant={currentView === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("all")}
          className="rounded-md"
        >
          All Locations
        </Button>
        <Button
          variant={currentView === "itinerary" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("itinerary")}
          className="rounded-md"
        >
          My Itinerary
        </Button>
      </div>
    </div>
  );
}