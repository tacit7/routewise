import type { ItineraryPlace } from "@/types/itinerary";

export const getIdentifier = (p: ItineraryPlace) => (p as any).placeId ?? (p as any).id;

export const sortByTime = (places: ItineraryPlace[]): ItineraryPlace[] =>
  [...places].sort((a, b) => (a.scheduledTime ?? "00:00").localeCompare(b.scheduledTime ?? "00:00"));
