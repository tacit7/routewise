// Main components
export { TripPlannerWizard } from './TripPlannerWizard';
export { WizardStep } from './WizardStep';

// Step components
export { TripTypeStep } from './components/steps/TripTypeStep';
export { LocationStep } from './components/steps/LocationStep';
export { DatesStep } from './components/steps/DatesStep';
export { TransportationStep } from './components/steps/TransportationStep';
export { LodgingStep } from './components/steps/LodgingStep';
export { IntentionsStep } from './components/steps/IntentionsStep';
export { SpecialNeedsStep } from './components/steps/SpecialNeedsStep';

// Progress components
export { MobileProgressIndicator } from './components/progress/MobileProgressIndicator';
export { DesktopProgressSidebar } from './components/progress/DesktopProgressSidebar';
export { StepTransition } from './components/progress/StepTransition';

// Shared components
export { OptionCard } from './components/shared/OptionCard';
export { ValidationMessage } from './components/shared/ValidationMessage';
export { AccessibleFormField } from './components/shared/AccessibleFormField';
export { StepErrorBoundary } from './components/shared/StepErrorBoundary';
export { StepSkeleton } from './components/shared/StepSkeleton';

// Modal components
export { DraftRecoveryModal } from './components/modals/DraftRecoveryModal';
export { ExitConfirmationModal } from './components/modals/ExitConfirmationModal';

// Hooks
export { useWizardForm } from '@/hooks/trip-wizard/useWizardForm';
export { useAutoSave } from '@/hooks/trip-wizard/useAutoSave';
export { useDraftRecovery } from '@/hooks/trip-wizard/useDraftRecovery';
export { useKeyboardNavigation } from '@/hooks/trip-wizard/useKeyboardNavigation';
export { useFocusManagement } from '@/hooks/trip-wizard/useFocusManagement';
export { useScreenReaderAnnouncements } from '@/hooks/trip-wizard/useScreenReaderAnnouncements';

// Types
export type * from '@/types/trip-wizard';

// Utils
export * from '@/lib/trip-wizard/wizard-utils';
export * from '@/lib/trip-wizard/storage';
export * from '@/lib/trip-wizard/accessibility';