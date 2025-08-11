import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth-context";
import { Heart, MapPin, Clock, Star, ArrowRight, Bookmark, User } from "lucide-react";

// Mock user preferences and saved places
interface UserRecommendation {
  id: string;
  title: string;
  description: string;
  image: string;
  type: 'trip' | 'place' | 'route';
  reason: string;
  duration?: string;
  location: string;
  rating?: number;
  isSaved?: boolean;
  action: string;
}

// Popular starting points for new users
const POPULAR_STARTING_POINTS = [
  {
    id: 'popular-1',
    title: 'West Coast Adventure',
    description: 'Start your Pacific Coast journey from Seattle to San Diego',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    type: 'trip' as const,
    reason: 'Popular with new travelers',
    duration: '10 days',
    location: 'Pacific Coast',
    rating: 4.8,
    action: '/suggested-trip/pacific-coast-highway'
  },
  {
    id: 'popular-2',
    title: 'National Parks Circuit',
    description: 'Explore America\'s most beloved national parks',
    image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=300&h=200&fit=crop',
    type: 'trip' as const,
    reason: 'Great for first-time road trippers',
    duration: '8 days',
    location: 'Southwest USA',
    rating: 4.9,
    action: '/suggested-trip/grand-canyon'
  },
  {
    id: 'popular-3',
    title: 'Great Lakes Discovery',
    description: 'Discover America\'s freshwater coastlines',
    image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=300&h=200&fit=crop',
    type: 'trip' as const,
    reason: 'Hidden gem destination',
    duration: '7 days',
    location: 'Great Lakes',
    rating: 4.7,
    action: '/suggested-trip/great-lakes'
  }
];

// Personalized recommendations for returning users
const PERSONALIZED_RECOMMENDATIONS = [
  {
    id: 'personal-1',
    title: 'Mountain Hideaways',
    description: 'Based on your interest in scenic drives',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=200&fit=crop',
    type: 'place' as const,
    reason: 'Matches your preferences',
    location: 'Colorado Rockies',
    rating: 4.6,
    action: '/places-explorer'
  },
  {
    id: 'personal-2',
    title: 'Coastal Escape Route',
    description: 'Perfect follow-up to your last coastal trip',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    type: 'route' as const,
    reason: 'Similar to places you\'ve saved',
    duration: '5 days',
    location: 'Oregon Coast',
    rating: 4.7,
    isSaved: false,
    action: '/places-explorer'
  },
  {
    id: 'personal-3',
    title: 'Desert Photography Tour',
    description: 'Stunning landscapes for your photo collection',
    image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=300&h=200&fit=crop',
    type: 'trip' as const,
    reason: 'Trending among photographers',
    duration: '4 days',
    location: 'Utah Desert',
    rating: 4.8,
    action: '/places-explorer'
  }
];

// Mock saved places for users (would come from database)
const SAVED_PLACES = [
  {
    id: 'saved-1',
    title: 'Yosemite Valley',
    description: 'Saved for summer 2024 trip planning',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=200&fit=crop',
    type: 'place' as const,
    reason: 'Saved on March 15',
    location: 'California',
    isSaved: true,
    action: '/places-explorer'
  },
  {
    id: 'saved-2',
    title: 'Blue Ridge Parkway',
    description: 'Perfect for fall foliage viewing',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop',
    type: 'route' as const,
    reason: 'Saved on March 10',
    duration: '6 days',
    location: 'Virginia & NC',
    isSaved: true,
    action: '/places-explorer'
  }
];

export default function PersonalRecommendations() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Simulate user having trip history (in real app, check from API)
  const hasUserHistory = isAuthenticated && Math.random() > 0.5; // 50% chance for demo
  const hasSavedPlaces = isAuthenticated && Math.random() > 0.3; // 70% chance for demo

  const handleItemClick = (item: UserRecommendation) => {
    setLocation(item.action);
  };

  const handleSaveToggle = (item: UserRecommendation) => {
    // In real app, would call API to save/unsave
    console.log(`Toggle save for ${item.title}`);
  };

  // Determine which recommendations to show
  let recommendations: UserRecommendation[];
  let sectionTitle: string;
  let sectionSubtitle: string;

  if (!isAuthenticated) {
    recommendations = POPULAR_STARTING_POINTS;
    sectionTitle = 'Popular Trip Ideas';
    sectionSubtitle = 'Great starting points for your first adventure';
  } else if (hasUserHistory) {
    recommendations = PERSONALIZED_RECOMMENDATIONS;
    sectionTitle = 'Trips You Might Like';
    sectionSubtitle = 'Curated based on your interests and travel history';
  } else {
    recommendations = POPULAR_STARTING_POINTS;
    sectionTitle = 'Recommended for You';
    sectionSubtitle = 'Popular destinations to get you started';
  }

  return (
    <section className="py-12 section-gradient-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Recommendations */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  {sectionTitle}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sectionSubtitle}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {recommendations.map((item, index) => (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                <div className="relative">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isAuthenticated && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveToggle(item);
                      }}
                      className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <Heart 
                        className={`w-4 h-4 ${item.isSaved ? 'text-red-400 fill-current' : 'text-white'}`}
                      />
                    </button>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-white/90 text-slate-700 text-xs">
                      {item.reason}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4 sm:p-6">
                  <h3 className="scroll-m-20 text-lg font-semibold tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      {item.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.duration}</span>
                        </div>
                      )}
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span>{item.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">{item.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Saved Places Section */}
        {hasSavedPlaces && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Bookmark className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">Places You Saved</h3>
                  <p className="text-sm text-muted-foreground">Your bookmarked destinations</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/dashboard')}
                className="h-11 text-primary hover:text-primary/80"
              >
                View All Saved
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAVED_PLACES.map((item) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-24 h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <CardContent className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-muted-foreground text-xs mb-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{item.location}</span>
                            <span className="text-primary">• {item.reason}</span>
                          </div>
                        </div>
                        <Bookmark className="w-4 h-4 text-primary fill-current" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}