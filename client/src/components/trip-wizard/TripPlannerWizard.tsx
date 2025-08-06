import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Header from "@/components/header";
import { TripPlannerWizardProps, TripWizardData } from "@/types/trip-wizard";
import { WizardStep } from "./WizardStep";
import { StepTransition } from "./components/progress/StepTransition";
import { DraftRecoveryModal } from "./components/modals/DraftRecoveryModal";
import { ExitConfirmationModal } from "./components/modals/ExitConfirmationModal";

// Step components
import { TripTypeStep } from "./components/steps/TripTypeStep";
import { LocationStep } from "./components/steps/LocationStep";
import { DatesStep } from "./components/steps/DatesStep";
import { TransportationStep } from "./components/steps/TransportationStep";
import { LodgingStep } from "./components/steps/LodgingStep";
import { IntentionsStep } from "./components/steps/IntentionsStep";
import { SpecialNeedsStep } from "./components/steps/SpecialNeedsStep";

// Hooks
import { useWizardForm } from "@/hooks/trip-wizard/useWizardForm";
import { useAutoSave } from "@/hooks/trip-wizard/useAutoSave";
import { useDraftRecovery } from "@/hooks/trip-wizard/useDraftRecovery";
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

export function TripPlannerWizard({ 
  onComplete, 
  onCancel, 
  initialData 
}: TripPlannerWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Draft recovery
  const {
    showRecoveryPrompt,
    recoveredDraft,
    isLoading: isDraftLoading,
    acceptDraft,
    rejectDraft,
    dismissPrompt,
  } = useDraftRecovery();

  // Form management
  const { form, validateStep, formData } = useWizardForm({
    initialData: initialData,
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
    canProceed: isStepComplete(currentStep, formData),
  });

  // Handle draft recovery
  const handleAcceptDraft = () => {
    const draft = acceptDraft();
    if (draft) {
      setDraftId(draft.id);
      setCurrentStep(draft.currentStep);
      form.reset(draft.data);
      toast({
        title: "Draft recovered",
        description: `Continuing from step ${draft.currentStep}`,
      });
    }
  };

  const handleRejectDraft = () => {
    rejectDraft();
    toast({
      title: "Starting fresh",
      description: "Previous draft has been cleared",
    });
  };

  // Navigation handlers
  function handleNext() {
    if (!isStepComplete(currentStep, formData)) {
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
      
      announceFormSubmission('success');
      onComplete(formData);
      
      toast({
        title: "Trip plan complete!",
        description: "Your personalized trip is ready to explore.",
      });
    } catch (error) {
      announceFormSubmission('error');
      toast({
        title: "Error",
        description: "Failed to complete trip plan. Please try again.",
        variant: "destructive",
      });
    }
  }

  function handleExit() {
    const hasProgress = currentStep > 1 || completedSteps.length > 0;
    if (hasProgress) {
      setShowExitConfirmation(true);
    } else {
      // Navigate back to home page instead of calling onCancel
      setLocation('/');
    }
  }

  function handleConfirmExit(saveProgress: boolean) {
    if (saveProgress) {
      forceSave();
      toast({
        title: "Progress saved",
        description: "You can continue your trip planning later.",
      });
    } else {
      clearDraft();
    }
    
    setShowExitConfirmation(false);
    // Navigate back to home page instead of calling onCancel
    setLocation('/');
  }

  // Render step content
  const renderStepContent = () => {
    const stepData = form.getValues();
    const errors = form.formState.errors;

    switch (currentStep) {
      case 1:
        return (
          <TripTypeStep
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
          <TransportationStep
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

  if (isDraftLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your trip planner...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Layout */}
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <div className="pt-4 pb-8">
          {/* Breadcrumb and Back Navigation */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExit}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
                <div className="text-sm text-slate-500">
                  Home → Trip Planner
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Unified Card */}
            <div className="card-elevated rounded-lg border border-slate-200">
              {/* Progress Status Header */}
              <div className="p-4 border-b border-slate-100">
                <div className="text-center mb-2">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Step {currentStep} of {TOTAL_STEPS}
                  </h2>
                </div>
                <Progress 
                  value={(currentStep / TOTAL_STEPS) * 100} 
                  className="h-2 bg-slate-200"
                  aria-label={`Trip planner progress: Step ${currentStep} of ${TOTAL_STEPS}`}
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
                    isComplete={isStepComplete(currentStep, formData)}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    canProceed={isStepComplete(currentStep, formData)}
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

      {/* Draft recovery modal */}
      <DraftRecoveryModal
        isOpen={showRecoveryPrompt}
        draft={recoveredDraft}
        onAccept={handleAcceptDraft}
        onReject={handleRejectDraft}
        onCancel={dismissPrompt}
      />

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