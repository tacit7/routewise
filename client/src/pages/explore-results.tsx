import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Star, Plus, Check, ClipboardList } from "lucide-react";
import { TopNav } from "@/features/marketing/top-nav";
import { InteractiveMap } from "@/components/interactive-map";
import { LeafletMap } from "@/components/leaflet-map";
import { useExploreResults } from "@/hooks/use-explore-results";
import { adaptApiPoisToComponents } from "@/utils/poi-adapter";
import type { ComponentPOI } from "@/components/poi-list-item";
import type { POI } from "@/types/api";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeveloperFab } from "@/components/developer-fab";

type MapView = "all" | "itinerary";

export default function ExploreResults() {
  const [, setLocation] = useLocation();
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
  const [hoveredApiPoi, setHoveredApiPoi] = useState<POI | null>(null);
  const [mapView, setMapView] = useState<MapView>("all");

  // Convert API POIs to component format
  const componentPois = useMemo(() => {
    return adaptApiPoisToComponents(apiPois, selectedPoiIds);
  }, [apiPois, selectedPoiIds]);

  // Filter API POIs for map display based on map view
  const mapPois = useMemo(() => {
    if (mapView === "itinerary") {
      return apiPois.filter(poi => selectedPoiIds.includes(poi.id));
    }
    return apiPois;
  }, [apiPois, selectedPoiIds, mapView]);

  // Filter component POIs based on search, category, and view mode
  const filteredPois = useMemo(() => {
    return componentPois.filter((poi) => {
      const matchesSearch = poi.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || 
        poi.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchesView = mapView === "all" || (mapView === "itinerary" && poi.isInTrip);
      return matchesSearch && matchesCategory && matchesView;
    });
  }, [componentPois, searchQuery, selectedCategory, mapView]);

  const handleStartPlanning = () => {
    setLocation('/planning');
  };

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

  const handleComponentPoiHover = (poi: ComponentPOI | null) => {
    setHoveredComponentPoi(poi);
    if (poi) {
      // Find corresponding API POI for map hover
      const apiPoi = apiPois.find(p => p.id === poi.id);
      setHoveredApiPoi(apiPoi || null);
    } else {
      setHoveredApiPoi(null);
    }
  };

  const handleMapPoiHover = (poi: POI | null) => {
    setHoveredApiPoi(poi);
    if (poi) {
      // Find corresponding component POI for sidebar hover
      const componentPoi = componentPois.find(p => p.id === poi.id);
      setHoveredComponentPoi(componentPoi || null);
    } else {
      setHoveredComponentPoi(null);
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
        {/* Main Content - full height 2-column layout */}
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left Sidebar - using North Star UI */}
          <div className="w-96 bg-card border-r border-border flex flex-col">
            {/* Search & Filter Section - fixed */}
            <div className="p-6 border-b border-border flex-shrink-0">
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={mapView === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapView("all")}
                    className="flex-1"
                  >
                    All Locations
                  </Button>
                  <Button
                    variant={mapView === "itinerary" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapView("itinerary")}
                    className="flex-1"
                  >
                    My Places
                  </Button>
                </div>

                {/* Category Dropdown */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="landmarks">Landmarks</SelectItem>
                    <SelectItem value="restaurants">Restaurants</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="museums">Museums</SelectItem>
                    <SelectItem value="religious">Religious Sites</SelectItem>
                  </SelectContent>
                </Select>

                {/* Results Counter */}
                <div className="text-sm text-muted-foreground">
                  {filteredPois.length} locations found
                </div>
              </div>
            </div>

            {/* POI List Section - scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4">
              {/* POI Items */}
              <div className="space-y-3">
                {filteredPois.map((poi) => (
                  <div 
                    key={poi.id} 
                    className={`p-4 border-2 rounded-lg hover:border-primary cursor-pointer transition-colors ${
                      hoveredComponentPoi?.id === poi.id ? 'border-primary' : 'border-border'
                    }`}
                    onMouseEnter={() => handleComponentPoiHover(poi)}
                    onMouseLeave={() => handleComponentPoiHover(null)}
                    onClick={() => handleComponentPoiClick(poi)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-2">{poi.name}</h3>
                        <Badge variant="secondary" className="mb-2">{poi.category}</Badge>
                        {poi.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{poi.description}</p>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-foreground">{poi.rating}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={poi.isInTrip ? "secondary" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTrip(poi);
                        }}
                        className={`w-8 h-8 p-0 rounded-full ${
                          poi.isInTrip ? "bg-accent hover:bg-accent/80" : ""
                        }`}
                      >
                        {poi.isInTrip ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Planning Button - fixed bottom */}
            <div className="p-6 border-t border-border flex-shrink-0">
              <Button className="w-full gap-2" size="lg" onClick={handleStartPlanning}>
                <ClipboardList className="h-4 w-4" />
                Start Planning
              </Button>
            </div>

          </div>

          {/* Right Side - Map Area */}
          <div className="flex-1 p-6">
            {/* Interactive Map Card */}
            <Card className="relative h-full">

              {/* Toggle Buttons - centered at top */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-card rounded-full p-1 shadow-sm border border-border">
                  <div className="flex">
                    <Button
                      variant={mapView === "all" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMapView("all")}
                      className="rounded-full"
                    >
                      All Locations
                    </Button>
                    <Button
                      variant={mapView === "itinerary" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMapView("itinerary")}
                      className="rounded-full"
                    >
                      My Places
                    </Button>
                  </div>
                </div>
              </div>

              {/* Map - Leaflet for dev, Google Maps for production */}
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                {import.meta.env.DEV ? (
                  <LeafletMap
                    startCity={exploreData.startLocation}
                    endCity={exploreData.startLocation}
                    pois={mapPois}
                    selectedPoiIds={selectedPoiIds}
                    hoveredPoi={hoveredApiPoi}
                    onPoiClick={handlePoiClick}
                    onPoiSelect={handlePoiSelect}
                    onPoiHover={handleMapPoiHover}
                    height="100%"
                    className="rounded-lg"
                  />
                ) : (
                  <InteractiveMap
                    startCity={exploreData.startLocation}
                    endCity={exploreData.startLocation}
                    pois={mapPois}
                    selectedPoiIds={selectedPoiIds}
                    hoveredPoi={hoveredApiPoi}
                    onPoiClick={handlePoiClick}
                    onPoiSelect={handlePoiSelect}
                    onPoiHover={handleMapPoiHover}
                    apiKey={apiKey}
                    height="100%"
                    className="rounded-lg"
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Developer FAB */}
      <DeveloperFab />
    </>
  );
}
