import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ItineraryPlace } from "@/types/itinerary";

export const getIdentifier = (p: ItineraryPlace) =>
  p.placeId ?? (p as any).id;

export const sortByTime = (places: ItineraryPlace[]) =>
  [...places].sort(
    (a, b) =>
      (a.scheduledTime ?? "00:00").localeCompare(b.scheduledTime ?? "00:00")
  );
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateGoogleMapsUrl(startCity: string, endCity: string): string {
  const baseUrl = 'https://www.google.com/maps/dir/';
  const encodedStart = encodeURIComponent(startCity.trim());
  const encodedEnd = encodeURIComponent(endCity.trim());
  return `${baseUrl}${encodedStart}/${encodedEnd}`;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    restaurant: 'fas fa-utensils',
    park: 'fas fa-tree',
    attraction: 'fas fa-camera',
    scenic: 'fas fa-mountain',
    market: 'fas fa-shopping-basket',
    historic: 'fas fa-landmark'
  };
  return icons[category] || 'fas fa-map-marker-alt';
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    restaurant: 'bg-amber-100 text-amber-600',
    park: 'bg-green-100 text-green-600',
    attraction: 'bg-blue-100 text-blue-600',
    scenic: 'bg-green-100 text-green-600',
    market: 'bg-amber-100 text-amber-600',
    historic: 'bg-blue-100 text-blue-600'
  };
  return colors[category] || 'bg-gray-100 text-gray-600';
}