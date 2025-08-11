import React from "react";
import PlacesView from "@/components/places-view";
import { useExploreResults } from "@/hooks/use-explore-results";
import DeveloperCacheFAB from "@/components/developer-cache-fab";

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
  if (error) console.error("❌ Explore Results Error:", error);

  return (
    <>
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
    </>
  );
}
