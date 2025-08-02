import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Share } from "lucide-react";

interface TripSaverProps {
  startCity: string;
  endCity: string;
  checkpoints?: string[];
  routeData?: any;
  poisData?: any[];
  onTripSaved?: (trip: any) => void;
}

export function TripSaver({ 
  startCity, 
  endCity, 
  checkpoints = [], 
  routeData, 
  poisData = [],
  onTripSaved 
}: TripSaverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const generateDefaultTitle = () => {
    if (checkpoints.length === 0) {
      return `${startCity} to ${endCity}`;
    } else if (checkpoints.length === 1) {
      return `${startCity} to ${endCity} via ${checkpoints[0]}`;
    } else {
      return `${startCity} to ${endCity} via ${checkpoints.length} stops`;
    }
  };

  const handleSaveTrip = async () => {
    setIsSaving(true);
    
    try {
      const tripData = {
        title: title || generateDefaultTitle(),
        startCity,
        endCity,
        checkpoints,
        routeData,
        poisData,
        isPublic
      };

      const response = await fetch("/api/trips/save-route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save trip");
      }

      const savedTrip = await response.json();
      
      toast({
        title: "Trip Saved!",
        description: `Your trip "${savedTrip.title}" has been saved successfully.`,
      });

      if (onTripSaved) {
        onTripSaved(savedTrip);
      }

      setIsOpen(false);
      setTitle("");
      setIsPublic(false);
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save trip",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Save className="h-4 w-4" />
        Save Trip
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Save Trip
        </CardTitle>
        <CardDescription>
          Save your route and points of interest for future reference
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="trip-title">Trip Title</Label>
          <Input
            id="trip-title"
            placeholder={generateDefaultTitle()}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="public-trip" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Make trip public
            </Label>
            <Switch
              id="public-trip"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Public trips can be viewed and shared with others
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Trip Summary</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Route: {startCity} → {endCity}</p>
            {checkpoints.length > 0 && (
              <p>• Stops: {checkpoints.join(", ")}</p>
            )}
            <p>• Points of Interest: {poisData.length} locations</p>
            {routeData && (
              <>
                {routeData.distance && <p>• Distance: {routeData.distance}</p>}
                {routeData.duration && <p>• Duration: {routeData.duration}</p>}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSaveTrip}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? "Saving..." : "Save Trip"}
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TripSaver;