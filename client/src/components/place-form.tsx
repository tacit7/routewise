import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Loader2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import CityAutocomplete from "@/components/city-autocomplete";

const placeSchema = z.object({
  placeName: z.string().min(1, "Please enter a place or city to explore"),
});

type PlaceFormData = z.infer<typeof placeSchema>;

export default function PlaceForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<PlaceFormData>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      placeName: "",
    },
  });

  const onSubmit = async (data: PlaceFormData) => {
    setIsLoading(true);
    
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Store place data for the results page
      localStorage.setItem('placeData', JSON.stringify({
        placeName: data.placeName,
        fromForm: true,
      }));
      
      // Navigate to place results page with URL parameters
      const placeParams = new URLSearchParams({
        place: data.placeName,
      });
      
      setLocation(`/place-results?${placeParams.toString()}`);
      
      toast({
        title: "Exploring places!",
        description: `Finding amazing places around ${data.placeName}...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load place information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="placeName" className="flex items-center text-sm font-medium text-slate-700">
          <Compass className="h-4 w-4 text-purple-600 mr-2" />
          Explore Places Around
        </Label>
        <Controller
          name="placeName"
          control={form.control}
          render={({ field }) => (
            <CityAutocomplete
              value={field.value}
              onChange={field.onChange}
              placeholder="Enter city or place name"
              icon={<MapPin className="h-4 w-4" />}
              error={form.formState.errors.placeName?.message}
            />
          )}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 h-auto transition-all transform hover:scale-105 focus:ring-4 focus:ring-purple-300"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Finding Places...
          </>
        ) : (
          <>
            <Compass className="h-4 w-4 mr-2" />
            Explore Places
          </>
        )}
      </Button>
    </form>
  );
}