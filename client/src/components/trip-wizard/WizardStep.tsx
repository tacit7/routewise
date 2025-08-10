import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
        <Card className="w-full card-elevated border-0">
          <CardHeader className="pb-6">
            <div className="text-center space-y-4">
              {/* Main heading */}
              <h2 
                id={`step-${stepNumber}-title`}
                ref={headingRef}
                className="text-3xl font-bold text-slate-900 focus:outline-none"
                tabIndex={-1}
              >
                {title}
              </h2>
              
              {/* Description */}
              {stepDescription && (
                <p 
                  id={`step-${stepNumber}-description`}
                  className="text-slate-500 text-lg max-w-2xl mx-auto"
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
              variant="secondary"
              onClick={onPrevious}
              disabled={stepNumber === 1}
              className={cn(
                "w-full sm:w-auto",
                stepNumber === 1 && "invisible"
              )}
            >
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={canProceed ? "default" : "secondary"}
                    onClick={onNext}
                    disabled={!canProceed}
                    className="w-full sm:w-auto"
                  >
                    {stepNumber === totalSteps ? (
                      <>
                        Complete Trip
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      "Next"
                    )}
                  </Button>
                </TooltipTrigger>
                {!canProceed && (
                  <TooltipContent>
                    <p>
                      {stepNumber === 2 
                        ? "Please enter both a start and destination city to continue"
                        : "Please complete this step to continue"
                      }
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>
      </StepErrorBoundary>
    </div>
  );
}