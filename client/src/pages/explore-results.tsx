import React, { useState, useMemo } from "react";
import { Search, MapPin, Star, Plus, Check, Calendar } from "lucide-react";
import { TopNav } from "@/features/marketing/top-nav";
import { useExploreResults } from "@/hooks/use-explore-results";
import { adaptApiPoisToComponents } from "@/utils/poi-adapter";
import type { ComponentPOI } from "@/components/poi-list-item";

type MapView = "all" | "itinerary";

export default function ExploreResults() {
  const {
    exploreData,
    pois: apiPois,
    apiKey,
    isLoading,
    error,
    selectedPoiIds,
    hoveredPoi,
    setHoveredPoi,
    handlePoiClick,
    handlePoiSelect,
  } = useExploreResults();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredComponentPoi, setHoveredComponentPoi] = useState<ComponentPOI | null>(null);
  const [mapView, setMapView] = useState<MapView>("all");

  // Convert API POIs to component format
  const componentPois = useMemo(() => {
    return adaptApiPoisToComponents(apiPois, selectedPoiIds);
  }, [apiPois, selectedPoiIds]);

  // Filter POIs based on search and category
  const filteredPois = useMemo(() => {
    return componentPois.filter((poi) => {
      const matchesSearch = poi.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || 
        poi.category.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [componentPois, searchQuery, selectedCategory]);

  const selectedLocations = componentPois.filter(poi => poi.isInTrip).length;

  const handleToggleTrip = (poi: ComponentPOI) => {
    // Use the existing hook's selection handler
    handlePoiSelect(poi.id, !poi.isInTrip);
  };

  const handleComponentPoiClick = (poi: ComponentPOI) => {
    console.log("POI clicked:", poi);
    // Find the corresponding API POI and call the original handler
    const apiPoi = apiPois.find(p => p.id === poi.id);
    if (apiPoi) {
      handlePoiClick(apiPoi);
    }
  };

  // Show loading or error states
  if (!exploreData) return null;
  if (error) {
    return (
      <>
        <TopNav />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Results</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav />
      <div className="min-h-screen bg-background">
        {/* Page Header - exact from screenshot */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Map View</h1>
          <p className="text-gray-600">
            Explore locations on the map and see your itinerary geographically
          </p>
        </div>

        {/* Main Content - exact 2-column layout */}
        <div className="flex">
          {/* Left Side - Map Area */}
          <div className="flex-1 p-6">
            {/* Interactive Map Card */}
            <div className="bg-white rounded-lg border border-gray-200 relative h-96">
              {/* Map Title */}
              <div className="absolute top-4 left-4 z-10">
                <h2 className="text-lg font-semibold text-gray-900">Interactive Map</h2>
              </div>

              {/* Toggle Buttons - centered at top */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-white rounded-full p-1 shadow-sm border border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setMapView("all")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        mapView === "all"
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      All Locations
                    </button>
                    <button
                      onClick={() => setMapView("itinerary")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        mapView === "itinerary"
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      My Itinerary
                    </button>
                  </div>
                </div>
              </div>

              {/* Map Background - green/blue gradient like screenshot */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-green-100 to-blue-200 rounded-lg">
                {/* Mock river line */}
                <div className="absolute top-16 left-8 w-32 h-1 bg-blue-400 rounded transform rotate-12"></div>
                
                {/* Mock POI markers */}
                <div className="absolute top-24 left-20 w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="absolute top-32 left-32 w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="absolute top-28 left-48 w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="absolute top-40 left-40 w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="absolute top-36 left-56 w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="absolute top-48 left-44 w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="absolute bottom-24 right-32 w-4 h-4 bg-red-500 rounded-full"></div>
              </div>

              {/* Legend - bottom left */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Available locations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">In your itinerary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-blue-400"></div>
                    <span className="text-sm text-gray-600">Seine River</span>
                  </div>
                </div>
              </div>

              {/* Bottom instruction */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <p className="text-sm text-gray-500">
                  Click on markers to see location details. Blue markers are in your itinerary.
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar - exact from screenshot */}
          <div className="w-96 bg-white border-l border-gray-200">
            {/* Search & Filter Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Search & Filter</h2>
              </div>

              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="landmarks">Landmarks</option>
                  <option value="restaurants">Restaurants</option>
                  <option value="shopping">Shopping</option>
                  <option value="museums">Museums</option>
                  <option value="religious">Religious Sites</option>
                </select>

                {/* Results Counter */}
                <div className="text-sm text-gray-500">
                  {filteredPois.length} locations found
                </div>
              </div>
            </div>

            {/* POI List Section */}
            <div className="flex-1 overflow-y-auto">
              {/* Section Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  Points of Interest
                </h2>
              </div>

              {/* POI Items */}
              <div>
                {filteredPois.map((poi) => (
                  <div key={poi.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{poi.name}</h3>
                          {poi.isInTrip && (
                            <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded">
                              In Trip
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">{poi.category}</div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-900">{poi.rating}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleTrip(poi)}
                        className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                      >
                        {poi.isInTrip ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trip Overview - bottom section */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                Trip Overview
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Locations:</span>
                  <span className="font-medium text-gray-900">{selectedLocations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trip Duration:</span>
                  <span className="font-medium text-gray-900">7 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
