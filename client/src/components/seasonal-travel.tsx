import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Snowflake, Sun, Leaf, Flower2, ArrowRight } from "lucide-react";

// Get current season based on date
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
};

// Seasonal travel ideas
const SEASONAL_IDEAS = {
  spring: {
    title: 'Spring Awakening Trips',
    subtitle: 'Blooms, Mild Weather & Fresh Adventures',
    icon: Flower2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    trips: [
      {
        title: 'Cherry Blossom Trail',
        location: 'Washington D.C. to Virginia',
        image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=300&fit=crop',
        highlights: ['Tidal Basin', 'Shenandoah National Park', 'Blue Ridge Parkway'],
        duration: '5 days',
        bestTime: 'Late March - April'
      },
      {
        title: 'Texas Wildflower Route',
        location: 'Hill Country, Texas',
        image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop',
        highlights: ['Bluebonnet fields', 'Fredericksburg', 'Austin'],
        duration: '4 days',
        bestTime: 'March - April'
      },
      {
        title: 'California Desert Blooms',
        location: 'Anza-Borrego to Joshua Tree',
        image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop',
        highlights: ['Wildflower super blooms', 'Desert landscapes', 'Joshua Tree NP'],
        duration: '6 days',
        bestTime: 'March - May'
      }
    ]
  },
  summer: {
    title: 'Summer Road Trip Adventures',
    subtitle: 'Long Days, Warm Nights & Epic Journeys',
    icon: Sun,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    trips: [
      {
        title: 'Pacific Northwest Loop',
        location: 'Seattle to Portland',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        highlights: ['Mount Rainier', 'Crater Lake', 'Columbia River Gorge'],
        duration: '8 days',
        bestTime: 'June - August'
      },
      {
        title: 'Great Lakes Shore Drive',
        location: 'Michigan to Minnesota',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        highlights: ['Mackinac Island', 'Pictured Rocks', 'Duluth'],
        duration: '10 days',
        bestTime: 'July - August'
      },
      {
        title: 'Alaska Highway Adventure',
        location: 'Seattle to Anchorage',
        image: 'https://images.unsplash.com/photo-1539635278303-dd5c92632f4d?w=400&h=300&fit=crop',
        highlights: ['Denali National Park', 'Midnight sun', 'Wildlife viewing'],
        duration: '14 days',
        bestTime: 'June - August'
      }
    ]
  },
  fall: {
    title: 'Fall Foliage Spectacular',
    subtitle: 'Golden Leaves, Crisp Air & Harvest Season',
    icon: Leaf,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    trips: [
      {
        title: 'New England Fall Colors',
        location: 'Vermont to New Hampshire',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        highlights: ['White Mountains', 'Covered bridges', 'Apple orchards'],
        duration: '7 days',
        bestTime: 'Late September - October'
      },
      {
        title: 'Blue Ridge Parkway',
        location: 'Virginia to North Carolina',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        highlights: ['Shenandoah NP', 'Great Smoky Mountains', 'Scenic overlooks'],
        duration: '6 days',
        bestTime: 'October'
      },
      {
        title: 'Upper Midwest Colors',
        location: 'Minnesota to Wisconsin',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        highlights: ['North Shore', 'Apostle Islands', 'Fall festivals'],
        duration: '5 days',
        bestTime: 'September - October'
      }
    ]
  },
  winter: {
    title: 'Winter Wonderland Escapes',
    subtitle: 'Snow Sports, Cozy Towns & Desert Warmth',
    icon: Snowflake,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    trips: [
      {
        title: 'Desert Southwest Warmth',
        location: 'Arizona to Southern California',
        image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop',
        highlights: ['Grand Canyon', 'Sedona', 'Palm Springs'],
        duration: '8 days',
        bestTime: 'December - February'
      },
      {
        title: 'Florida Keys Adventure',
        location: 'Miami to Key West',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        highlights: ['Overseas Highway', 'Key Largo', 'Hemingway House'],
        duration: '5 days',
        bestTime: 'December - March'
      },
      {
        title: 'Texas Hill Country',
        location: 'Austin to San Antonio',
        image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop',
        highlights: ['Wine country', 'German towns', 'Mild weather'],
        duration: '4 days',
        bestTime: 'December - February'
      }
    ]
  }
};

export default function SeasonalTravel() {
  const [, setLocation] = useLocation();
  const currentSeason = getCurrentSeason();
  const seasonalData = SEASONAL_IDEAS[currentSeason];
  const IconComponent = seasonalData.icon;

  const handleExploreMore = () => {
    setLocation('/dashboard');
  };

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${seasonalData.bgColor} ${seasonalData.borderColor} border`}>
              <IconComponent className={`w-6 h-6 ${seasonalData.color}`} />
            </div>
            <Badge className={`${seasonalData.bgColor} ${seasonalData.color} border-current px-3 py-1`}>
              Perfect for {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}
            </Badge>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {seasonalData.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {seasonalData.subtitle}
          </p>
        </div>

        {/* Trip Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {seasonalData.trips.map((trip, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="relative">
                <img 
                  src={trip.image} 
                  alt={trip.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Badge className={`${seasonalData.bgColor} ${seasonalData.color} border-current`}>
                    {trip.bestTime}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-2">{trip.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 flex items-center gap-1">
                  <span>📍</span>
                  {trip.location}
                </p>
                
                {/* Duration */}
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <span className="font-medium">Duration:</span>
                  <span className="text-muted-foreground">{trip.duration}</span>
                </div>
                
                {/* Highlights */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-sm">Highlights:</h4>
                  <div className="space-y-1">
                    {trip.highlights.slice(0, 3).map((highlight, hlIndex) => (
                      <div key={hlIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={`w-1.5 h-1.5 rounded-full ${seasonalData.color.replace('text-', 'bg-')}`}></div>
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                  onClick={() => setLocation('/places-explorer')}
                >
                  Plan This Trip
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button 
            onClick={handleExploreMore}
            size="lg"
            className="bg-primary hover:bg-primary/90 px-8 py-3"
          >
            Explore More Seasonal Ideas
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}