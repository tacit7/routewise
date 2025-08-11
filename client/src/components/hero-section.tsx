import { useState, useEffect } from "react";
import RouteForm from "./route-form";
import PlaceForm from "./place-form";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Hero carousel images with destinations
const HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
    title: 'Pacific Coast Highway',
    description: 'Stunning coastal drives along California\'s rugged coastline'
  },
  {
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop',
    title: 'Mountain Wilderness',
    description: 'Discover majestic peaks and pristine alpine landscapes'
  },
  {
    url: 'https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=1920&h=1080&fit=crop',
    title: 'Great Lakes Beauty',
    description: 'Explore America\'s inland seas and charming coastal towns'
  },
  {
    url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&h=1080&fit=crop',
    title: 'Desert Adventures',
    description: 'Epic journeys through canyon country and desert wonders'
  },
  {
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
    title: 'Forest Highways',
    description: 'Wind through ancient forests and towering redwoods'
  }
];

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<'route' | 'place'>('route');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate images every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  };

  const currentImage = HERO_IMAGES[currentImageIndex];

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden -mt-px">
      {/* Background image with smooth transitions */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url('${currentImage.url}')`
        }}
      />
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Carousel navigation */}
      <button
        onClick={prevImage}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-all"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextImage}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-all"
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      
      {/* Image indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {HERO_IMAGES.map((_, index) => (
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
      
      {/* Image caption */}
      <div className="absolute bottom-20 left-4 z-20 text-white max-w-sm">
        <h3 className="text-lg font-semibold mb-1">{currentImage.title}</h3>
        <p className="text-sm opacity-90">{currentImage.description}</p>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Plan Your Perfect <span className="text-accent">Getaway</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Discover amazing stops along your route or explore places around any destination. Let's make every mile memorable.
        </p>
        
        <div className="space-y-8">
          {/* Quick Planning Forms */}
          <div className="hero-card">
            {/* Tab Navigation */}
            <div className="flex mb-6 bg-gray-50 rounded-lg p-1 border border-gray-200/50">
              <button
                onClick={() => setActiveTab('route')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'route'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <i className="fas fa-route mr-2" />
                Plan Route
              </button>
              <button
                onClick={() => setActiveTab('place')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'place'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <i className="fas fa-compass mr-2" />
                Explore Places
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'route' && (
              <div>
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Quick Route</h3>
                  <p className="text-sm text-muted-foreground">Get started fast with basic route planning</p>
                </div>
                <RouteForm />
              </div>
            )}

            {activeTab === 'place' && (
              <div>
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Explore Places</h3>
                  <p className="text-sm text-muted-foreground">Discover attractions around any city or destination</p>
                </div>
                <PlaceForm />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
