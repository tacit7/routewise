import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MapPin, Star, Navigation, Gem, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Interface for POI data from API
interface HiddenGem {
  id: string;
  name: string;
  description: string;
  category: string;
  distance: string;
  rating: number;
  image: string;
  location: {
    city: string;
    state: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

// Mock function to get user's location (in production, you'd use geolocation API)
const getUserLocation = async (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Fallback to San Francisco coordinates
          resolve({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      // Fallback to San Francisco coordinates
      resolve({ lat: 37.7749, lng: -122.4194 });
    }
  });
};

// Mock function to fetch hidden gems from POI API
const fetchHiddenGems = async (location: { lat: number; lng: number }): Promise<HiddenGem[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data - in production, this would call your Phoenix backend
  // which would then call the Google Places API
  const mockGems: HiddenGem[] = [
    {
      id: '1',
      name: 'Secret Garden Restaurant',
      description: 'Hidden rooftop dining with panoramic city views and farm-to-table cuisine',
      category: 'dining',
      distance: '2.3 miles',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
      location: {
        city: 'San Francisco',
        state: 'CA',
        coordinates: { lat: 37.7849, lng: -122.4094 }
      }
    },
    {
      id: '2',
      name: 'Whispering Woods Trail',
      description: 'Lesser-known hiking trail with waterfall and ancient redwood groves',
      category: 'nature',
      distance: '8.7 miles',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      location: {
        city: 'Mill Valley',
        state: 'CA',
        coordinates: { lat: 37.9061, lng: -122.5450 }
      }
    },
    {
      id: '3',
      name: 'Underground Jazz Lounge',
      description: 'Intimate speakeasy-style venue featuring local musicians and craft cocktails',
      category: 'nightlife',
      distance: '1.8 miles',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      location: {
        city: 'San Francisco',
        state: 'CA',
        coordinates: { lat: 37.7649, lng: -122.4294 }
      }
    },
    {
      id: '4',
      name: 'Artisan Coffee Roastery',
      description: 'Family-owned micro-roastery with single-origin beans and cozy atmosphere',
      category: 'cafe',
      distance: '0.9 miles',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
      location: {
        city: 'San Francisco',
        state: 'CA',
        coordinates: { lat: 37.7699, lng: -122.4134 }
      }
    },
    {
      id: '5',
      name: 'Historic Lighthouse Point',
      description: 'Secluded lighthouse with dramatic ocean views and rich maritime history',
      category: 'attraction',
      distance: '15.2 miles',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      location: {
        city: 'Pacifica',
        state: 'CA',
        coordinates: { lat: 37.5943, lng: -122.4906 }
      }
    },
    {
      id: '6',
      name: 'Vintage Bookstore Cafe',
      description: 'Quirky bookstore with rare finds, reading nooks, and house-made pastries',
      category: 'shopping',
      distance: '3.1 miles',
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
      location: {
        city: 'Berkeley',
        state: 'CA',
        coordinates: { lat: 37.8715, lng: -122.2730 }
      }
    }
  ];

  return mockGems;
};

// Get category icon and color
const getCategoryStyle = (category: string) => {
  const styles: Record<string, { icon: string; color: string; bgColor: string }> = {
    dining: { icon: '🍽️', color: 'text-red-600', bgColor: 'bg-red-50' },
    nature: { icon: '🌲', color: 'text-green-600', bgColor: 'bg-green-50' },
    nightlife: { icon: '🎵', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    cafe: { icon: '☕', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    attraction: { icon: '📍', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    shopping: { icon: '🛍️', color: 'text-pink-600', bgColor: 'bg-pink-50' }
  };
  return styles[category] || styles.attraction;
};

export default function HiddenGems() {
  const [, setLocation] = useLocation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location on component mount
  useEffect(() => {
    getUserLocation().then(setUserLocation);
  }, []);

  // Fetch hidden gems based on user location
  const { data: hiddenGems, isLoading, error } = useQuery({
    queryKey: ['hidden-gems', userLocation],
    queryFn: () => userLocation ? fetchHiddenGems(userLocation) : Promise.resolve([]),
    enabled: !!userLocation,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const handleExploreGem = (gem: HiddenGem) => {
    // Store the gem data and navigate to places explorer
    localStorage.setItem('exploreContext', JSON.stringify({
      type: 'hidden-gem',
      location: gem.location.city,
      gem: gem,
      timestamp: Date.now()
    }));
    setLocation('/places-explorer');
  };

  const handleFindMoreGems = () => {
    setLocation('/places-explorer');
  };

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-indigo-50 via-background to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground">Unable to load hidden gems at this time.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-indigo-50 via-background to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-indigo-100 border border-indigo-200">
              <Gem className="w-6 h-6 text-indigo-600" />
            </div>
            <Badge className="bg-indigo-100 text-indigo-600 border-indigo-200 px-3 py-1">
              Personalized for You
            </Badge>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Hidden Gems Near You
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Discover unique local spots and off-the-beaten-path destinations that locals love but tourists rarely find.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Finding hidden gems near you...</p>
          </div>
        )}

        {/* Hidden Gems Grid */}
        {hiddenGems && hiddenGems.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {hiddenGems.map((gem) => {
                const categoryStyle = getCategoryStyle(gem.category);
                return (
                  <Card key={gem.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <div className="relative">
                      <img 
                        src={gem.image} 
                        alt={gem.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className={`${categoryStyle.bgColor} ${categoryStyle.color} border-current`}>
                          {categoryStyle.icon} {gem.category}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-black/50 text-white">
                          <Navigation className="w-3 h-3 mr-1" />
                          {gem.distance}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2">{gem.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {gem.description}
                      </p>
                      
                      {/* Rating and Location */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{gem.rating}</span>
                          <span className="text-muted-foreground text-sm">rating</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{gem.location.city}, {gem.location.state}</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleExploreGem(gem)}
                        variant="outline" 
                        className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                      >
                        Explore This Gem
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <Button 
                onClick={handleFindMoreGems}
                size="lg"
                className="bg-primary hover:bg-primary/90 px-8 py-3"
              >
                Find More Hidden Gems
                <Gem className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}