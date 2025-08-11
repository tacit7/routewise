import { useState, useEffect } from "react";
import { useCombobox } from "downshift";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlacesAutocomplete } from "@/hooks/use-places-autocomplete";

interface PlaceSuggestion {
  place_id?: string;
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
  limit?: number;
  countries?: string;
}

export function PlaceAutocomplete({
  value,
  onSelect,
  placeholder = "Search for a city...",
  className,
  disabled = false,
  limit = 10,
  countries = 'us,ca,mx',
}: PlaceAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || "");
  const { suggestions, isLoading, error, fetchSuggestions, clearSuggestions } = usePlacesAutocomplete({
    limit,
    countries,
    debounceMs: 300,
    minLength: 2,
  });

  // Update input value when prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  // Prepare items for downshift (including manual entry option)
  const items = [...suggestions];
  if (inputValue.length >= 2 && suggestions.length === 0 && !isLoading) {
    items.push({
      description: inputValue,
      main_text: inputValue,
      secondary_text: "Manual entry",
    });
  }

  const handleSelect = (suggestion: PlaceSuggestion | null) => {
    if (suggestion) {
      setInputValue(suggestion.main_text);
      clearSuggestions();
      onSelect(suggestion);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    fetchSuggestions(value);
  };

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getToggleButtonProps,
    getItemProps,
    highlightedIndex,
    selectedItem,
  } = useCombobox({
    items,
    itemToString: (item) => item ? item.main_text : '',
    selectedItem: null,
    inputValue,
    onInputValueChange: ({ inputValue: newInputValue }) => {
      if (newInputValue !== undefined) {
        handleInputChange(newInputValue);
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      handleSelect(selectedItem);
    },
    onIsOpenChange: ({ isOpen: newIsOpen }) => {
      if (!newIsOpen) {
        clearSuggestions();
      }
    },
  });

  return (
    <div className={cn("relative w-full", className)}>
      {/* Hidden label for accessibility */}
      <label {...getLabelProps()} className="sr-only">
        {placeholder}
      </label>
      
      {/* Input trigger button */}
      <div className="relative">
        <Button
          variant="outline"
          {...getToggleButtonProps()}
          className={cn(
            "w-full justify-between font-normal px-4 py-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            !inputValue && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50"
          )}
          style={{ 
            borderColor: 'var(--primary)',
            backgroundColor: 'var(--muted)',
            color: 'var(--foreground)'
          } as React.CSSProperties}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center w-full">
            <MapPin className="h-4 w-4 text-slate-400 mr-2" />
            <input
              {...getInputProps()}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-left truncate"
              disabled={disabled}
            />
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>

      {/* Dropdown menu */}
      <ul
        {...getMenuProps()}
        className={cn(
          "card-elevated absolute z-50 w-full mt-1 border border-slate-200 rounded-md max-h-60 overflow-y-auto",
          !isOpen && "hidden"
        )}
      >
        {isOpen && (
          <>
            {isLoading ? (
              <li className="p-4 text-sm text-center text-slate-500">
                Searching...
              </li>
            ) : error ? (
              <li className="p-4 text-sm text-center text-red-500">
                {error}
              </li>
            ) : items.length === 0 ? (
              <li className="p-4 text-sm text-center text-slate-500">
                No cities found
              </li>
            ) : (
              items.map((item, index) => {
                const isManualEntry = item.secondary_text === "Manual entry";
                return (
                  <li
                    key={item.place_id || `item-${index}`}
                    {...getItemProps({ item, index })}
                    className={cn(
                      "px-4 py-2 cursor-pointer transition-colors",
                      highlightedIndex === index
                        ? "bg-green-200 text-green-950"
                        : "hover:bg-green-100",
                      isManualEntry && "bg-green-200 border-t border-green-400"
                    )}
                  >
                    <div className="flex flex-col">
                      <span 
                        className={cn(
                          "font-medium",
                          isManualEntry ? "text-green-900" : "text-slate-900",
                          highlightedIndex === index && "text-green-950"
                        )}
                      >
                        {isManualEntry ? `Use "${item.main_text}" as entered` : item.main_text}
                      </span>
                      <span 
                        className={cn(
                          "text-sm",
                          isManualEntry ? "text-green-800" : "text-slate-500",
                          highlightedIndex === index && "text-green-900"
                        )}
                      >
                        {isManualEntry ? "Proceed with manual entry" : item.secondary_text}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </>
        )}
      </ul>
    </div>
  );
}
