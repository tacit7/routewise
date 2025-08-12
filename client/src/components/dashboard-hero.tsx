import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Route as RouteIcon, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

// Dashboard hero images with inspiring travel destinations
const DASHBOARD_HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    title: 'Pacific Coast Highway',
    location: 'California',
    description: 'Stunning coastal drives and ocean views',
    duration: '7 Days',
    distance: '655 miles',
    difficulty: 'Easy',
    highlights: ['Golden Gate Bridge', 'Big Sur', 'Monterey Bay'],
    tripSlug: 'pacific-coast-highway'
  },
  {
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop',
    title: 'Mountain Adventures',
    location: 'Rocky Mountains',
    description: 'Majestic peaks and alpine landscapes',
    duration: '6 Days',
    distance: '450 miles',
    difficulty: 'Moderate',
    highlights: ['Yellowstone', 'Grand Teton', 'Hot Springs'],
    tripSlug: 'yellowstone'
  },
  {
    url: 'https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=1200&h=400&fit=crop',
    title: 'Great Lakes Circle',
    location: 'Great Lakes Region',
    description: 'America\'s inland seas and charming towns',
    duration: '10 Days',
    distance: '1,200 miles',
    difficulty: 'Moderate',
    highlights: ['Mackinac Island', 'Pictured Rocks', 'Duluth'],
    tripSlug: 'great-lakes'
  },
  {
    url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200&h=400&fit=crop',
    title: 'Desert Wonders',
    location: 'Southwest USA',
    description: 'Epic canyons and desert landscapes',
    duration: '4 Days',
    distance: '300 miles',
    difficulty: 'Easy',
    highlights: ['Grand Canyon', 'Desert Views', 'Hiking Trails'],
    tripSlug: 'grand-canyon'
  },
  {
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=400&fit=crop',
    title: 'Forest Highways',
    location: 'Pacific Northwest',
    description: 'Ancient forests and scenic byways',
    duration: '5 Days',
    distance: '400 miles',
    difficulty: 'Easy',
    highlights: ['Redwood Forests', 'Coastal Roads', 'Scenic Drives'],
    tripSlug: 'pacific-coast-highway'
  }
];

export default function DashboardHero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [, setLocation] = useLocation();

  // Auto-rotate images every 8 seconds (slightly slower for dashboard)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % DASHBOARD_HERO_IMAGES.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % DASHBOARD_HERO_IMAGES.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + DASHBOARD_HERO_IMAGES.length) % DASHBOARD_HERO_IMAGES.length);
  };

  const currentImage = DASHBOARD_HERO_IMAGES[currentImageIndex];

  const handleViewTrip = () => {
    if (currentImage.tripSlug) {
      setLocation(`/suggested-trip/${currentImage.tripSlug}`);
    }
  };

  return (
    <section className="relative h-80 overflow-hidden w-full">
      {/* Background image with smooth transitions */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url('${currentImage.url}')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/40" />
      
      {/* Navigation arrows */}
      <button
        onClick={prevImage}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button
        onClick={nextImage}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
        aria-label="Next image"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Card-style container */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm font-medium">{currentImage.location}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {currentImage.title}
            </h1>
            <p className="text-white/90 text-lg mb-6">
              {currentImage.description}
            </p>
            
            {/* Trip Stats */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handleViewTrip}
                className="bg-green-500/20 hover:bg-green-500/30 text-white border border-green-400/30 px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                View Trip
              </button>
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                <Clock className="w-4 h-4 mr-1" />
                {currentImage.duration}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                <RouteIcon className="w-4 h-4 mr-1" />
                {currentImage.distance}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                <Star className="w-4 h-4 mr-1" />
                {currentImage.difficulty}
              </Badge>
            </div>
            
            {/* Highlights */}
            <div className="mb-6">
              <p className="text-white/80 text-sm mb-2">Top Highlights:</p>
              <div className="flex flex-wrap gap-2">
                {currentImage.highlights.slice(0, 3).map((highlight, index) => (
                  <span key={index} className="text-white/90 text-sm bg-black/20 px-2 py-1 rounded">
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Image indicators */}
      <div className="absolute bottom-4 right-4 z-20 flex gap-2">
        {DASHBOARD_HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Add group class for hover effects */}
      <div className="absolute inset-0 group"></div>
    </section>
  );
}