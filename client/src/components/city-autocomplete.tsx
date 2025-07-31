import { useState, useEffect, useRef, ReactNode } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutocompletePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = "Enter a city",
  icon = <MapPin className="h-4 w-4" />,
  error,
  disabled = false,
  className
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const [apiError, setApiError] = useState<string | null>(null);

  // Update internal input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch predictions from your backend API
  const fetchPredictions = async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      // Try free autocomplete first (Nominatim/OpenStreetMap)
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}&types=(cities)`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.predictions && Array.isArray(data.predictions)) {
        setPredictions(data.predictions);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      setApiError('Unable to load suggestions');
      
      // Try Google Places API as fallback
      try {
        const fallbackResponse = await fetch(`/api/places/autocomplete/google?input=${encodeURIComponent(input)}&types=(cities)`);
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.predictions && Array.isArray(fallbackData.predictions)) {
            setPredictions(fallbackData.predictions);
            setApiError(null);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback autocomplete also failed:', fallbackError);
        // Keep the error state for user feedback
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for API call
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300); // 300ms delay
  };

  // Handle selection
  const handleSelect = (prediction: AutocompletePrediction) => {
    const selectedValue = prediction.main_text || prediction.description;
    setInputValue(selectedValue);
    onChange(selectedValue);
    setOpen(false);
    setPredictions([]);
  };

  // Handle manual input (when user types and presses enter or clicks away)
  const handleInputSubmit = () => {
    if (inputValue !== value) {
      onChange(inputValue);
    }
  };

  // Clear predictions when component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const hasError = error || apiError;

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-left font-normal",
              !inputValue && "text-muted-foreground",
              hasError && "border-red-500 focus:border-red-500",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
              <span className="truncate">
                {inputValue || placeholder}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {hasError && !loading && <AlertCircle className="h-4 w-4 text-red-500" />}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              value={inputValue}
              onValueChange={handleInputChange}
              onBlur={handleInputSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && predictions.length === 0) {
                  handleInputSubmit();
                  setOpen(false);
                }
              }}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              )}
              
              {!loading && apiError && (
                <div className="flex items-center justify-center py-6 text-red-500">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{apiError}</span>
                </div>
              )}
              
              {!loading && !apiError && predictions.length === 0 && inputValue.length >= 2 && (
                <CommandEmpty>
                  No cities found. Try a different search term.
                </CommandEmpty>
              )}
              
              {!loading && predictions.length > 0 && (
                <CommandGroup>
                  {predictions.map((prediction) => (
                    <CommandItem
                      key={prediction.place_id}
                      value={prediction.description}
                      onSelect={() => handleSelect(prediction)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {prediction.main_text || prediction.description}
                        </div>
                        {prediction.secondary_text && (
                          <div className="text-sm text-muted-foreground truncate">
                            {prediction.secondary_text}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}