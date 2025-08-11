import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MapPin, TrendingUp, Navigation, Star, ArrowRight, Loader2 } from "lucide-react";

interface POI {
  id: string;
  name: string;
  description: string;
  category: string;
  distance?: string;
  rating: number;
  image: string;
  city: string;
  state: string;
  isTrending?: boolean;
  trendingRank?: number;
}

// Mock function to get user location
const getUserLocation = async (): Promise<{ lat: number; lng: number; city: string } | null> => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In real app, you'd reverse geocode to get city name
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            city: 'San Francisco' // Mock city
          });
        },
        () => resolve(null)
      );
    } else {
      resolve(null);
    }
  });
};

// Mock nearby POIs
const NEARBY_POIS: POI[] = [
  {
    id: 'nearby-1',
    name: 'Golden Gate Bridge',
    description: 'Iconic suspension bridge with stunning views',
    category: 'attraction',
    distance: '2.3 miles',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    city: 'San Francisco',
    state: 'CA'
  },
  {
    id: 'nearby-2',
    name: 'Muir Woods',
    description: 'Ancient redwood forest preserve',
    category: 'nature',
    distance: '12.1 miles',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop',
    city: 'Mill Valley',
    state: 'CA'
  },
  {
    id: 'nearby-3',
    name: 'Alcatraz Island',
    description: 'Historic former federal prison',
    category: 'attraction',
    distance: '3.8 miles',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=300&h=200&fit=crop',
    city: 'San Francisco',
    state: 'CA'
  },
  {
    id: 'nearby-4',
    name: 'Half Moon Bay',
    description: 'Coastal town with beaches and pumpkins',
    category: 'coastal',
    distance: '28.5 miles',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    city: 'Half Moon Bay',
    state: 'CA'
  }
];

// Mock trending POIs (global)
const TRENDING_POIS: POI[] = [
  {
    id: 'trending-1',
    name: 'Antelope Canyon',
    description: 'Stunning slot canyon in Arizona',
    category: 'nature',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=300&h=200&fit=crop',
    city: 'Page',
    state: 'AZ',
    isTrending: true,
    trendingRank: 1
  },
  {
    id: 'trending-2',
    name: 'Mackinac Island',
    description: 'Car-free island with Victorian charm',
    category: 'island',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=300&h=200&fit=crop',
    city: 'Mackinac Island',
    state: 'MI',
    isTrending: true,
    trendingRank: 2
  },
  {
    id: 'trending-3',
    name: 'Big Sur Coastline',
    description: 'Dramatic Pacific coastline drives',
    category: 'coastal',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    city: 'Big Sur',
    state: 'CA',
    isTrending: true,
    trendingRank: 3
  },
  {
    id: 'trending-4',
    name: 'Crater Lake',
    description: 'Deep blue volcanic lake in Oregon',
    category: 'nature',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=300&h=200&fit=crop',
    city: 'Crater Lake',
    state: 'OR',
    isTrending: true,
    trendingRank: 4
  }
];

// Get category icon
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    attraction: '🏛️',
    nature: '🌲',
    coastal: '🏖️',
    island: '🏝️',
    city: '🏙️'
  };
  return icons[category] || '📍';
};

export default function NearbyTrendingPOIs() {
  const [, setLocation] = useLocation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserLocation().then((location) => {
      setUserLocation(location);
      setLoading(false);
    });
  }, []);

  const handlePOIClick = (poi: POI) => {
    // Store POI context and navigate to places explorer
    localStorage.setItem('exploreContext', JSON.stringify({
      type: 'poi-exploration',
      poi: poi,
      location: `${poi.city}, ${poi.state}`,
      timestamp: Date.now()
    }));
    setLocation('/places-explorer');
  };

  const handleViewMore = () => {
    setLocation('/places-explorer');
  };

  const showNearby = userLocation !== null;
  const pois = showNearby ? NEARBY_POIS : TRENDING_POIS;
  const sectionTitle = showNearby ? 'Nearby Attractions' : 'Trending Spots';
  const sectionIcon = showNearby ? Navigation : TrendingUp;
  const SectionIcon = sectionIcon;

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
            <span className="text-muted-foreground">Finding great spots for you...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <SectionIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                {sectionTitle}
              </h2>
              <p className="text-sm text-muted-foreground">
                {showNearby 
                  ? `Great places to visit near ${userLocation?.city}` 
                  : 'Popular destinations travelers are loving right now'
                }
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleViewMore}
            className="h-11 text-primary hover:text-primary/80"
          >
            Explore More
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* POI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {pois.map((poi, index) => (
            <Card 
              key={poi.id} 
              className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => handlePOIClick(poi)}
            >
              <div className="relative">
                <img 
                  src={poi.image} 
                  alt={poi.name}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <span className="text-lg">{getCategoryIcon(poi.category)}</span>
                </div>
                {poi.isTrending && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-red-500 text-white text-xs">
                      #{poi.trendingRank} Trending
                    </Badge>
                  </div>
                )}
                {poi.distance && (
                  <div className="absolute bottom-2 right-2">
                    <Badge className="bg-black/50 text-white text-xs">
                      <Navigation className="w-3 h-3 mr-1" />
                      {poi.distance}
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {poi.name}
                </h3>
                <p className="text-muted-foreground text-xs mb-3 line-clamp-2">
                  {poi.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">{poi.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{poi.city}, {poi.state}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}