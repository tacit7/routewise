import { Progress } from "@/components/ui/progress";
import { ProgressProps } from "@/types/trip-wizard";
import { calculateProgress } from "@/lib/trip-wizard/wizard-utils";

export function MobileProgressIndicator({ currentStep, totalSteps }: ProgressProps) {
  const progressValue = calculateProgress(currentStep);
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 px-4 py-3 border-b border-slate-200 lg:hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs text-slate-500">
          {progressValue}% Complete
        </span>
      </div>
      <Progress 
        value={progressValue} 
        className="h-2 bg-slate-200"
        aria-label={`Progress: Step ${currentStep} of ${totalSteps}, ${progressValue}% complete`}
      />
    </div>
  );
}