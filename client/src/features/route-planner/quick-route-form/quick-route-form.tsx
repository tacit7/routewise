import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import CityAutocomplete from "@/components/city-autocomplete";

const routeSchema = z.object({
  startCity: z.string().min(1, "Please enter a starting city"),
  endCity: z.string().min(1, "Please enter a destination city"),
});

type RouteFormData = z.infer<typeof routeSchema>;

type QuickRouteFormProps = {
  density?: "comfortable" | "compact";
  onSubmit?: (startCity: string, endCity: string) => void;
  className?: string;
  showHeader?: boolean;
};

export function QuickRouteForm({ 
  density = "comfortable", 
  onSubmit,
  className = "",
  showHeader = true
}: QuickRouteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      startCity: "",
      endCity: "",
    },
  });

  // Check for pre-filled route request from interests page
  useEffect(() => {
    const routeRequest = localStorage.getItem('routeRequest');
    if (routeRequest) {
      try {
        const { startLocation, endLocation, timestamp } = JSON.parse(routeRequest);
        
        // Only use the request if it's recent (within last 5 minutes)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          form.setValue('startCity', startLocation);
          form.setValue('endCity', endLocation);
          
          toast({
            title: "Route pre-filled!",
            description: "We've filled in the trip details from your interest selection.",
          });
        }
        
        // Clear the request after using it
        localStorage.removeItem('routeRequest');
      } catch (error) {
        // Invalid JSON, just clear it
        localStorage.removeItem('routeRequest');
      }
    }
  }, [form, toast]);

  const handleSubmit = async (data: RouteFormData) => {
    if (onSubmit) {
      onSubmit(data.startCity, data.endCity);
      return;
    }

    setIsLoading(true);

    try {
      // Store route data
      localStorage.setItem('currentRoute', JSON.stringify({
        startCity: data.startCity,
        endCity: data.endCity
      }));

      // Navigate to route results
      setLocation(`/route?start=${encodeURIComponent(data.startCity)}&end=${encodeURIComponent(data.endCity)}`);

      toast({
        title: "Planning your route!",
        description: `Finding the best stops between ${data.startCity} and ${data.endCity}`,
      });
    } catch (error) {
      console.error("Route planning error:", error);
      toast({
        title: "Planning failed",
        description: "Please check your cities and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const spacingClass = density === "compact" ? "space-y-3" : "space-y-4 sm:space-y-6";
  const textClass = density === "compact" ? "text-sm" : "text-base";
  const inputPadding = density === "compact" ? "h-11" : "h-12 md:h-14";
  const buttonPadding = density === "compact" ? "h-11" : "h-12 md:h-14";

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className={`${spacingClass} ${textClass} ${className}`}>
      {showHeader && (
        <div className="text-center mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">Quick Route</h3>
          <p className="text-sm md:text-base text-muted-foreground">Get started fast with basic route planning</p>
        </div>
      )}

      <div className={spacingClass}>
        {/* From City */}
        <div>
          <Label htmlFor="startCity" className={`block ${textClass} font-medium text-slate-900 mb-2`}>
            <MapPin className="inline w-4 h-4 mr-2 text-blue-600" />
            From
          </Label>
          <Controller
            name="startCity"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <CityAutocomplete
                  value={field.value}
                  onSelect={(city) => field.onChange(city)}
                  placeholder="Enter starting city"
                  className={`${inputPadding} border-2 focus:border-blue-500 ${
                    fieldState.error ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* To City */}
        <div>
          <Label htmlFor="endCity" className={`block ${textClass} font-medium text-slate-900 mb-2`}>
            <Flag className="inline w-4 h-4 mr-2 text-green-600" />
            To
          </Label>
          <Controller
            name="endCity"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <CityAutocomplete
                  value={field.value}
                  onSelect={(city) => field.onChange(city)}
                  placeholder="Enter destination city"
                  className={`${inputPadding} border-2 focus:border-blue-500 ${
                    fieldState.error ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className={`w-full ${buttonPadding} bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transition-all`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Planning Route...
            </>
          ) : (
            "Plan My Route"
          )}
        </Button>
      </div>
    </form>
  );
}