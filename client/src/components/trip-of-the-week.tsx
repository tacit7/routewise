import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Clock, MapPin, Star, Calendar, Play, TrendingUp } from "lucide-react";

// Get current week number to rotate trips
const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
};

// Featured trips that rotate weekly
const WEEKLY_TRIPS = [
  {
    id: 'pacific-coast-highway',
    slug: 'pacific-coast-highway',
    title: 'Pacific Coast Highway Adventure',
    subtitle: 'California\'s Iconic Coastal Drive',
    description: 'Experience breathtaking ocean views, charming coastal towns, and dramatic cliffs along one of America\'s most scenic routes.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
    duration: '7 Days',
    difficulty: 'Easy',
    highlights: ['Golden Gate Bridge', 'Big Sur Coastline', 'Hearst Castle', 'Monterey Bay'],
    bestTime: 'April - October',
    totalMiles: '655 miles',
    estimatedCost: '$1,500 - $2,500',
    trending: '+23% interest this week'
  },
  {
    id: 'great-lakes',
    slug: 'great-lakes',
    title: 'Great Lakes Circle Tour',
    subtitle: 'America\'s Inland Seas Adventure',
    description: 'Discover stunning lakeshores, historic lighthouses, and charming harbor towns across the world\'s largest freshwater system.',
    image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=800&h=500&fit=crop',
    duration: '10 Days',
    difficulty: 'Moderate',
    highlights: ['Mackinac Island', 'Pictured Rocks', 'Apostle Islands', 'Sleeping Bear Dunes'],
    bestTime: 'May - September',
    totalMiles: '1,200 miles',
    estimatedCost: '$2,000 - $3,500',
    trending: '+18% interest this week'
  },
  {
    id: 'yellowstone',
    slug: 'yellowstone',
    title: 'Yellowstone National Park',
    subtitle: 'Geysers & Wildlife Wonder',
    description: 'Explore America\'s first national park with incredible geothermal features, diverse wildlife, and pristine wilderness.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
    duration: '6 Days',
    difficulty: 'Moderate',
    highlights: ['Old Faithful', 'Grand Canyon of Yellowstone', 'Lamar Valley', 'Mammoth Hot Springs'],
    bestTime: 'May - September',
    totalMiles: '300 miles (park loops)',
    estimatedCost: '$1,000 - $1,800',
    trending: '+31% interest this week'
  },
  {
    id: 'grand-canyon',
    slug: 'grand-canyon',
    title: 'Grand Canyon National Park',
    subtitle: 'Natural Wonder Experience',
    description: 'Marvel at one of the world\'s most spectacular natural wonders with breathtaking views and hiking adventures.',
    image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=800&h=500&fit=crop',
    duration: '4 Days',
    difficulty: 'Moderate',
    highlights: ['South Rim Views', 'Bright Angel Trail', 'Desert View Watchtower', 'Hermit\'s Rest'],
    bestTime: 'April - May, Sep - Nov',
    totalMiles: '150 miles (rim drives)',
    estimatedCost: '$800 - $1,400',
    trending: '+15% interest this week'
  }
];

export default function TripOfTheWeek() {
  const [, setLocation] = useLocation();
  
  // Rotate trip based on current week
  const weekNumber = getWeekNumber();
  const currentTrip = WEEKLY_TRIPS[weekNumber % WEEKLY_TRIPS.length];

  const handleViewTrip = () => {
    setLocation(`/suggested-trip/${currentTrip.slug}`);
  };

  const handleStartTrip = () => {
    setLocation(`/suggested-trip/${currentTrip.slug}`);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              Trip of the Week
            </Badge>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Featured Adventure
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our carefully curated trip of the week, featuring the best routes and destinations for your next adventure.
          </p>
        </div>

        {/* Featured Trip Card */}
        <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 max-w-5xl mx-auto">
          <div className="md:flex">
            {/* Image Section */}
            <div className="relative md:w-1/2">
              <img 
                src={currentTrip.image} 
                alt={currentTrip.title}
                className="w-full h-64 md:h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-500 text-white px-2 py-1">
                  TRENDING
                </Badge>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                📈 {currentTrip.trending}
              </div>
            </div>

            {/* Content Section */}
            <CardContent className="md:w-1/2 p-8">
              <div className="mb-6">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {currentTrip.title}
                </h3>
                <p className="text-primary font-semibold text-lg mb-4">
                  {currentTrip.subtitle}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {currentTrip.description}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium">{currentTrip.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="font-medium">{currentTrip.difficulty}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium">{currentTrip.totalMiles}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">{currentTrip.bestTime}</span>
                </div>
              </div>

              {/* Highlights */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-primary">Trip Highlights:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {currentTrip.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost and Actions */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated cost</p>
                    <p className="font-semibold text-lg text-primary">{currentTrip.estimatedCost}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleViewTrip}
                      className="px-4"
                    >
                      View Details
                    </Button>
                    <Button 
                      onClick={handleStartTrip}
                      className="bg-primary hover:bg-primary/90 px-6"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Trip
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </section>
  );
}