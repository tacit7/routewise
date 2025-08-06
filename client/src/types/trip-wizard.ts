export interface PlaceSuggestion {
  place_id?: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface BudgetRange {
  min: number;
  max: number;
}

export interface SpecialNeedsData {
  pets: boolean;
  accessibility: boolean;
  kids: boolean;
  notes: string;
}

export interface AccessibilityNeeds {
  screenReader: boolean;
  motorImpairment: boolean;
  visualImpairment: boolean;
  cognitiveSupport: boolean;
  other: string;
}

export type TripType = 'road-trip' | 'flight-based' | 'combo';
export type TransportationOption = 'my-car' | 'rental-car' | 'flights' | 'public-transport' | 'other';
export type LodgingOption = 'hotels' | 'airbnb' | 'campgrounds' | 'free-camping' | 'friends';

export interface TripWizardData {
  tripType: TripType;
  startLocation: PlaceSuggestion | null;
  endLocation: PlaceSuggestion | null;
  stops: PlaceSuggestion[];
  flexibleLocations: boolean;
  startDate: Date | null;
  endDate: Date | null;
  flexibleDates: boolean;
  transportation: TransportationOption[];
  lodging: LodgingOption[];
  budgetRange: BudgetRange;
  intentions: string[];
  specialNeeds: SpecialNeedsData;
  accessibility: AccessibilityNeeds;
}

export interface TripWizardDraft {
  id: string;
  currentStep: number;
  completedSteps: number[];
  lastUpdated: number;
  data: TripWizardData;
  expiresAt: number;
}

export interface WizardStepProps {
  title: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
  isActive: boolean;
  isComplete: boolean;
  children: React.ReactNode;
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
  canProceed: boolean;
  showSkip?: boolean;
}

export interface TripPlannerWizardProps {
  onComplete: (tripData: TripWizardData) => void;
  onCancel: () => void;
  initialData?: Partial<TripWizardData>;
}

export interface ValidationMessageProps {
  error?: string;
  success?: string;
  info?: string;
}

export interface ProgressProps {
  currentStep: number;
  totalSteps: number;
}

export interface SidebarProps extends ProgressProps {
  completedSteps: number[];
  stepTitles: string[];
}

export interface TransitionProps {
  children: React.ReactNode;
  isActive: boolean;
  direction?: 'forward' | 'backward';
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

export interface FormFieldProps {
  label: string;
  children: React.ReactElement;
  error?: string;
  description?: string;
  required?: boolean;
}

export interface OptionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}