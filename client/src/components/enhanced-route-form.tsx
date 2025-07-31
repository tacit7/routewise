import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Flag, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PlaceAutocomplete } from "./place-autocomplete";

interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface Checkpoint {
  id: string;
  place: PlaceSuggestion | null;
  displayName: string;
}

const routeSchema = z.object({
  startCity: z.string().min(1, "Please select a starting city"),
  endCity: z.string().min(1, "Please select a destination city"),
});

type RouteFormData = z.infer<typeof routeSchema>;

export default function EnhancedRouteForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [startPlace, setStartPlace] = useState<PlaceSuggestion | null>(null);
  const [endPlace, setEndPlace] = useState<PlaceSuggestion | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      startCity: "",
      endCity: "",
    },
  });

  const addCheckpoint = () => {
    const newCheckpoint: Checkpoint = {
      id: `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      place: null,
      displayName: "",
    };
    setCheckpoints([...checkpoints, newCheckpoint]);
  };

  const removeCheckpoint = (id: string) => {
    setCheckpoints(checkpoints.filter(checkpoint => checkpoint.id !== id));
  };

  const updateCheckpoint = (id: string, place: PlaceSuggestion) => {
    setCheckpoints(checkpoints.map(checkpoint => 
      checkpoint.id === id 
        ? { ...checkpoint, place, displayName: place.main_text }
        : checkpoint
    ));
  };

  const handleStartCitySelect = (place: PlaceSuggestion) => {
    setStartPlace(place);
    form.setValue("startCity", place.main_text);
    form.clearErrors("startCity");
  };

  const handleEndCitySelect = (place: PlaceSuggestion) => {
    setEndPlace(place);
    form.setValue("endCity", place.main_text);
    form.clearErrors("endCity");
  };

  const onSubmit = async (data: RouteFormData) => {
    // Validate that places are selected (not just typed)
    if (!startPlace) {
      form.setError("startCity", { message: "Please select a starting city from the suggestions" });
      return;
    }
    
    if (!endPlace) {
      form.setError("endCity", { message: "Please select a destination city from the suggestions" });
      return;
    }

    // Validate checkpoints have valid places selected
    const invalidCheckpoints = checkpoints.filter(cp => !cp.place);
    if (invalidCheckpoints.length > 0) {
      toast({
        title: "Invalid checkpoints",
        description: "Please select valid cities for all checkpoints or remove them.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare route data with places and checkpoints
      const routeData = {
        startCity: data.startCity,
        endCity: data.endCity,
        startPlace,
        endPlace,
        checkpoints: checkpoints.map(cp => ({
          id: cp.id,
          place: cp.place,
          displayName: cp.displayName,
        })),
      };
      
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store route data for the results page
      localStorage.setItem('currentRoute', JSON.stringify(routeData));
      
      // Build URL with checkpoints
      const checkpointParams = checkpoints
        .map(cp => `checkpoint=${encodeURIComponent(cp.displayName)}`)
        .join('&');
      
      const baseUrl = `/route?start=${encodeURIComponent(data.startCity)}&end=${encodeURIComponent(data.endCity)}`;
      const finalUrl = checkpointParams ? `${baseUrl}&${checkpointParams}` : baseUrl;
      
      // Navigate to route results page
      setLocation(finalUrl);
      
      const checkpointText = checkpoints.length > 0 
        ? ` with ${checkpoints.length} checkpoint${checkpoints.length === 1 ? '' : 's'}`
        : '';
      
      toast({
        title: "Route planned!",
        description: `Preparing your route${checkpointText} with embedded map...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to plan route. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startCity" className="flex items-center text-sm font-medium text-slate-700">
            <MapPin className="h-4 w-4 text-secondary mr-2" />
            From
          </Label>
          <PlaceAutocomplete
            value={form.watch("startCity")}
            onSelect={handleStartCitySelect}
            placeholder="Select starting city"
            className="w-full"
          />
          {form.formState.errors.startCity && (
            <p className="text-sm text-red-600">{form.formState.errors.startCity.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endCity" className="flex items-center text-sm font-medium text-slate-700">
            <Flag className="h-4 w-4 text-accent mr-2" />
            To
          </Label>
          <PlaceAutocomplete
            value={form.watch("endCity")}
            onSelect={handleEndCitySelect}
            placeholder="Select destination city"
            className="w-full"
          />
          {form.formState.errors.endCity && (
            <p className="text-sm text-red-600">{form.formState.errors.endCity.message}</p>
          )}
        </div>
      </div>

      {/* Checkpoints Section */}
      {checkpoints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">
              Stops along the way
            </Label>
          </div>
          
          <div className="space-y-3">
            {checkpoints.map((checkpoint, index) => (
              <div key={checkpoint.id} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {index + 1}
                  </span>
                </div>
                
                <div className="flex-grow">
                  <PlaceAutocomplete
                    value={checkpoint.displayName}
                    onSelect={(place) => updateCheckpoint(checkpoint.id, place)}
                    placeholder={`Stop ${index + 1} - Select a city`}
                    className="w-full"
                  />
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCheckpoint(checkpoint.id)}
                  className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Checkpoint Button */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addCheckpoint}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
          disabled={checkpoints.length >= 8} // Reasonable limit
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Stop
          {checkpoints.length >= 8 && (
            <span className="ml-2 text-xs text-gray-500">(Max 8)</span>
          )}
        </Button>
      </div>
      
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 px-6 h-auto transition-all transform hover:scale-105 focus:ring-4 focus:ring-blue-300"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Planning Route...
          </>
        ) : (
          <>
            <i className="fas fa-route mr-2" />
            Plan My Route
            {checkpoints.length > 0 && (
              <span className="ml-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                +{checkpoints.length}
              </span>
            )}
          </>
        )}
      </Button>
    </form>
  );
}
