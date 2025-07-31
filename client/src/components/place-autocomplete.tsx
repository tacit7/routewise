import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlacesAutocomplete } from "@/hooks/use-places-autocomplete";

interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface PlaceAutocompleteProps {
  value?: string;
  onSelect: (place: PlaceSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PlaceAutocomplete({
  value,
  onSelect,
  placeholder = "Search for a city...",
  className,
  disabled = false,
}: PlaceAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const { suggestions, isLoading, error, fetchSuggestions, clearSuggestions } = usePlacesAutocomplete({
    types: '(cities)',
    debounceMs: 300,
    minLength: 2,
  });

  // Update input value when prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    fetchSuggestions(value);
  };

  const handleSelect = (suggestion: PlaceSuggestion) => {
    setInputValue(suggestion.main_text);
    setOpen(false);
    clearSuggestions();
    onSelect(suggestion);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      clearSuggestions();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal px-4 py-3 border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent",
            !inputValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-slate-400 mr-2" />
            <span className="truncate">
              {inputValue || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search cities..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-sm text-center text-muted-foreground">
                Searching...
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-center text-red-500">
                {error}
              </div>
            ) : suggestions.length === 0 && inputValue.length >= 2 ? (
              <CommandEmpty>No cities found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.place_id}
                    value={suggestion.description}
                    onSelect={() => handleSelect(suggestion)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {suggestion.main_text}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {suggestion.secondary_text}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
