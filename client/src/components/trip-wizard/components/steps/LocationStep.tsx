import { useState } from "react";
import { MapPin, Flag, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaceAutocomplete } from "@/components/place-autocomplete";
import { AccessibleFormField } from "../shared/AccessibleFormField";
import { ValidationMessage } from "../shared/ValidationMessage";
import { PlaceSuggestion } from "@/types/trip-wizard";

interface LocationStepProps {
  startLocation: PlaceSuggestion | null;
  endLocation: PlaceSuggestion | null;
  stops: PlaceSuggestion[];
  onStartLocationChange: (location: PlaceSuggestion) => void;
  onEndLocationChange: (location: PlaceSuggestion) => void;
  onStopsChange: (stops: PlaceSuggestion[]) => void;
  errors?: {
    startLocation?: string;
    endLocation?: string;
    stops?: string;
  };
}

export function LocationStep({
  startLocation,
  endLocation,
  stops,
  onStartLocationChange,
  onEndLocationChange,
  onStopsChange,
  errors,
}: LocationStepProps) {
  const [showAddStop, setShowAddStop] = useState(false);

  const handleAddStop = (place: PlaceSuggestion) => {
    const newStops = [...stops, place];
    onStopsChange(newStops);
    setShowAddStop(false);
  };

  const handleRemoveStop = (index: number) => {
    const newStops = stops.filter((_, i) => i !== index);
    onStopsChange(newStops);
  };

  const canAddStop = stops.length < 5 && startLocation && endLocation;

  return (
    <div className="space-y-6">
      {/* Primary locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start location */}
        <AccessibleFormField
          label="Starting Location"
          description="Where will your trip begin?"
          error={errors?.startLocation}
          required
        >
          <PlaceAutocomplete
            value={startLocation?.main_text || ""}
            onSelect={onStartLocationChange}
            placeholder="Search for starting city..."
            className="w-full"
          />
        </AccessibleFormField>

        {/* End location */}
        <AccessibleFormField
          label="Destination"
          description="Where do you want to end up?"
          error={errors?.endLocation}
          required
        >
          <PlaceAutocomplete
            value={endLocation?.main_text || ""}
            onSelect={onEndLocationChange}
            placeholder="Search for destination..."
            className="w-full"
          />
        </AccessibleFormField>
      </div>

      {/* Stops section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-slate-800">Optional Stops</h4>
          <span className="text-sm text-slate-500">
            {stops.length}/5 stops added
          </span>
        </div>

        {/* Existing stops */}
        {stops.length > 0 && (
          <div className="space-y-2">
            {stops.map((stop, index) => (
              <div
                key={`${stop.place_id}-${index}`}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">
                      {stop.main_text}
                    </div>
                    <div className="text-sm text-slate-600">
                      {stop.secondary_text}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveStop(index)}
                  className="text-slate-400 hover:text-red-500 h-8 w-8 p-0"
                  aria-label={`Remove stop: ${stop.main_text}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add stop section */}
        {showAddStop ? (
          <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg">
            <AccessibleFormField
              label="Add a Stop"
              description="Add a city or location to visit along the way"
            >
              <PlaceAutocomplete
                value=""
                onSelect={handleAddStop}
                placeholder="Search for a stop location..."
                className="w-full"
              />
            </AccessibleFormField>
            <div className="flex justify-end space-x-2 mt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddStop(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddStop(true)}
            disabled={!canAddStop}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add a Stop Along the Way
            {!canAddStop && stops.length >= 5 && " (Maximum reached)"}
            {!canAddStop && !startLocation && " (Set start location first)"}
            {!canAddStop && !endLocation && " (Set destination first)"}
          </Button>
        )}
      </div>

      {/* Route preview */}
      {startLocation && endLocation && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <h4 className="font-medium text-green-900 mb-2">Your Route:</h4>
          <div className="flex items-center justify-center space-x-2 text-sm text-green-800">
            <MapPin className="w-4 h-4 text-green-600" />
            <span>{startLocation.main_text}</span>
            {stops.map((stop, index) => (
              <span key={index} className="flex items-center space-x-2">
                <span>→</span>
                <span>{stop.main_text}</span>
              </span>
            ))}
            <span>→</span>
            <Flag className="w-4 h-4 text-green-600" />
            <span>{endLocation.main_text}</span>
          </div>
        </div>
      )}

      <ValidationMessage error={errors?.stops} />
    </div>
  );
}