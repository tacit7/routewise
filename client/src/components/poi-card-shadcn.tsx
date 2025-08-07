import {
  Star,
  ArrowRight,
  MapPin,
  Clock,
  X,
  ExternalLink,
  Map,
  Loader2,
} from "lucide-react";
import type { Poi } from "@shared/schema";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils";
import { useState } from "react";
import { useTripPlaces } from "@/hooks/use-trip-places";
import { usePersonalizedTrips } from "@/hooks/use-personalized-trips";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface PoiCardProps {
  poi: Poi;
  variant?: 'default' | 'grid' | 'compact';
  showRelevanceScore?: boolean;
}

export default function PoiCardShadcn({ 
  poi, 
  variant = 'default', 
  showRelevanceScore = false 
}: PoiCardProps) {
  const categoryIcon = getCategoryIcon(poi.category);
  const categoryColor = getCategoryColor(poi.category);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { isInTrip, addToTrip, isAddingToTrip } = useTripPlaces();
  const isAddedToTrip = isInTrip(poi);

  const { calculateRelevanceScore, isPersonalized } = usePersonalizedTrips();
  const relevanceScore = isPersonalized ? calculateRelevanceScore(poi) : 0;

  const handleAddToTrip = () => {
    addToTrip(poi);
  };

  // Compact variant using minimal Card
  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-sm transition-all p-2">
        <div className="flex gap-2">
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm truncate">{poi.name}</CardTitle>
            <CardDescription className="text-xs line-clamp-1">
              {poi.description}
            </CardDescription>
            <div className="flex items-center justify-between mt-1">
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                {poi.rating}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {poi.timeFromStart}
              </span>
            </div>
            <Button
              onClick={handleAddToTrip}
              disabled={isAddedToTrip || isAddingToTrip}
              size="sm"
              variant={isAddedToTrip ? "secondary" : "default"}
              className="w-full mt-2"
            >
              {isAddingToTrip ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Adding...</>
              ) : isAddedToTrip ? (
                <><Map className="h-3 w-3 mr-1" />In Trip</>
              ) : (
                <><Map className="h-3 w-3 mr-1" />Add to Trip</>
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Full card with Dialog for details
  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-xl transition-shadow">
        <div className="relative">
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className={`w-full object-cover rounded-t-lg ${
              variant === 'grid' ? 'h-56' : 'h-48'
            }`}
          />
          {showRelevanceScore && isPersonalized && relevanceScore > 0.6 && (
            <Badge 
              className="absolute top-2 right-2 bg-amber-100 text-amber-700"
            >
              {Math.round(relevanceScore * 100)}% match
            </Badge>
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className={categoryColor}>
              <i className={`${categoryIcon} mr-1`} />
              {poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {poi.timeFromStart}
            </span>
          </div>
          <CardTitle className={variant === 'grid' ? 'text-lg' : 'text-xl'}>
            {poi.name}
          </CardTitle>
          <CardDescription className={variant === 'grid' ? 'text-sm' : ''}>
            {poi.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1">
          {poi.address && (
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">{poi.address}</span>
            </div>
          )}

          {poi.isOpen !== null && (
            <div className="flex items-center text-sm mb-3">
              <Clock className="h-3 w-3 mr-1" />
              <Badge 
                variant={poi.isOpen ? "default" : "destructive"}
                className="text-xs"
              >
                {poi.isOpen ? "Open now" : "Closed"}
              </Badge>
              {poi.priceLevel && (
                <span className="ml-2 text-muted-foreground">
                  {"$".repeat(poi.priceLevel)}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center space-x-1 cursor-help">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-medium">{poi.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    • {poi.reviewCount} reviews
                  </span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-48">
                <p className="text-sm">
                  Based on {poi.reviewCount} verified reviews from travelers
                </p>
              </HoverCardContent>
            </HoverCard>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="p-0">
                  View Details <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{poi.name}</DialogTitle>
                  <DialogDescription>
                    Detailed information about this point of interest
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <img
                    src={poi.imageUrl}
                    alt={poi.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={categoryColor}>
                      <i className={`${categoryIcon} mr-1`} />
                      {poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}
                    </Badge>
                    <Badge variant="secondary">
                      {poi.timeFromStart}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground">{poi.description}</p>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    {poi.address && (
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{poi.address}</span>
                      </div>
                    )}

                    <div className="flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-400 fill-current" />
                      <span className="font-medium">{poi.rating}</span>
                      <span className="text-muted-foreground ml-1">
                        ({poi.reviewCount} reviews)
                      </span>
                    </div>

                    {poi.isOpen !== null && (
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        <Badge 
                          variant={poi.isOpen ? "default" : "destructive"}
                        >
                          {poi.isOpen ? "Open now" : "Closed"}
                        </Badge>
                      </div>
                    )}

                    {poi.priceLevel && (
                      <div className="flex items-center">
                        <span className="mr-2">Price:</span>
                        <span className="font-medium">
                          {"$".repeat(poi.priceLevel)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={handleAddToTrip}
                      disabled={isAddedToTrip || isAddingToTrip}
                      variant={isAddedToTrip ? "secondary" : "default"}
                      size="lg"
                    >
                      {isAddingToTrip ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : isAddedToTrip ? (
                        <>
                          <Map className="h-5 w-5 mr-2" />
                          Added to Trip
                        </>
                      ) : (
                        <>
                          <Map className="h-5 w-5 mr-2" />
                          Add to Trip
                        </>
                      )}
                    </Button>

                    {poi.address && (
                      <Button
                        variant="outline"
                        size="lg"
                        asChild
                      >
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            poi.name + " " + poi.address
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-5 w-5 mr-2" />
                          View on Maps
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            onClick={handleAddToTrip}
            disabled={isAddedToTrip || isAddingToTrip}
            variant={isAddedToTrip ? "secondary" : "default"}
            className="w-full"
          >
            {isAddingToTrip ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : isAddedToTrip ? (
              <>
                <Map className="h-4 w-4 mr-2" />
                In Trip
              </>
            ) : (
              <>
                <Map className="h-4 w-4 mr-2" />
                Add to Trip
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}