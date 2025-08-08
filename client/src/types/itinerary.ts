import type { Poi } from "@shared/schema";

export interface ItineraryPlace extends Poi {
  dayIndex?: number;
  scheduledTime?: string; // "HH:MM" (24-hour)
  dayOrder?: number;
  notes?: string;
}

export interface DayData {
  date: Date;
  title?: string;
  places: ItineraryPlace[];
  mileage?: number;
  driveTime?: string;
}
