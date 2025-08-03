import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ValidationMessage } from "../shared/ValidationMessage";
import { INTENTION_OPTIONS } from "@/lib/trip-wizard/wizard-utils";
import { cn } from "@/lib/utils";

interface IntentionsStepProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function IntentionsStep({ value, onChange, error }: IntentionsStepProps) {
  const handleToggle = (intention: string) => {
    const newValue = value.includes(intention)
      ? value.filter(v => v !== intention)
      : [...value, intention];
    onChange(newValue);
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectPopular = () => {
    const popularIntentions = ['nature', 'scenic-drives', 'foodie', 'photography'];
    onChange(popularIntentions);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-slate-600">
          Tell us what kind of experience you're looking for. Select all that apply.
        </p>
        <div className="flex justify-center space-x-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectPopular}
          >
            Select Popular
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={value.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Selection counter */}
      <div className="text-center">
        <span className="text-sm text-slate-600">
          {value.length} intentions selected
        </span>
      </div>

      {/* Intention options */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {INTENTION_OPTIONS.map((option) => {
          const isSelected = value.includes(option.value);
          const isDisabled = false; // Allow selecting all intentions
          
          return (
            <Button
              key={option.value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => handleToggle(option.value)}
              disabled={isDisabled}
              className={cn(
                "h-auto py-3 px-4 flex flex-col items-center space-y-2 text-center transition-all",
                isSelected && "bg-primary text-white",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              aria-pressed={isSelected}
            >
              <span className="text-lg" role="img" aria-hidden="true">
                {option.icon}
              </span>
              <span className="text-xs font-medium leading-tight">
                {option.label}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Selected intentions summary */}
      {value.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">
            Your Trip Interests:
          </h4>
          <div className="flex flex-wrap gap-2">
            {value.map((intentionValue) => {
              const option = INTENTION_OPTIONS.find(opt => opt.value === intentionValue);
              return option ? (
                <Badge
                  key={intentionValue}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </Badge>
              ) : null;
            })}
          </div>
          <p className="text-sm text-blue-800 mt-2">
            We'll use these interests to recommend places and activities that match what you're looking for.
          </p>
        </div>
      )}

      {/* Helpful tips based on selections */}
      {value.length > 0 && (
        <div className="space-y-3">
          {value.includes('nature') && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                🌲 <strong>Nature tip:</strong> We'll find national parks, hiking trails, and scenic natural areas along your route.
              </p>
            </div>
          )}
          
          {value.includes('foodie') && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                🍽️ <strong>Foodie tip:</strong> We'll recommend local restaurants, food festivals, and culinary experiences.
              </p>
            </div>
          )}
          
          {value.includes('history') && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                🏛️ <strong>History tip:</strong> We'll suggest museums, historical sites, and cultural landmarks.
              </p>
            </div>
          )}
          
          {value.includes('photography') && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                📸 <strong>Photography tip:</strong> We'll find scenic viewpoints, golden hour spots, and Instagram-worthy locations.
              </p>
            </div>
          )}
        </div>
      )}

      <ValidationMessage error={error} />
    </div>
  );
}