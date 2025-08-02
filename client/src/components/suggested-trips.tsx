import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SuggestedTripsProps, SuggestedTrip } from "@/types/interests";
import { MapPin, Clock, Star, Route } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TripCard - Pure component for displaying individual trip information
 * 
 * @description Postcard-style trip card with imagery, details, and call-to-action
 */
const TripCard = React.memo<{ 
  trip: SuggestedTrip; 
  onPlanTrip: (trip: SuggestedTrip) => void;
  index: number;
}>(({ trip, onPlanTrip, index }) => {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'challenging': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handlePlanTrip = () => {
    onPlanTrip(trip);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPlanTrip(trip);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0"
    >
      <Card 
        className="w-80 h-96 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg focus-within:ring-4 focus-within:ring-blue-500/50"
        role="article"
        aria-label={`${trip.title} trip suggestion`}
      >
        {/* Hero Image */}
        <div className="relative h-48 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundImage: `url(${trip.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Difficulty Badge */}
          {trip.difficulty && (
            <div className="absolute top-3 right-3">
              <Badge 
                variant="secondary" 
                className={cn("capitalize font-medium border", getDifficultyColor(trip.difficulty))}
              >
                {trip.difficulty}
              </Badge>
            </div>
          )}
          
          {/* Duration Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-white/90 text-slate-800 hover:bg-white/100 font-medium">
              <Clock size={12} className="mr-1" />
              {trip.duration}
            </Badge>
          </div>
        </div>

        <CardContent className="p-5 h-48 flex flex-col">
          {/* Title and Location */}
          <div className="space-y-2 mb-3">
            <h3 className="font-bold text-lg leading-tight text-slate-800 line-clamp-2">
              {trip.title}
            </h3>
            <div className="flex items-center text-sm text-slate-600">
              <MapPin size={14} className="mr-1 text-slate-400" />
              <span className="truncate">
                {trip.startLocation} → {trip.endLocation}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
            {trip.description}
          </p>

          {/* Highlights */}
          {trip.highlights.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {trip.highlights.slice(0, 3).map((highlight, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs px-2 py-0.5 text-slate-600 border-slate-200"
                  >
                    {highlight}
                  </Badge>
                ))}
                {trip.highlights.length > 3 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-0.5 text-slate-500 border-slate-200"
                  >
                    +{trip.highlights.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* CTA Button */}
          <Button 
            onClick={handlePlanTrip}
            onKeyDown={handleKeyDown}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium group/btn focus:ring-4 focus:ring-blue-500/50"
            aria-label={`Plan trip to ${trip.title}`}
          >
            <Route size={16} className="mr-2 transition-transform group-hover/btn:translate-x-0.5" aria-hidden="true" />
            Plan This Trip
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
});

TripCard.displayName = 'TripCard';

/**
 * TripCardSkeleton - Loading state component for trip cards
 */
const TripCardSkeleton = React.memo(() => {
  return (
    <div className="flex-shrink-0">
      <Card className="w-80 h-96 overflow-hidden border-0 shadow-lg">
        <Skeleton className="h-48 w-full" />
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
});

TripCardSkeleton.displayName = 'TripCardSkeleton';

/**
 * SuggestedTrips - A pure, controlled component for displaying trip suggestions
 * 
 * @description Horizontal scroll layout of trip cards with loading and empty states
 * @example
 * ```tsx
 * <SuggestedTrips
 *   trips={trips}
 *   onPlanTrip={(trip) => console.log('Plan trip:', trip)}
 *   isLoading={false}
 * />
 * ```
 */
const SuggestedTrips = React.memo<SuggestedTripsProps>(({ trips, onPlanTrip, isLoading = false }) => {
  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          
          <ScrollArea className="w-full">
            <div className="flex gap-6 pb-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <TripCardSkeleton key={idx} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </section>
    );
  }

  if (trips.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Route size={24} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No trips available
            </h3>
            <p className="text-slate-600">
              Check back later for personalized trip suggestions based on your interests.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Suggested <span className="text-blue-600">Adventures</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover curated journeys tailored to your interests. 
            Each route is crafted to showcase the best experiences along the way.
          </p>
        </motion.div>

        {/* Horizontal Scroll Cards */}
        <ScrollArea className="w-full" aria-label="Suggested trips">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex gap-6 pb-4"
            role="list"
          >
            {trips.map((trip, index) => (
              <div key={trip.id} role="listitem">
                <TripCard
                  trip={trip}
                  onPlanTrip={onPlanTrip}
                  index={index}
                />
              </div>
            ))}
          </motion.div>
        </ScrollArea>

        {/* Scroll Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <Star size={14} className="text-yellow-500" />
            Scroll horizontally to explore more adventures
            <Star size={14} className="text-yellow-500" />
          </p>
        </motion.div>
      </div>
    </section>
  );
});

SuggestedTrips.displayName = 'SuggestedTrips';

export default SuggestedTrips;