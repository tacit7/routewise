import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Calendar, Users, Star, Play, DollarSign, Sun, Navigation, CheckCircle2 } from "lucide-react";
import Header from "@/components/header";
import { useAuth } from "@/components/auth-context";
import UserMenu from "@/components/UserMenu";
import MobileMenu from "@/components/MobileMenu";
import { useToast } from "@/hooks/use-toast";
import { getTripBySlug, type TripData } from "@/data/suggested-trips";

export default function SuggestedTrip({ params }: { params: { tripSlug?: string } }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Extract trip slug from URL params or default to pacific-coast-highway
  const tripSlug = params?.tripSlug || 'pacific-coast-highway';

  useEffect(() => {
    // Load trip data from the comprehensive data structure
    setTimeout(() => {
      const tripData = getTripBySlug(tripSlug);
      if (tripData) {
        setTrip(tripData);
      }
      setLoading(false);
    }, 500);
  }, [tripSlug]);

  const handleStartTrip = () => {
    if (!trip) return;

    // Store trip context for Explorer page
    const explorerContext = {
      tripId: trip.id,
      title: trip.title,
      summary: trip.summary,
      places: trip.places,
      itinerary: trip.itinerary,
      timestamp: Date.now()
    };

    localStorage.setItem('suggestionContext', JSON.stringify(explorerContext));
    
    toast({
      title: "Trip started!",
      description: `Starting your ${trip.title} adventure`,
    });

    // Navigate to places explorer
    setLocation('/places-explorer');
  };

  const handleBack = () => {
    setLocation('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Trip Not Found</h1>
          <Button onClick={handleBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        leftContent={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="hover:bg-white/10 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        }
        centerContent={null}
        rightContent={
          user && (
            <div className="flex items-center gap-2">
              <UserMenu className="hidden md:block" />
              <MobileMenu />
            </div>
          )
        }
      />

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={trip.heroImage} 
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{trip.title}</h1>
            <p className="text-xl md:text-2xl mb-6 opacity-90">{trip.summary}</p>
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                <Clock className="w-4 h-4 mr-1" />
                {trip.duration}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                <Star className="w-4 h-4 mr-1" />
                {trip.difficulty}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                <MapPin className="w-4 h-4 mr-1" />
                {trip.places.length} Places
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                <Sun className="w-4 h-4 mr-1" />
                {trip.bestTime}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                <DollarSign className="w-4 h-4 mr-1" />
                {trip.estimatedCost}
              </Badge>
            </div>
            {/* Trip tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {trip.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-white/10 text-white/80 border-white/20 text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Description */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {trip.description}
          </p>
          
          {/* Start Trip CTA */}
          <Button 
            onClick={handleStartTrip}
            size="lg"
            className="px-12 py-4 text-lg bg-primary hover:bg-primary/90"
          >
            <Play className="w-5 h-5 mr-2" />
            Start This Trip
          </Button>
        </div>

        {/* Trip Tips */}
        {trip.tips && trip.tips.length > 0 && (
          <div className="mb-12 bg-primary/5 rounded-lg p-6 border border-primary/20">
            <h3 className="text-xl font-semibold mb-4 text-center text-primary">💡 Trip Tips</h3>
            <ul className="space-y-2 max-w-2xl mx-auto">
              {trip.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Places to Go Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Places You'll Visit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trip.places.map((place, index) => (
              <Card key={place.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="relative h-48">
                  <img 
                    src={place.image} 
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary/90 text-white px-2 py-1">
                      Stop {index + 1}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2">{place.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                    {place.description}
                  </p>
                  
                  {/* Activities */}
                  {place.activities && place.activities.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-primary mb-1">Top Activities:</p>
                      <div className="flex flex-wrap gap-1">
                        {place.activities.slice(0, 3).map((activity) => (
                          <Badge 
                            key={activity} 
                            variant="secondary" 
                            className="text-xs py-0.5 px-1.5"
                          >
                            {activity}
                          </Badge>
                        ))}
                        {place.activities.length > 3 && (
                          <Badge variant="secondary" className="text-xs py-0.5 px-1.5">
                            +{place.activities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Best time to visit */}
                  {place.bestTimeToVisit && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Best time: {place.bestTimeToVisit}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Itinerary Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Day-by-Day Itinerary</h2>
          <div className="max-w-4xl mx-auto">
            {trip.itinerary.map((day, index) => (
              <div key={day.day} className="relative">
                {/* Timeline connector */}
                {index < trip.itinerary.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-full bg-primary/20 z-0"></div>
                )}
                
                <Card className="mb-6 relative z-10 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Day number circle */}
                      <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {day.day}
                        </span>
                      </div>
                      
                      {/* Day content */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                          <h3 className="text-xl font-bold text-foreground">
                            {day.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 sm:mt-0">
                            <MapPin className="w-4 h-4" />
                            {day.location}
                          </div>
                        </div>
                        
                        {/* Driving time */}
                        {day.drivingTime && (
                          <div className="flex items-center gap-2 mb-3 text-sm">
                            <Navigation className="w-4 h-4 text-primary" />
                            <span className="font-medium">Driving:</span>
                            <span className="text-muted-foreground">{day.drivingTime}</span>
                          </div>
                        )}
                        
                        {/* Estimated time */}
                        {day.estimatedTime && (
                          <div className="flex items-center gap-2 mb-3 text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-medium">Duration:</span>
                            <span className="text-muted-foreground">{day.estimatedTime}</span>
                          </div>
                        )}
                        
                        {/* Activities */}
                        <div className="mb-4">
                          <h4 className="font-semibold text-sm mb-2 text-primary">Activities:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {day.activities.map((activity, actIndex) => (
                              <div key={actIndex} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                                <span className="text-muted-foreground">{activity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Highlights */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2 text-primary">Highlights:</h4>
                          <div className="flex flex-wrap gap-2">
                            {day.highlights.map((highlight, hlIndex) => (
                              <Badge 
                                key={hlIndex} 
                                variant="secondary" 
                                className="text-xs bg-primary/10 text-primary border-primary/20"
                              >
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}