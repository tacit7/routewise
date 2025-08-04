import { Progress } from "@/components/ui/progress";
import { ProgressProps } from "@/types/trip-wizard";
import { calculateProgress } from "@/lib/trip-wizard/wizard-utils";

export function MobileProgressIndicator({ currentStep, totalSteps }: ProgressProps) {
  const progressValue = calculateProgress(currentStep);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">
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