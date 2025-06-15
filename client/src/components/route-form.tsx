import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateGoogleMapsUrl } from "@/lib/utils";

const routeSchema = z.object({
  startCity: z.string().min(1, "Please enter a starting city"),
  endCity: z.string().min(1, "Please enter a destination city"),
});

type RouteFormData = z.infer<typeof routeSchema>;

export default function RouteForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      startCity: "",
      endCity: "",
    },
  });

  const onSubmit = async (data: RouteFormData) => {
    setIsLoading(true);
    
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const googleMapsUrl = generateGoogleMapsUrl(data.startCity, data.endCity);
      window.open(googleMapsUrl, '_blank');
      
      toast({
        title: "Route planned!",
        description: "Opening Google Maps with your route...",
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
          <Input
            id="startCity"
            placeholder="Enter starting city"
            {...form.register("startCity")}
            className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent"
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
          <Input
            id="endCity"
            placeholder="Enter destination city"
            {...form.register("endCity")}
            className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {form.formState.errors.endCity && (
            <p className="text-sm text-red-600">{form.formState.errors.endCity.message}</p>
          )}
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
