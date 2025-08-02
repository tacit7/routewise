import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Clock, 
  Route, 
  Share, 
  Trash2, 
  Eye,
  Calendar,
  Globe
} from "lucide-react";

interface Trip {
  id: number;
  title: string;
  startCity: string;
  endCity: string;
  checkpoints: string[];
  routeData?: {
    distance?: string;
    duration?: string;
  };
  poisData: any[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SavedTripsProps {
  onTripSelect?: (trip: Trip) => void;
  showPublicTrips?: boolean;
}

export function SavedTrips({ onTripSelect, showPublicTrips = false }: SavedTripsProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const endpoint = showPublicTrips ? "/api/trips/public/recent" : "/api/trips";
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        if (response.status === 401 && !showPublicTrips) {
          setError("Please sign in to view your saved trips");
          return;
        }
        throw new Error("Failed to fetch trips");
      }
      
      const data = await response.json();
      setTrips(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError(err instanceof Error ? err.message : "Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [showPublicTrips]);

  const handleDeleteTrip = async (tripId: number) => {
    if (!confirm("Are you sure you want to delete this trip?")) {
      return;
    }

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete trip");
      }

      setTrips(trips.filter(trip => trip.id !== tripId));
      toast({
        title: "Trip Deleted",
        description: "The trip has been removed from your collection.",
      });
    } catch (err) {
      console.error("Error deleting trip:", err);
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    }
  };

  const handleShareTrip = (trip: Trip) => {
    const url = `${window.location.origin}/trips/${trip.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Trip link has been copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No trips found</h3>
            <p>
              {showPublicTrips 
                ? "No public trips have been shared yet" 
                : "Start planning your first trip to see it here"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {showPublicTrips ? "Public Trips" : "Your Saved Trips"}
        </h3>
        <Badge variant="secondary">{trips.length} trips</Badge>
      </div>

      {trips.map((trip) => (
        <Card key={trip.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{trip.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {trip.startCity} → {trip.endCity}
                  {trip.checkpoints.length > 0 && (
                    <span className="text-xs">
                      via {trip.checkpoints.length} stop{trip.checkpoints.length > 1 ? 's' : ''}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                {trip.isPublic && (
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    Public
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-muted-foreground" />
                <span>{trip.poisData.length} POIs</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(trip.createdAt)}</span>
              </div>
              {trip.routeData?.distance && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{trip.routeData.distance}</span>
                </div>
              )}
              {trip.routeData?.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{trip.routeData.duration}</span>
                </div>
              )}
            </div>

            {trip.checkpoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Stops:</h4>
                <div className="flex flex-wrap gap-1">
                  {trip.checkpoints.map((checkpoint, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {checkpoint}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onTripSelect?.(trip)}
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                {trip.isPublic && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShareTrip(trip)}
                    className="gap-1"
                  >
                    <Share className="h-4 w-4" />
                    Share
                  </Button>
                )}
              </div>
              
              {!showPublicTrips && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTrip(trip.id)}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default SavedTrips;