import React from "react";
import PlacesView from "@/components/places-view";
import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Star, Plus, Check, ClipboardList, Clock, Globe } from "lucide-react";
import { TopNav } from "@/features/marketing/top-nav";
import { InteractiveMap } from "@/components/interactive-map";
import { LeafletMap } from "@/components/leaflet-map";
import { useExploreResults } from "@/hooks/use-explore-results";
import DeveloperCacheFAB from "@/components/developer-cache-fab";
import { TopNav } from "@/features/marketing/top-nav";

export default function ExploreResults() {
  const {
    exploreData,
    pois,
    apiKey,
    isLoading,
    error,
    selectedPoiIds,
    hoveredPoi,
    setHoveredPoi,
    handlePoiClick,
    handlePoiSelect,
    cacheInfo,
  } = useExploreResults();

  if (!exploreData) return null;
  if (error) {
    const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
    devLog("❌ Explore Results Error:", error);
  }

  return (
    <>
      <TopNav />
<<<<<<< Updated upstream
      <PlacesView
        startLocation={exploreData.startLocation}
        pois={pois}
        isLoading={isLoading}
        showRouting={false} // No routing for explore mode
        apiKey={apiKey}
        selectedPoiIds={selectedPoiIds}
        hoveredPoi={hoveredPoi}
        onPoiClick={handlePoiClick}
        onPoiSelect={handlePoiSelect}
        onPoiHover={setHoveredPoi}
        headerTitle={`Exploring ${exploreData.startLocation}`}
        sidebarTitle="Places to Explore"
        backUrl="/dashboard"
      />
      <DeveloperCacheFAB cacheInfo={cacheInfo} />
=======
      <div className="min-h-screen bg-background">
        {/* Main Content - full height 2-column layout */}
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left Sidebar - using North Star UI */}
          <div className="w-[480px] bg-card border-r border-border flex flex-col">
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
                    className={`border-2 rounded-lg hover:border-primary cursor-pointer transition-colors overflow-hidden ${
                      hoveredComponentPoi?.id === poi.id ? 'border-primary' : 'border-border'
                    }`}
                    onMouseEnter={() => handleComponentPoiHover(poi)}
                    onMouseLeave={() => handleComponentPoiHover(null)}
                    onClick={() => handleComponentPoiClick(poi)}
                  >
                    {/* POI Image - Full Width at Top */}
                    <div className="w-full h-40 bg-muted relative">
                      {poi.imageUrl ? (
                        <img 
                          src={poi.imageUrl} 
                          alt={poi.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-poi.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <MapPin className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Badges overlaid on image */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="bg-gray-600 text-white border-0">{poi.category}</Badge>
                        {poi.placeTypes && poi.placeTypes.length > 0 && (
                          <Badge variant="secondary" className="bg-gray-500 text-white border-0 text-xs">
                            {poi.placeTypes[0]}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Duration and Accessibility badges overlaid on image */}
                      <div className="absolute top-2 right-2 flex flex-wrap gap-1">
                        {poi.durationSuggested && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-600 text-white px-2 py-1 rounded-full">
                            <Clock className="h-3 w-3" />
                            {poi.durationSuggested}
                          </span>
                        )}
                        {poi.accessibility && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-600 text-white px-2 py-1 rounded-full">
                            <MapPin className="h-3 w-3" />
                            Accessible
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* POI Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-foreground">{poi.name}</h3>
                              {poi.hiddenGem && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">💎</span>
                              )}
                            </div>
                        
                        {(poi.description || (poi.tips && poi.tips.length > 0)) && (
                          <div className="text-sm text-muted-foreground mb-2">
                            {poi.description && <p>{poi.description}</p>}
                            {poi.tips && poi.tips.length > 0 && (
                              <p className={poi.description ? "mt-2" : ""}>
                                <strong>Tips:</strong> {poi.tips.join('. ')}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-foreground">{poi.rating}</span>
                        </div>
                        
                        {/* Enhanced info badges */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {poi.bestTimeToVisit && (
                            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                              <Globe className="h-3 w-3" />
                              {poi.bestTimeToVisit}
                            </span>
                          )}
                        </div>
                          
                          {/* Action Button */}
                          <Button
                            size="sm"
                            variant={poi.isInTrip ? "secondary" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTrip(poi);
                            }}
                            className={`w-8 h-8 p-0 rounded-full flex-shrink-0 ${
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
>>>>>>> Stashed changes
    </>
  );
}
