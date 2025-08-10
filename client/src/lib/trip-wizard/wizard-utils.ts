import { TripWizardData, TripType, TransportationOption, LodgingOption } from "@/types/trip-wizard";

export const TOTAL_STEPS = 7;

export const STEP_TITLES = [
  "Trip Type",
  "Locations", 
  "Dates",
  "Transportation",
  "Lodging",
  "Intentions",
  "Special Needs"
];

export const TRIP_TYPE_OPTIONS = [
  {
    value: 'road-trip' as TripType,
    title: 'Road Trip',
    description: 'Drive to your destination with stops along the way',
    icon: 'car',
    benefits: ['Flexible schedule', 'Scenic routes', 'Multiple stops']
  },
  {
    value: 'flight-based' as TripType,
    title: 'Flight Based',
    description: 'Fly to your destination and explore locally',
    icon: 'plane',
    benefits: ['Faster travel', 'Long distances', 'More time at destination']
  },
  {
    value: 'combo' as TripType,
    title: 'Combo Trip',
    description: 'Combine air travel with driving for the best of both',
    icon: 'combo',
    benefits: []
  }
];

export const TRANSPORTATION_OPTIONS = [
  {
    value: 'my-car' as TransportationOption,
    title: 'My Car',
    description: 'Use your own vehicle',
    icon: 'car'
  },
  {
    value: 'rental-car' as TransportationOption,
    title: 'Rental Car',
    description: 'Rent a vehicle for your trip',
    icon: 'car'
  },
  {
    value: 'flights' as TransportationOption,
    title: 'Flights',
    description: 'Air travel between destinations',
    icon: 'plane'
  },
  {
    value: 'public-transport' as TransportationOption,
    title: 'Public Transport',
    description: 'Buses, trains, and local transit',
    icon: 'bus'
  },
  {
    value: 'other' as TransportationOption,
    title: 'Other',
    description: 'Bike, walking, or other methods',
    icon: 'bike'
  }
];

export const LODGING_OPTIONS = [
  {
    value: 'hotels' as LodgingOption,
    title: 'Hotels',
    description: 'Traditional hotel accommodations',
    icon: 'hotel'
  },
  {
    value: 'airbnb' as LodgingOption,
    title: 'Airbnb / Rentals',
    description: 'Private homes and rental properties',
    icon: 'home'
  },
  {
    value: 'campgrounds' as LodgingOption,
    title: 'Campgrounds',
    description: 'Established camping facilities',
    icon: 'tent'
  },
  {
    value: 'free-camping' as LodgingOption,
    title: 'Free Camping',
    description: 'BLM land and free camping spots',
    icon: 'tent'
  },
  {
    value: 'friends' as LodgingOption,
    title: 'Staying with Friends',
    description: 'Friends, family, or personal connections',
    icon: 'users'
  },
  {
    value: 'no-lodging' as LodgingOption,
    title: "Don't Need Lodging",
    description: 'Day trip or other arrangements',
    icon: 'car'
  }
];

export const INTENTION_OPTIONS = [
  { value: 'nature', label: 'Nature & Outdoors', icon: 'trees' },
  { value: 'scenic-drives', label: 'Scenic Drives', icon: 'car' },
  { value: 'foodie', label: 'Food & Dining', icon: 'utensils' },
  { value: 'hiking', label: 'Hiking & Trails', icon: 'footprints' },
  { value: 'history', label: 'History & Culture', icon: 'landmark' },
  { value: 'relaxing', label: 'Relaxing & Wellness', icon: 'heart' },
  { value: 'urban-exploring', label: 'Urban Exploring', icon: 'buildings' },
  { value: 'adventure', label: 'Adventure Sports', icon: 'mountain' },
  { value: 'photography', label: 'Photography', icon: 'camera' },
  { value: 'nightlife', label: 'Nightlife & Entertainment', icon: 'music' },
  { value: 'shopping', label: 'Shopping', icon: 'shopping-bag' },
  { value: 'beaches', label: 'Beaches & Coast', icon: 'waves' }
];

export const getInitialWizardData = (): TripWizardData => ({
  tripType: 'road-trip',
  startLocation: null,
  endLocation: null,
  stops: [],
  flexibleLocations: false,
  startDate: null,
  endDate: null,
  flexibleDates: false,
  transportation: [],
  lodging: [],
  budgetRange: { min: 100, max: 500 },
  intentions: [],
  specialNeeds: {
    pets: false,
    accessibility: false,
    kids: false,
    notes: ''
  },
  accessibility: {
    screenReader: false,
    motorImpairment: false,
    visualImpairment: false,
    cognitiveSupport: false,
    other: ''
  }
});

export const calculateProgress = (currentStep: number): number => {
  return Math.round((currentStep / TOTAL_STEPS) * 100);
};

export const getStepTitle = (stepNumber: number): string => {
  return STEP_TITLES[stepNumber - 1] || 'Unknown Step';
};

export const isStepComplete = (stepNumber: number, data: TripWizardData, tripMode?: 'route' | 'explore'): boolean => {
  switch (stepNumber) {
    case 1:
      return !!data.tripType;
    case 2:
      // Always require at least a starting location
      if (!data.startLocation) return false;
      // For explore mode, only starting location is required
      if (tripMode === 'explore') return true;
      // If flexible locations, only starting location is required
      if (data.flexibleLocations) return true;
      // If not flexible, require both start and end locations
      return !!(data.startLocation && data.endLocation);
    case 3:
      // For explore mode, dates are optional - can have start, end, both, or be flexible
      if (tripMode === 'explore') return true;
      // For route planning, require both dates unless flexible
      return data.flexibleDates || !!(data.startDate && data.endDate);
    case 4:
      return data.transportation.length > 0;
    case 5:
      return data.lodging.length > 0;
    case 6:
      return data.intentions.length > 0;
    case 7:
      return true; // Special needs is optional
    default:
      return false;
  }
};

export const getCompletedSteps = (data: TripWizardData): number[] => {
  const completed: number[] = [];
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    if (isStepComplete(i, data)) {
      completed.push(i);
    }
  }
  return completed;
};

export const canProceedToStep = (stepNumber: number, data: TripWizardData): boolean => {
  if (stepNumber === 1) return true;
  return isStepComplete(stepNumber - 1, data);
};

export const formatTripSummary = (data: TripWizardData): string => {
  const parts: string[] = [];
  
  if (data.startLocation && data.endLocation && !data.flexibleLocations) {
    parts.push(`${data.startLocation.main_text} → ${data.endLocation.main_text}`);
  } else if (data.flexibleLocations) {
    parts.push('Flexible destinations');
  }
  
  if (data.startDate && data.endDate && !data.flexibleDates) {
    const startDate = new Date(data.startDate).toLocaleDateString();
    const endDate = new Date(data.endDate).toLocaleDateString();
    parts.push(`${startDate} - ${endDate}`);
  } else if (data.flexibleDates) {
    parts.push('Flexible dates');
  }
  
  if (data.intentions.length > 0) {
    const intention = INTENTION_OPTIONS.find(opt => opt.value === data.intentions[0]);
    if (intention) {
      parts.push(intention.label);
    }
  }
  
  return parts.join(' • ') || 'Custom trip';
};

export const estimateTripDuration = (data: TripWizardData): string | null => {
  if (!data.startDate || !data.endDate || data.flexibleDates) {
    return null;
  }
  
  const diffTime = Math.abs(data.endDate.getTime() - data.startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 14) return '1 week';
  if (diffDays < 30) return `${Math.round(diffDays / 7)} weeks`;
  return `${Math.round(diffDays / 30)} months`;
};