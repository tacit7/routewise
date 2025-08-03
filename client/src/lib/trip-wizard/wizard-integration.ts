import { TripWizardData } from "@/types/trip-wizard";

/**
 * Transform wizard data to route request format
 */
export interface RouteRequest {
  startLocation: string;
  endLocation: string;
  stops?: string[];
  tripType?: string;
  transportation?: string[];
  preferences?: {
    lodging: string[];
    budgetRange: { min: number; max: number };
    intentions: string[];
    specialNeeds: any;
    accessibility: any;
  };
}

/**
 * Transform Trip Wizard data to route calculation parameters
 */
export function transformWizardToRouteParams(wizardData: TripWizardData): RouteRequest {
  return {
    startLocation: wizardData.startLocation?.description || "",
    endLocation: wizardData.endLocation?.description || "",
    stops: wizardData.stops?.map(stop => stop.description) || [],
    tripType: wizardData.tripType,
    transportation: wizardData.transportation,
    preferences: {
      lodging: wizardData.lodging,
      budgetRange: wizardData.budgetRange,
      intentions: wizardData.intentions,
      specialNeeds: wizardData.specialNeeds,
      accessibility: wizardData.accessibility,
    },
  };
}

/**
 * Create trip data for saving with wizard context
 */
export function createTripFromWizard(wizardData: TripWizardData, routeData?: any) {
  const baseTrip = {
    title: generateTripTitle(wizardData),
    startCity: wizardData.startLocation?.main_text || "",
    endCity: wizardData.endLocation?.main_text || "",
    startLocation: wizardData.startLocation?.description || "",
    endLocation: wizardData.endLocation?.description || "",
    stops: wizardData.stops?.map(stop => stop.description) || [],
    tripType: wizardData.tripType,
    transportation: wizardData.transportation,
    lodging: wizardData.lodging,
    budgetRange: wizardData.budgetRange,
    intentions: wizardData.intentions,
    specialNeeds: wizardData.specialNeeds,
    accessibility: wizardData.accessibility,
    flexibleDates: wizardData.flexibleDates,
    startDate: wizardData.startDate,
    endDate: wizardData.endDate,
    createdFrom: "wizard" as const,
    createdAt: new Date().toISOString(),
  };

  if (routeData) {
    return {
      ...baseTrip,
      routeData: {
        distance: routeData.distance,
        duration: routeData.duration,
        polyline: routeData.polyline,
      },
      poisData: routeData.pois || [],
    };
  }

  return baseTrip;
}

/**
 * Generate a descriptive trip title based on wizard data
 */
function generateTripTitle(wizardData: TripWizardData): string {
  const start = wizardData.startLocation?.main_text || "Start";
  const end = wizardData.endLocation?.main_text || "Destination";
  
  const tripTypeLabels = {
    "road-trip": "Road Trip",
    "flight-based": "Flight Trip", 
    "combo": "Multi-Modal Trip",
  };

  const tripTypeLabel = tripTypeLabels[wizardData.tripType] || "Trip";
  
  return `${tripTypeLabel}: ${start} to ${end}`;
}

/**
 * Extract POI filtering criteria from wizard intentions
 */
export function getPoiFilterCriteria(wizardData: TripWizardData) {
  const intentionToPoiTypes: Record<string, string[]> = {
    "sightseeing": ["tourist_attraction", "museum", "park"],
    "food": ["restaurant", "cafe", "bar"],
    "nature": ["park", "natural_feature", "campground"],
    "culture": ["museum", "art_gallery", "historical_site"],
    "adventure": ["amusement_park", "zoo", "aquarium"],
    "shopping": ["shopping_mall", "store"],
    "nightlife": ["bar", "night_club"],
    "relaxation": ["spa", "park", "beach"],
  };

  const poiTypes = new Set<string>();
  
  wizardData.intentions.forEach(intention => {
    const types = intentionToPoiTypes[intention.toLowerCase()];
    if (types) {
      types.forEach(type => poiTypes.add(type));
    }
  });

  return {
    types: Array.from(poiTypes),
    budgetRange: wizardData.budgetRange,
    accessibility: wizardData.accessibility,
    specialNeeds: wizardData.specialNeeds,
  };
}

/**
 * Validate wizard data is complete enough for route calculation
 */
export function validateWizardForRouteCalculation(wizardData: TripWizardData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!wizardData.startLocation) {
    errors.push("Start location is required");
  }

  if (!wizardData.endLocation) {
    errors.push("End location is required");
  }

  if (!wizardData.tripType) {
    errors.push("Trip type is required");
  }

  if (!wizardData.transportation || wizardData.transportation.length === 0) {
    errors.push("Transportation method is required");
  }

  if (!wizardData.flexibleDates && (!wizardData.startDate || !wizardData.endDate)) {
    errors.push("Dates are required unless marked as flexible");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create URL parameters for route results page
 */
export function createRouteResultsUrl(wizardData: TripWizardData): string {
  const params = new URLSearchParams();
  
  if (wizardData.startLocation) {
    params.set("start", wizardData.startLocation.description);
  }
  
  if (wizardData.endLocation) {
    params.set("end", wizardData.endLocation.description);
  }
  
  if (wizardData.stops && wizardData.stops.length > 0) {
    params.set("stops", wizardData.stops.map(s => s.description).join("|"));
  }
  
  params.set("fromWizard", "true");
  params.set("tripType", wizardData.tripType);
  
  return `/route-results?${params.toString()}`;
}