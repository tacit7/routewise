import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import PoiSection from "@/components/poi-section";
import FeaturesSection from "@/components/features-section";
import Footer from "@/components/footer";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const routes = JSON.parse(localStorage.getItem('myRoutes') || '[]');
    setSavedRoutes(routes);
  }, []);

  const loadRoute = (route: any) => {
    // Store route data and navigate to results
    localStorage.setItem('currentRoute', JSON.stringify({
      startCity: route.startCity,
      endCity: route.endCity
    }));
    
    setLocation(`/route?start=${encodeURIComponent(route.startCity)}&end=${encodeURIComponent(route.endCity)}`);
    
    toast({
      title: "Route loaded",
      description: `Loading ${route.name} with ${route.placesCount} places`,
    });
  };

  const deleteRoute = (routeId: string) => {
    const routes = savedRoutes.filter(r => r.id !== routeId);
    localStorage.setItem('myRoutes', JSON.stringify(routes));
    setSavedRoutes(routes);
    
    toast({
      title: "Route deleted",
      description: "Route has been removed from your collection",
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      
      {/* Saved Routes Section */}
      {savedRoutes.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">My Saved Routes</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Quick access to your previously planned routes and discovered places
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedRoutes.map((route) => (
                <div key={route.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">{route.name}</h3>
                    <button
                      onClick={() => deleteRoute(route.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <i className="fas fa-trash text-sm" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-slate-600">
                      <i className="fas fa-map-marker-alt mr-2 text-green-600" />
                      <span>{route.startCity}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <i className="fas fa-flag mr-2 text-red-600" />
                      <span>{route.endCity}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <i className="fas fa-star mr-2 text-amber-500" />
                      <span>{route.placesCount} places discovered</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 mb-4">
                    Saved {new Date(route.createdAt).toLocaleDateString()}
                  </div>
                  
                  <Button
                    onClick={() => loadRoute(route)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <i className="fas fa-route mr-2" />
                    View Route
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      <PoiSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
}
