import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WizardStepProps } from "@/types/trip-wizard";
import { StepErrorBoundary } from "./components/shared/StepErrorBoundary";
import { getStepDescription, getStepInstructions } from "@/lib/trip-wizard/accessibility";

export function WizardStep({
  title,
  description,
  stepNumber,
  totalSteps,
  isActive,
  isComplete,
  children,
  onNext,
  onPrevious,
  onSkip,
  canProceed,
  showSkip = false,
}: WizardStepProps) {
  const stepRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus management when step becomes active
  useEffect(() => {
    if (isActive && headingRef.current) {
      // Small delay to ensure rendering is complete
      setTimeout(() => {
        headingRef.current?.focus();
      }, 100);
    }
  }, [isActive]);

  if (!isActive) return null;

  const stepDescription = description || getStepDescription(stepNumber);
  const stepInstructions = getStepInstructions(stepNumber);

  return (
    <div
      ref={stepRef}
      role="group"
      aria-labelledby={`step-${stepNumber}-title`}
      aria-describedby={`step-${stepNumber}-description`}
      className="w-full"
    >
      <StepErrorBoundary>
        <Card className="w-full shadow-lg border-0 bg-white">
          <CardHeader className="pb-6">
            <div className="text-center space-y-4">
              {/* Step indicator */}
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                <span>Step {stepNumber} of {totalSteps}</span>
              </div>
              
              {/* Main heading */}
              <h2 
                id={`step-${stepNumber}-title`}
                ref={headingRef}
                className="text-2xl font-bold text-slate-800 focus:outline-none"
                tabIndex={-1}
              >
                {title}
              </h2>
              
              {/* Description */}
              {stepDescription && (
                <p 
                  id={`step-${stepNumber}-description`}
                  className="text-slate-600 max-w-2xl mx-auto"
                >
                  {stepDescription}
                </p>
              )}
              
              {/* Instructions for screen readers */}
              <div className="sr-only" aria-live="polite">
                {stepInstructions}
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <div className="max-w-4xl mx-auto text-center">
              {children}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-6 bg-slate-50 border-t border-slate-200">
            {/* Previous button */}
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={stepNumber === 1}
              className={cn(
                "w-full sm:w-auto",
                stepNumber === 1 && "invisible"
              )}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {/* Middle section - Skip button or spacer */}
            <div className="flex-1 flex justify-center">
              {showSkip && onSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSkip}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip this step
                </Button>
              )}
            </div>

            {/* Next button */}
            <Button
              type="button"
              onClick={onNext}
              disabled={!canProceed}
              className={cn(
                "w-full sm:w-auto",
                canProceed 
                  ? "bg-primary hover:bg-primary/90 text-white" 
                  : "bg-slate-200 text-slate-500"
              )}
            >
              {stepNumber === totalSteps ? (
                <>
                  Complete Trip
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </StepErrorBoundary>
    </div>
  );
}