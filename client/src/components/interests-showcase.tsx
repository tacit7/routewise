import { useState } from "react";
import UserInterests from "./user-interests";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InterestsShowcaseProps {
  onBack?: () => void;
}

export default function InterestsShowcase({ onBack }: InterestsShowcaseProps) {
  const { toast } = useToast();

  const handleRouteRequest = (startLocation: string, endLocation: string) => {
    // Since we don't have backend, just show a toast with the route info
    toast({
      title: "Route Planning Started!",
      description: `Planning route from ${startLocation} to ${endLocation}`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Demo Header */}
      <section className="py-8 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                User Interests Components
              </h1>
              <p className="text-lg text-slate-600">
                Interactive demo showcasing personalized travel interest selection and trip recommendations
              </p>
            </div>
            <div className="flex gap-3">
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.open('https://github.com/your-repo', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink size={16} />
                View Code
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Smart Interest Selection</h3>
              <p className="text-slate-600">Photographic tiles with smooth animations and toggle functionality</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗺️</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Personalized Trips</h3>
              <p className="text-slate-600">AI-curated trip suggestions based on your selected interests</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Responsive Design</h3>
              <p className="text-slate-600">Mobile-first design with smooth interactions and accessibility</p>
            </div>
          </div>
        </div>
      </section>

      {/* User Interests Components */}
      <UserInterests onRouteRequest={handleRouteRequest} />
      
      {/* Technical Details */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Technical Implementation
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built with modern React patterns and best practices
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">⚛️</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">React 18</h3>
              <p className="text-sm text-slate-600">Modern React with hooks and functional components</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">🎨</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Framer Motion</h3>
              <p className="text-sm text-slate-600">Smooth animations and micro-interactions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">🎯</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">TypeScript</h3>
              <p className="text-sm text-slate-600">Type-safe development with full IntelliSense</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber-600">🎪</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">shadcn/ui</h3>
              <p className="text-sm text-slate-600">Accessible component system with Tailwind CSS</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}