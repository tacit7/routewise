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
  tripMode?: 'route' | 'explore';
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
  tripMode = 'route',
  onStartLocationChange,
  onEndLocationChange,
  onStopsChange,
  onFlexibleLocationsChange,
  errors,
}: LocationStepProps) {
  const [showAddStop, setShowAddStop] = useState(false);
  const [showStopsOnMobile, setShowStopsOnMobile] = useState(false);

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

  // For explore mode, show simplified single-location UI
  if (tripMode === 'explore') {
    return (
      <div className="space-y-6">
        {/* Welcome message for explore mode */}
        <div className="text-center mb-6">
          <p className="text-slate-600 text-lg">
            Where would you like to explore places and discover local attractions?
          </p>
        </div>

        {/* Single location input for exploration - Enhanced width and affordance */}
        <div className="w-full max-w-none">
          <AccessibleFormField
            label="Location to Explore"
            description="Enter a city, neighborhood, address, or general area you want to explore"
            error={errors?.startLocation}
            required
          >
            <PlaceAutocomplete
              value={startLocation?.main_text || ""}
              onSelect={onStartLocationChange}
              placeholder="Search for city, address, or area to explore..."
              className="w-full text-base"
            />
          </AccessibleFormField>
        </div>

      </div>
    );
  }

  // Default route planning mode
  return (
    <div className="space-y-6">
      {/* Warm welcome message */}
      <div className="text-center mb-6">
        <p className="text-slate-600 text-lg">
          Let's start planning your adventure! Where would you like to explore?
        </p>
      </div>

      {/* Flexible locations option */}
      <div className="card-elevated flex items-start space-x-3 p-4 border border-blue-200 rounded-lg interactive-element"
           style={{ backgroundColor: 'rgba(96, 165, 250, 0.05)' }}>
        <Checkbox
          id="flexible-locations"
          checked={flexibleLocations}
          onCheckedChange={handleFlexibleChange}
          className="mt-0.5"
        />
        <div className="flex-1">
          <label
            htmlFor="flexible-locations"
            className="text-sm font-medium cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            I'm flexible with my destinations
          </label>
          <p className="text-sm mt-1" style={{ color: 'var(--accent-hover)' }}>
            Just tell us your starting area and we'll help you discover amazing destinations from there ✨
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
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowStopsOnMobile(!showStopsOnMobile)}
          className="flex items-center justify-between w-full p-3 h-auto font-medium text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-200"
        >
          <span>Optional stops ({stops.length}/5)</span>
          <span className={`transform transition-transform text-slate-400 ${showStopsOnMobile ? 'rotate-90' : ''}`}>
            ▸
          </span>
        </Button>

        {/* Stops content - collapsible on mobile */}
        <div className={`space-y-4 md:block ${showStopsOnMobile ? 'block' : 'hidden md:block'}`}>
          {/* Existing stops */}
          {stops.length > 0 && (
            <div className="space-y-2">
              {stops.map((stop, index) => (
                <div
                  key={`${stop.place_id || stop.description}-${index}`}
                  className="card-elevated flex items-center justify-between p-3 rounded-lg border border-slate-200 interactive-element"
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
                    className="text-slate-400 hover:text-red-500 h-8 w-8 p-0 transition-colors"
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
            <div className="p-4 border-2 border-solid border-slate-300 rounded-lg">
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
                  className="hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddStop(true)}
                disabled={!canAddStop}
                className="w-full border-solid hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add a Stop Along the Way
              </Button>
              {!canAddStop && (
                <p className="text-xs text-slate-500 text-center">
                  {stops.length >= 5 && "Maximum of 5 stops reached"}
                  {!startLocation && !endLocation && "Please enter both start and destination cities first"}
                  {!startLocation && endLocation && "Please enter a starting location first"}
                  {startLocation && !endLocation && !flexibleLocations && "Please enter a destination first"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>


      <ValidationMessage error={errors?.stops} />
    </div>
  );
}
