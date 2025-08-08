import type { DayData, ItineraryPlace } from "@/types/itinerary";

export const getIdentifier = (p: ItineraryPlace) => p.placeId ?? p.id;

export function sortByTime(places: ItineraryPlace[]): ItineraryPlace[] {
  return [...places].sort((a, b) => (a.scheduledTime ?? "00:00").localeCompare(b.scheduledTime ?? "00:00"));
}

export function serializeDays(days: DayData[]) {
  return days.map(d => ({ ...d, date: d.date.toISOString() }));
}

export function deserializeDays(raw: any[]): DayData[] {
  return raw.map((d) => ({ ...d, date: new Date(d.date) }));
}
