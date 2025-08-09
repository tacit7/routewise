import { useState } from "react";
import RouteForm from "./route-form";
import PlaceForm from "./place-form";
import WizardEntryPoint from "./wizard-entry-point";

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<'route' | 'place'>('route');

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')`
        }}
      />
      <div className="absolute inset-0 bg-slate-900 bg-opacity-40" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Plan Your Perfect <span className="text-accent">Road Trip</span>
        </h2>
        <p className="text-xl text-slate-200 mb-12 max-w-2xl mx-auto">
          Discover amazing stops along your route or explore places around any destination. Let's make every mile memorable.
        </p>
        
        <div className="space-y-8">
          {/* Quick Planning Forms */}
          <div className="bg-surface rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex mb-6 bg-surface-alt rounded-lg p-1">
              <button
                onClick={() => setActiveTab('route')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'route'
                    ? 'bg-surface text-blue-600 shadow-sm'
                    : 'text-muted-fg hover:text-fg'
                }`}
              >
                <i className="fas fa-route mr-2" />
                Plan Route
              </button>
              <button
                onClick={() => setActiveTab('place')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'place'
                    ? 'bg-surface text-purple-600 shadow-sm'
                    : 'text-muted-fg hover:text-fg'
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
                  <h3 className="text-lg font-semibold text-fg mb-2">Quick Route</h3>
                  <p className="text-sm text-slate-600">Get started fast with basic route planning</p>
                </div>
                <RouteForm />
              </div>
            )}

            {activeTab === 'place' && (
              <div>
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-semibold text-fg mb-2">Explore Places</h3>
                  <p className="text-sm text-slate-600">Discover attractions around any city or destination</p>
                </div>
                <PlaceForm />
              </div>
            )}
          </div>
          
          {/* Advanced Trip Planner Option */}
          <WizardEntryPoint variant="hero" />
        </div>
      </div>
    </section>
  );
}
