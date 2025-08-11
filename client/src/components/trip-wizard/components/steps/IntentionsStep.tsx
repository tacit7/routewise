import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ValidationMessage } from "../shared/ValidationMessage";
import { INTENTION_OPTIONS } from "@/lib/trip-wizard/wizard-utils";
import { cn } from "@/lib/utils";
import { 
  Trees, Car, Utensils, Footprints, Landmark, Heart, 
  Building, Mountain, Camera, Music, ShoppingBag, Waves 
} from "lucide-react";

// Icon mapping function
const getIntentionIcon = (iconName: string) => {
  const iconMap = {
    'trees': Trees,
    'car': Car,
    'utensils': Utensils,
    'footprints': Footprints,
    'landmark': Landmark,
    'heart': Heart,
    'buildings': Building,
    'mountain': Mountain,
    'camera': Camera,
    'music': Music,
    'shopping-bag': ShoppingBag,
    'waves': Waves
  };
  
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
};

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
        <p className="text-muted-foreground">
          Tell us what kind of experience you're looking for. Select all that apply.
        </p>
        <div className="flex justify-center space-x-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(INTENTION_OPTIONS.map(opt => opt.value))}
          >
            Select All
          </Button>
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
        <span className="text-sm text-muted-foreground">
          {value.length} interests selected
        </span>
      </div>

      {/* Interest options - Card list with scroll affordance */}
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-hidden">
          {INTENTION_OPTIONS.map((option, index) => {
            const isSelected = value.includes(option.value);
            const isDisabled = false; // Allow selecting all interests
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToggle(option.value)}
                disabled={isDisabled}
                className={cn(
                  "relative w-full p-3 rounded-lg border-2 transition-all duration-200 min-h-[80px]",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "hover:shadow-md transform hover:-translate-y-1",
                  "flex flex-col items-center space-y-2 text-center",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-white hover:border-border",
                  isDisabled && "opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none",
                  // Crop the last visible row on mobile to show more options
                  index >= 8 && "sm:block hidden",
                  index >= 9 && "lg:block"
                )}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-center" aria-hidden="true">
                  {getIntentionIcon(option.icon)}
                </div>
                <span className={cn(
                  "text-xs font-medium leading-tight",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* "See more" indicator */}
        <div className="mt-4 text-center">
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <span>Scroll to see more options</span>
            <span className="text-muted-foreground/60">↓</span>
          </div>
        </div>
      </div>


      <ValidationMessage error={error} />
    </div>
  );
}