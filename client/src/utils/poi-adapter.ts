import type { POI } from "@/types/api";
import type { ComponentPOI } from "@/components/poi-list-item";

/**
 * Converts API POI data to component-friendly format
 */
export function adaptApiPoiToComponent(
  apiPoi: POI, 
  selectedPoiIds: number[] = []
): ComponentPOI {
  return {
    id: apiPoi.id,
    name: apiPoi.name,
    category: apiPoi.category,
    rating: parseFloat(apiPoi.rating) || 0,
    address: apiPoi.address,
    description: apiPoi.description,
    imageUrl: apiPoi.imageUrl,
    isInTrip: selectedPoiIds.includes(apiPoi.id),
    // Enhanced fields
    hiddenGem: apiPoi.hiddenGem,
    durationSuggested: apiPoi.durationSuggested,
    bestTimeToVisit: apiPoi.bestTimeToVisit,
    accessibility: apiPoi.accessibility,
    tips: apiPoi.tips,
    placeTypes: apiPoi.placeTypes,
  };
}

/**
 * Converts array of API POIs to component format
 */
export function adaptApiPoisToComponents(
  apiPois: POI[], 
  selectedPoiIds: number[] = []
): ComponentPOI[] {
  return apiPois.map(poi => adaptApiPoiToComponent(poi, selectedPoiIds));
}

/**
 * Converts component POI back to API format (for updates)
 */
export function adaptComponentPoiToApi(componentPoi: ComponentPOI): Partial<POI> {
  return {
    id: componentPoi.id,
    name: componentPoi.name,
    category: componentPoi.category,
    rating: componentPoi.rating.toString(),
    address: componentPoi.address || "",
    description: componentPoi.description,
  };
}