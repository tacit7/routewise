import type { ItineraryPlace } from "@/types/itinerary";

export const getIdentifier = (p: ItineraryPlace) => (p as any).placeId ?? (p as any).id;

export const sortByTime = (places: ItineraryPlace[]): ItineraryPlace[] =>
  [...places].sort((a, b) => {
    // Sort by dayOrder first (manual reordering takes precedence)
    const aOrder = a.dayOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.dayOrder ?? Number.MAX_SAFE_INTEGER;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    // If dayOrder is the same, sort by time as secondary sort
    return (a.scheduledTime ?? "00:00").localeCompare(b.scheduledTime ?? "00:00");
  });
