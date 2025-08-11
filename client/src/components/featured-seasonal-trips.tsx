import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { ArrowRight, Leaf, Sun, Snowflake, Flower2 } from "lucide-react";

// Get current season
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
};

// Featured seasonal trips with inspiration focus
const FEATURED_SEASONAL_TRIPS = {
  spring: {
    title: 'Spring Adventures',
    icon: Flower2,
    color: 'text-green-600',
    trips: [
      {
        id: 'spring-blooms',
        title: 'Cherry Blossom Drives',
        description: 'Pink petals and scenic spring routes',
        image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop',
        tag: 'Inspiration',
        action: () => '/places-explorer'
      },
      {
        id: 'wildflower-trails',
        title: 'Wildflower Country',
        description: 'Texas Hill Country in bloom',
        image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=250&fit=crop',
        tag: 'Inspiration',
        action: () => '/places-explorer'
      },
      {
        id: 'desert-blooms',
        title: 'Desert Super Blooms',
        description: 'California desert wildflowers',
        image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=250&fit=crop',
        tag: 'Inspiration',
        action: () => '/places-explorer'
      }
    ]
  },
  summer: {
    title: 'Summer Escapes',
    icon: Sun,
    color: 'text-orange-600',
    trips: [
      {
        id: 'coastal-escapes',
        title: 'Coastal Escapes',
        description: 'Pacific Coast beaches and cliffs',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
        tag: 'Featured Trip',
        action: () => '/suggested-trip/pacific-coast-highway'
      },
      {
        id: 'mountain-adventures',
        title: 'Mountain Adventures',
        description: 'Cool mountain retreats and hiking',
        image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=250&fit=crop',
        tag: 'Featured Trip',
        action: () => '/suggested-trip/yellowstone'
      },
      {
        id: 'great-lakes',
        title: 'Great Lakes Shore',
        description: 'Freshwater coastlines and islands',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=250&fit=crop',
        tag: 'Featured Trip',
        action: () => '/suggested-trip/great-lakes'
      }
    ]
  },
  fall: {
    title: 'Fall Foliage',
    icon: Leaf,
    color: 'text-amber-600',
    trips: [
      {
        id: 'fall-colors',
        title: 'Best Fall Drives',
        description: 'New England autumn colors',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
        tag: 'Inspiration',
        action: () => '/places-explorer'
      },
      {
        id: 'blue-ridge',
        title: 'Blue Ridge Parkway',
        description: 'Smoky Mountains fall foliage',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=250&fit=crop',
        tag: 'Inspiration',
        action: () => '/places-explorer'
      },
      {
        id: 'midwest-colors',
        title: 'Midwest Fall Colors',
        description: 'Upper Peninsula autumn drives',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=250&fit=crop',
        tag: 'Inspiration',
        action: () => '/places-explorer'
      }
    ]
  },
  winter: {
    title: 'Winter Warmth',
    icon: Snowflake,
    color: 'text-blue-600',
    trips: [
      {
        id: 'desert-warmth',
        title: 'Desert Warmth',
        description: 'Arizona sunshine and landscapes',
        image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=250&fit=crop',
        tag: 'Featured Trip',
        action: () => '/suggested-trip/grand-canyon'
      },
      {
        id: 'florida-keys',
        title: 'Florida Keys',
        description: 'Tropical island highway adventure',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
        tag: 'Inspiration',
        action: () => '/places-explorer'
      },
      {
        id: 'california-coast',
        title: 'California Coast',
        description: 'Mild winter coastal drives',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
        tag: 'Featured Trip',
        action: () => '/suggested-trip/pacific-coast-highway'
      }
    ]
  }
};

export default function FeaturedSeasonalTrips() {
  const [, setLocation] = useLocation();
  const currentSeason = getCurrentSeason();
  const seasonData = FEATURED_SEASONAL_TRIPS[currentSeason];
  const IconComponent = seasonData.icon;

  const handleTripClick = (trip: any) => {
    const path = typeof trip.action === 'function' ? trip.action() : trip.action;
    setLocation(path);
  };

  return (
    <section className="py-12 section-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <IconComponent className={`w-6 h-6 ${seasonData.color}`} />
            </div>
            <div>
              <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                {seasonData.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                Perfect destinations for this time of year
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
            className="h-11 text-primary hover:text-primary/80"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Trip Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {seasonData.trips.map((trip, index) => (
            <Card 
              key={trip.id} 
              className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => handleTripClick(trip)}
            >
              <div className="relative">
                <img 
                  src={trip.image} 
                  alt={trip.title}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Badge 
                    variant={trip.tag === 'Featured Trip' ? 'default' : 'secondary'}
                    className="text-xs font-medium"
                  >
                    {trip.tag}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4 sm:p-6">
                <h3 className="scroll-m-20 text-lg font-semibold tracking-tight mb-2 group-hover:text-primary transition-colors">
                  {trip.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {trip.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Click to explore
                  </span>
                  <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}