import { Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SidebarProps } from "@/types/trip-wizard";
import { STEP_TITLES } from "@/lib/trip-wizard/wizard-utils";

export function DesktopProgressSidebar({ 
  currentStep, 
  totalSteps,
  completedSteps 
}: SidebarProps) {
  return (
    <Card className="p-6 sticky top-8 hidden lg:block">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Plan Your Trip</CardTitle>
        <CardDescription>
          Create your perfect road trip itinerary
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {STEP_TITLES.map((title, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = completedSteps.includes(stepNumber);
          const isUpcoming = stepNumber > currentStep;
          
          return (
            <div 
              key={stepNumber}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                isActive && "bg-primary/10 border border-primary/20",
                isCompleted && !isActive && "bg-green-50 border border-green-200",
                isUpcoming && "opacity-60"
              )}
              role="listitem"
              aria-current={isActive ? "step" : undefined}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                isActive && "bg-primary text-white",
                isCompleted && !isActive && "bg-green-500 text-white",
                !isActive && !isCompleted && "bg-slate-200 text-slate-600"
              )}>
                {isCompleted && !isActive ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-sm font-medium block truncate",
                  isActive && "text-primary",
                  isCompleted && !isActive && "text-green-700",
                  !isActive && !isCompleted && "text-slate-600"
                )}>
                  {title}
                </span>
                {isActive && (
                  <span className="text-xs text-primary/70">
                    Current step
                  </span>
                )}
                {isCompleted && !isActive && (
                  <span className="text-xs text-green-600">
                    Complete
                  </span>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Progress summary */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 text-center">
            {completedSteps.length} of {totalSteps} steps completed
          </div>
        </div>
      </CardContent>
    </Card>
  );
}