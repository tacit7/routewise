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
    icon: '🚗',
    benefits: ['Flexible schedule', 'Scenic routes', 'Multiple stops']
  },
  {
    value: 'flight-based' as TripType,
    title: 'Flight Based',
    description: 'Fly to your destination and explore locally',
    icon: '✈️',
    benefits: ['Faster travel', 'Long distances', 'More time at destination']
  },
  {
    value: 'combo' as TripType,
    title: 'Combo Trip',
    description: 'Combine air travel with driving for the best of both',
    icon: '🚗✈️',
    benefits: []
  }
];

export const TRANSPORTATION_OPTIONS = [
  {
    value: 'my-car' as TransportationOption,
    title: 'My Car',
    description: 'Use your own vehicle',
    icon: '🚗'
  },
  {
    value: 'rental-car' as TransportationOption,
    title: 'Rental Car',
    description: 'Rent a vehicle for your trip',
    icon: '🚙'
  },
  {
    value: 'flights' as TransportationOption,
    title: 'Flights',
    description: 'Air travel between destinations',
    icon: '✈️'
  },
  {
    value: 'public-transport' as TransportationOption,
    title: 'Public Transport',
    description: 'Buses, trains, and local transit',
    icon: '🚌'
  },
  {
    value: 'other' as TransportationOption,
    title: 'Other',
    description: 'Bike, walking, or other methods',
    icon: '🚲'
  }
];

export const LODGING_OPTIONS = [
  {
    value: 'hotels' as LodgingOption,
    title: 'Hotels',
    description: 'Traditional hotel accommodations',
    icon: '🏨'
  },
  {
    value: 'airbnb' as LodgingOption,
    title: 'Airbnb / Rentals',
    description: 'Private homes and rental properties',
    icon: '🏠'
  },
  {
    value: 'campgrounds' as LodgingOption,
    title: 'Campgrounds',
    description: 'Established camping facilities',
    icon: '🏕️'
  },
  {
    value: 'free-camping' as LodgingOption,
    title: 'Free Camping',
    description: 'BLM land and free camping spots',
    icon: '⛺'
  },
  {
    value: 'friends' as LodgingOption,
    title: 'Staying with Friends',
    description: 'Friends, family, or personal connections',
    icon: '👥'
  },
  {
    value: 'no-lodging' as LodgingOption,
    title: "Don't Need Lodging",
    description: 'Day trip or other arrangements',
    icon: '🚗'
  }
];

export const INTENTION_OPTIONS = [
  { value: 'nature', label: 'Nature & Outdoors', icon: '🌲' },
  { value: 'scenic-drives', label: 'Scenic Drives', icon: '🛣️' },
  { value: 'foodie', label: 'Food & Dining', icon: '🍽️' },
  { value: 'hiking', label: 'Hiking & Trails', icon: '🥾' },
  { value: 'history', label: 'History & Culture', icon: '🏛️' },
  { value: 'relaxing', label: 'Relaxing & Wellness', icon: '🧘' },
  { value: 'urban-exploring', label: 'Urban Exploring', icon: '🏙️' },
  { value: 'adventure', label: 'Adventure Sports', icon: '🏔️' },
  { value: 'photography', label: 'Photography', icon: '📸' },
  { value: 'nightlife', label: 'Nightlife & Entertainment', icon: '🎭' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'beaches', label: 'Beaches & Coast', icon: '🏖️' }
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

export const isStepComplete = (stepNumber: number, data: TripWizardData): boolean => {
  switch (stepNumber) {
    case 1:
      return !!data.tripType;
    case 2:
      // Always require at least a starting location
      if (!data.startLocation) return false;
      // If flexible locations, only starting location is required
      if (data.flexibleLocations) return true;
      // If not flexible, require both start and end locations
      return !!(data.startLocation && data.endLocation);
    case 3:
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