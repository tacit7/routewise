export interface ItineraryPlace extends Poi {
  dayIndex?: number;
  scheduledTime?: string; // "HH:MM"
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
