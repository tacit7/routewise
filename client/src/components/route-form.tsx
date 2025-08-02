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

export default function RouteForm() {
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
        console.error('Failed to parse route request:', error);
        localStorage.removeItem('routeRequest');
      }
    }
  }, [form, toast]);

  const onSubmit = async (data: RouteFormData) => {
    setIsLoading(true);
    
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store route data for the results page
      localStorage.setItem('currentRoute', JSON.stringify(data));
      
      // Navigate to route results page
      setLocation(`/route?start=${encodeURIComponent(data.startCity)}&end=${encodeURIComponent(data.endCity)}`);
      
      toast({
        title: "Route planned!",
        description: "Preparing your route with embedded map...",
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
          <Controller
            name="startCity"
            control={form.control}
            render={({ field }) => (
              <CityAutocomplete
                value={field.value}
                onChange={field.onChange}
                placeholder="Enter starting city"
                icon={<MapPin className="h-4 w-4" />}
                error={form.formState.errors.startCity?.message}
              />
            )}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endCity" className="flex items-center text-sm font-medium text-slate-700">
            <Flag className="h-4 w-4 text-accent mr-2" />
            To
          </Label>
          <Controller
            name="endCity"
            control={form.control}
            render={({ field }) => (
              <CityAutocomplete
                value={field.value}
                onChange={field.onChange}
                placeholder="Enter destination city"
                icon={<Flag className="h-4 w-4" />}
                error={form.formState.errors.endCity?.message}
              />
            )}
          />
        </div>
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
          </>
        )}
      </Button>
    </form>
  );
}
