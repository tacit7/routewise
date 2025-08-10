import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Header from "@/components/header";
import { useAuth } from "@/components/auth-context";
import UserMenu from "@/components/UserMenu";
import MobileMenu from "@/components/MobileMenu";
import { TripWizardData, PlaceSuggestion, TransportationOption, LodgingOption, TripType } from "@/types/trip-wizard";
import { WizardStep } from "@/components/trip-wizard/WizardStep";
import { StepTransition } from "@/components/trip-wizard/components/progress/StepTransition";
import { ExitConfirmationModal } from "@/components/trip-wizard/components/modals/ExitConfirmationModal";

// Step components
import { LocationStep } from "@/components/trip-wizard/components/steps/LocationStep";
import { DatesStep } from "@/components/trip-wizard/components/steps/DatesStep";
import { TransportationStep } from "@/components/trip-wizard/components/steps/TransportationStep";
import { LodgingStep } from "@/components/trip-wizard/components/steps/LodgingStep";
import { IntentionsStep } from "@/components/trip-wizard/components/steps/IntentionsStep";
import { SpecialNeedsStep } from "@/components/trip-wizard/components/steps/SpecialNeedsStep";
import { OptionCard } from "@/components/trip-wizard/components/shared/OptionCard";
import { ValidationMessage } from "@/components/trip-wizard/components/shared/ValidationMessage";

// Hooks
import { useWizardForm } from "@/hooks/trip-wizard/useWizardForm";
import { useAutoSave } from "@/hooks/trip-wizard/useAutoSave";
import { useKeyboardNavigation } from "@/hooks/trip-wizard/useKeyboardNavigation";
import { useFocusManagement } from "@/hooks/trip-wizard/useFocusManagement";
import { useScreenReaderAnnouncements } from "@/hooks/trip-wizard/useScreenReaderAnnouncements";

// Utils
import {
  TOTAL_STEPS,
  STEP_TITLES,
  isStepComplete,
  getCompletedSteps,
  canProceedToStep
} from "@/lib/trip-wizard/wizard-utils";
import { clearDraft } from "@/lib/trip-wizard/storage";

// Custom trip type options for exploration (no road trip)
const EXPLORATION_TRIP_TYPE_OPTIONS = [
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
    benefits: ['Flexible options', 'Best of both worlds', 'Optimized travel']
  },
  {
    value: 'not-sure' as TripType,
    title: "I'm not sure",
    description: "I'll decide based on what works best for my exploration",
    icon: 'help-circle',
    benefits: ['Keep options open', 'Flexible planning', 'Decide later']
  }
];

// Custom transportation options for exploration (no car/road trip)
const EXPLORATION_TRANSPORTATION_OPTIONS = [
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
    title: 'Walking/Other',
    description: 'Walking, bike, rideshare, or other methods',
    icon: 'bike'
  },
  {
    value: 'not-sure' as TransportationOption,
    title: 'Not sure yet',
    description: "I'll decide based on what I find",
    icon: 'help-circle'
  }
];

export default function PlacesExplorer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();


  // Form management
  const { form, validateStep, formData } = useWizardForm({
    initialData: undefined,
    onDataChange: (data) => {
      // Auto-save will handle this
    },
  });

  // Auto-save functionality
  const completedSteps = getCompletedSteps(formData);
  const { forceSave, setDraftId } = useAutoSave({
    data: formData,
    currentStep,
    completedSteps,
    enabled: true,
  });

  // Accessibility hooks
  const { manageFocusOnNavigation } = useFocusManagement();
  const { announceStepChange, announceFormSubmission } = useScreenReaderAnnouncements();

  // Keyboard navigation
  useKeyboardNavigation({
    currentStep,
    totalSteps: TOTAL_STEPS,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onExit: handleExit,
    canProceed: isStepComplete(currentStep, formData, 'explore'),
  });


  // Navigation handlers
  function handleNext() {
    if (!isStepComplete(currentStep, formData, 'explore')) {
      validateStep(currentStep);
      return;
    }

    if (currentStep === TOTAL_STEPS) {
      handleComplete();
      return;
    }

    const nextStep = currentStep + 1;
    setDirection('forward');
    setCurrentStep(nextStep);
    manageFocusOnNavigation(nextStep, 'forward');
    announceStepChange(nextStep, STEP_TITLES[nextStep - 1], TOTAL_STEPS);
  }

  function handlePrevious() {
    if (currentStep === 1) return;

    const prevStep = currentStep - 1;
    setDirection('backward');
    setCurrentStep(prevStep);
    manageFocusOnNavigation(prevStep, 'backward');
    announceStepChange(prevStep, STEP_TITLES[prevStep - 1], TOTAL_STEPS);
  }

  function handleComplete() {
    announceFormSubmission('submitting');
    try {
      // Clear the draft since we're completing
      clearDraft();

      // Navigate to explore results with state
      const params = new URLSearchParams({
        location: formData.startLocation?.main_text || '',
        interests: formData.intentions.join(','),
        transportation: formData.transportation.join(','),
        startDate: formData.startDate?.toISOString() || '',
        endDate: formData.endDate?.toISOString() || ''
      });
      setLocation(`/explore-results?${params}`);

      announceFormSubmission('success');

      toast({
        title: "Places exploration ready!",
        description: "Let's discover amazing places in your area.",
      });
    } catch (error) {
      announceFormSubmission('error');
      toast({
        title: "Error",
        description: "Failed to start exploration. Please try again.",
        variant: "destructive",
      });
    }
  }

  function handleExit() {
    const hasProgress = currentStep > 1 || completedSteps.length > 0;
    if (hasProgress) {
      setShowExitConfirmation(true);
    } else {
      setLocation('/dashboard');
    }
  }

  function handleConfirmExit(saveProgress: boolean) {
    if (saveProgress) {
      forceSave();
      toast({
        title: "Progress saved",
        description: "You can continue your exploration planning later.",
      });
    } else {
      clearDraft();
    }

    setShowExitConfirmation(false);
    setLocation('/dashboard');
  }

  // Custom Trip Type Step with exploration options (no road trip, no header text)
  const ExplorationTripTypeStep = ({ value, onChange, error }: {
    value: TripType;
    onChange: (value: TripType) => void;
    error?: string;
  }) => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPLORATION_TRIP_TYPE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              title={option.title}
              description={option.description}
              icon={option.icon}
              selected={value === option.value}
              onClick={() => onChange(option.value)}
              className="h-full"
            />
          ))}
        </div>

        <ValidationMessage error={error} />
      </div>
    );
  };

  // Custom Transportation Step with exploration options
  const ExplorationTransportationStep = ({ value, onChange, error }: {
    value: TransportationOption[];
    onChange: (value: TransportationOption[]) => void;
    error?: string;
  }) => {
    const handleToggle = (option: TransportationOption) => {
      const newValue = value.includes(option)
        ? value.filter(v => v !== option)
        : [...value, option];
      onChange(newValue);
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <p className="text-slate-600">
            Select all transportation methods you'd like to use during your exploration
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPLORATION_TRANSPORTATION_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              title={option.title}
              description={option.description}
              icon={option.icon}
              selected={value.includes(option.value)}
              onClick={() => handleToggle(option.value)}
              className="h-full"
            />
          ))}
        </div>


        {error && (
          <div className="text-sm text-red-600 mt-2">
            {error}
          </div>
        )}
      </div>
    );
  };

  // Render step content
  const renderStepContent = () => {
    const stepData = form.getValues();
    const errors = form.formState.errors;
    

    switch (currentStep) {
      case 1:
        return (
          <ExplorationTripTypeStep
            value={stepData.tripType}
            onChange={(value) => form.setValue('tripType', value)}
            error={errors.tripType?.message}
          />
        );

      case 2:
        return (
          <LocationStep
            startLocation={stepData.startLocation}
            endLocation={stepData.endLocation}
            stops={stepData.stops}
            flexibleLocations={stepData.flexibleLocations}
            tripMode="explore"
            onStartLocationChange={(location) => form.setValue('startLocation', location)}
            onEndLocationChange={(location) => form.setValue('endLocation', location)}
            onStopsChange={(stops) => form.setValue('stops', stops)}
            onFlexibleLocationsChange={(flexible) => form.setValue('flexibleLocations', flexible)}
            errors={{
              startLocation: errors.startLocation?.message,
              endLocation: errors.endLocation?.message,
              stops: errors.stops?.message,
            }}
          />
        );

      case 3:
        return (
          <DatesStep
            startDate={stepData.startDate}
            endDate={stepData.endDate}
            flexibleDates={stepData.flexibleDates}
            onStartDateChange={(date) => form.setValue('startDate', date)}
            onEndDateChange={(date) => form.setValue('endDate', date)}
            onFlexibleDatesChange={(flexible) => form.setValue('flexibleDates', flexible)}
            errors={{
              startDate: errors.startDate?.message,
              endDate: errors.endDate?.message,
            }}
          />
        );

      case 4:
        return (
          <ExplorationTransportationStep
            value={stepData.transportation}
            onChange={(value) => form.setValue('transportation', value)}
            error={errors.transportation?.message}
          />
        );

      case 5:
        return (
          <LodgingStep
            lodging={stepData.lodging}
            budgetRange={stepData.budgetRange}
            onLodgingChange={(value) => form.setValue('lodging', value)}
            onBudgetRangeChange={(value) => form.setValue('budgetRange', value)}
            error={errors.lodging?.message}
          />
        );

      case 6:
        return (
          <IntentionsStep
            value={stepData.intentions}
            onChange={(value) => form.setValue('intentions', value)}
            error={errors.intentions?.message}
          />
        );

      case 7:
        return (
          <SpecialNeedsStep
            specialNeeds={stepData.specialNeeds}
            accessibility={stepData.accessibility}
            onSpecialNeedsChange={(value) => form.setValue('specialNeeds', value)}
            onAccessibilityChange={(value) => form.setValue('accessibility', value)}
            errors={{
              specialNeeds: errors.specialNeeds?.message,
              accessibility: errors.accessibility?.message,
            }}
          />
        );

      default:
        return null;
    }
  };


  return (
    <>
      {/* Page Layout - Matching Trip Wizard */}
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        {/* Header - Clean app bar pattern */}
        <Header
          leftContent={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="hover:bg-[var(--surface-alt)] focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              style={{ color: 'var(--text)' }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          }
          centerContent={
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                  Explorer Wizard
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Step {currentStep} of {TOTAL_STEPS}: {STEP_TITLES[currentStep - 1]}
                </p>
              </div>
            </div>
          }
          rightContent={
            user && (
              <div className="flex items-center gap-2">
                <UserMenu className="hidden md:block" />
                <MobileMenu />
              </div>
            )
          }
        />

        {/* Page Content - Matching Trip Wizard */}
        <div className="pt-4 pb-8">
          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Unified Card - Matching Trip Wizard */}
            <div className="card-elevated rounded-lg border border-slate-200">
              {/* Progress Status Header - Inside Card */}
              <div className="p-4 border-b border-slate-100">
                <div className="text-center mb-2">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Step {currentStep} of {TOTAL_STEPS}
                  </h2>
                </div>
                <Progress
                  value={(currentStep / TOTAL_STEPS) * 100}
                  className="h-2 bg-slate-200"
                  aria-label={`Places explorer progress: Step ${currentStep} of ${TOTAL_STEPS}`}
                />
              </div>

              {/* Main content */}
              <div className="p-6 lg:p-8">
                <StepTransition isActive={true} direction={direction}>
                  <WizardStep
                    title={STEP_TITLES[currentStep - 1]}
                    description=""
                    stepNumber={currentStep}
                    totalSteps={TOTAL_STEPS}
                    isActive={true}
                    isComplete={isStepComplete(currentStep, formData, 'explore')}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    canProceed={isStepComplete(currentStep, formData, 'explore')}
                    showSkip={currentStep === 7} // Only special needs step is skippable
                  >
                    {renderStepContent()}
                  </WizardStep>
                </StepTransition>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Exit confirmation modal */}
      <ExitConfirmationModal
        isOpen={showExitConfirmation}
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitConfirmation(false)}
        hasProgress={currentStep > 1 || completedSteps.length > 0}
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
      />
    </>
  );
}