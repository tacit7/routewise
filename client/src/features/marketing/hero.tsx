import { useState, useEffect } from "react";
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

type HeroProps = {
  overlay?: "none" | "soft" | "strong";
  align?: "left" | "center";
  heightClass?: string;
  cta?: React.ReactNode;
};

export function Hero({ 
  overlay = "strong", 
  align = "center", 
  heightClass = "min-h-[60vh] md:min-h-[70vh]",
  cta 
}: HeroProps) {
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

  const overlayClasses = {
    none: "",
    soft: "bg-gradient-to-b from-black/40 via-black/20 to-black/50",
    strong: "bg-gradient-to-b from-black/60 via-black/30 to-black/60"
  };

  const alignClasses = {
    left: "text-left",
    center: "text-center"
  };

  return (
    <section className={`relative ${heightClass} flex items-center justify-center overflow-hidden -mt-px`}>
      {/* Background image with smooth transitions */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url('${currentImage.url}')`
        }}
      />
      
      {/* Enhanced overlay for better text contrast */}
      {overlay !== "none" && (
        <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
      )}
      
      {/* Carousel navigation - hidden on mobile to reduce clutter */}
      <button
        onClick={prevImage}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white p-1.5 md:p-2 rounded-full transition-all opacity-60 hover:opacity-100"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
      </button>
      
      <button
        onClick={nextImage}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white p-1.5 md:p-2 rounded-full transition-all opacity-60 hover:opacity-100"
        aria-label="Next image"
      >
        <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
      </button>
      
      {/* Image indicators - smaller on mobile */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 md:gap-2">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${
              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Image caption - repositioned for mobile */}
      <div className="absolute bottom-16 md:bottom-20 left-4 z-20 text-white max-w-sm">
        <h3 className="text-sm md:text-lg font-semibold mb-1">{currentImage.title}</h3>
        <p className="text-xs md:text-sm opacity-90 hidden md:block">{currentImage.description}</p>
      </div>
      
      {/* Main hero content */}
      <div className={`relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${alignClasses[align]} w-full`}>
        {/* Enhanced text with better mobile contrast */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-3 md:mb-6 leading-tight">
            {/* Enhanced text shadow and backdrop for mobile readability */}
            <span className="inline-block px-2 py-1 rounded-lg bg-black/30 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none md:px-0 md:py-0">
              Plan Your Perfect{" "}
            </span>
            <span className="inline-block px-2 py-1 rounded-lg bg-teal-600/80 backdrop-blur-sm text-white md:bg-transparent md:backdrop-blur-none md:px-0 md:py-0 md:text-teal-300">
              Getaway
            </span>
          </h1>
          
          <div className="inline-block px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none md:px-0 md:py-0">
            <p className="text-base md:text-xl text-white md:text-gray-200 max-w-2xl mx-auto leading-relaxed">
              Discover amazing stops along your route or explore places around any destination. Let's make every mile memorable.
            </p>
          </div>
        </div>
        
        {/* CTA area */}
        {cta && (
          <div className="w-full">
            {cta}
          </div>
        )}
      </div>
    </section>
  );
}