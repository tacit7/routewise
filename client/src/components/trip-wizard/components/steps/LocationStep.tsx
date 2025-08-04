import { useState } from "react";
import { MapPin, Flag, Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlaceAutocomplete } from "@/components/place-autocomplete";
import { AccessibleFormField } from "../shared/AccessibleFormField";
import { ValidationMessage } from "../shared/ValidationMessage";
import { PlaceSuggestion } from "@/types/trip-wizard";

interface LocationStepProps {
  startLocation: PlaceSuggestion | null;
  endLocation: PlaceSuggestion | null;
  stops: PlaceSuggestion[];
  flexibleLocations: boolean;
  onStartLocationChange: (location: PlaceSuggestion) => void;
  onEndLocationChange: (location: PlaceSuggestion) => void;
  onStopsChange: (stops: PlaceSuggestion[]) => void;
  onFlexibleLocationsChange: (flexible: boolean) => void;
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
  flexibleLocations,
  onStartLocationChange,
  onEndLocationChange,
  onStopsChange,
  onFlexibleLocationsChange,
  errors,
}: LocationStepProps) {
  const [showAddStop, setShowAddStop] = useState(false);

  const handleFlexibleChange = (checked: boolean) => {
    onFlexibleLocationsChange(checked);
    if (checked) {
      // Clear end location and stops when flexible is enabled, but keep start location
      onEndLocationChange(null as any);
      onStopsChange([]);
    }
  };

  const handleAddStop = (place: PlaceSuggestion) => {
    const newStops = [...stops, place];
    onStopsChange(newStops);
    setShowAddStop(false);
  };

  const handleRemoveStop = (index: number) => {
    const newStops = stops.filter((_, i) => i !== index);
    onStopsChange(newStops);
  };

  const canAddStop =
    stops.length < 5 && startLocation && endLocation && !flexibleLocations;

  return (
    <div className="space-y-6">
      {/* Flexible locations option */}
      <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Checkbox
          id="flexible-locations"
          checked={flexibleLocations}
          onCheckedChange={handleFlexibleChange}
          className="mt-0.5"
        />
        <div className="flex-1">
          <label
            htmlFor="flexible-locations"
            className="text-sm font-medium text-blue-900 cursor-pointer"
          >
            I'm flexible with my destinations
          </label>
          <p className="text-sm text-blue-800 mt-1">
            Specify at least a starting area - we'll help you discover the best
            destinations from there
          </p>
        </div>
      </div>

      {/* Location selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start location */}
        <AccessibleFormField
          label="Starting Location"
          description={
            flexibleLocations
              ? "Specify at least a general area or region"
              : "Where will your trip begin?"
          }
          error={errors?.startLocation}
          required
        >
          <PlaceAutocomplete
            value={startLocation?.main_text || ""}
            onSelect={onStartLocationChange}
            placeholder={
              flexibleLocations
                ? "Search for region, state, or general area..."
                : "Search for starting city..."
            }
            className="w-full"
          />
        </AccessibleFormField>

        {/* End location */}
        <AccessibleFormField
          label={flexibleLocations ? "Destination (Optional)" : "Destination"}
          description={
            flexibleLocations
              ? "Leave blank to discover destinations along the way"
              : "Where do you want to end up?"
          }
          error={errors?.endLocation}
          required={!flexibleLocations}
        >
          <PlaceAutocomplete
            value={endLocation?.main_text || ""}
            onSelect={onEndLocationChange}
            placeholder={
              flexibleLocations
                ? "Optional - search for general destination area..."
                : "Search for destination..."
            }
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
      {startLocation && (flexibleLocations || endLocation) && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <h4 className="font-medium text-green-900 mb-2">
            {flexibleLocations ? "Starting Area:" : "Your Route:"}
          </h4>
          <div className="flex items-center justify-center space-x-2 text-sm text-green-800">
            <MapPin className="w-4 h-4 text-green-600" />
            <span>{startLocation.main_text}</span>
            {!flexibleLocations && (
              <>
                {stops.map((stop, index) => (
                  <span key={index} className="flex items-center space-x-2">
                    <span>→</span>
                    <span>{stop.main_text}</span>
                  </span>
                ))}
                <span>→</span>
                <Flag className="w-4 h-4 text-green-600" />
                <span>{endLocation.main_text}</span>
              </>
            )}
            {flexibleLocations && (
              <>
                <span>→</span>
                <span className="italic text-green-700">
                  Flexible destinations from here
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <ValidationMessage error={errors?.stops} />
    </div>
  );
}
