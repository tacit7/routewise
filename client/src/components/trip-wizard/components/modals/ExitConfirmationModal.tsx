import { useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onConfirm: (saveProgress: boolean) => void;
  onCancel: () => void;
  hasProgress: boolean;
  currentStep: number;
  totalSteps: number;
}

export function ExitConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  hasProgress,
  currentStep,
  totalSteps,
}: ExitConfirmationModalProps) {
  const [saveProgress, setSaveProgress] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      onConfirm(saveProgress);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Exit Trip Planner?</span>
          </DialogTitle>
          <DialogDescription>
            {hasProgress ? (
              `You're ${progressPercentage}% through planning your trip. Are you sure you want to exit?`
            ) : (
              "Are you sure you want to exit the trip planner?"
            )}
          </DialogDescription>
        </DialogHeader>

        {hasProgress && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Save className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Save Your Progress
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                We can save your progress and you can continue later where you left off.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-progress"
                checked={saveProgress}
                onCheckedChange={(checked) => setSaveProgress(!!checked)}
              />
              <label
                htmlFor="save-progress"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Save my progress for later
              </label>
            </div>

            {saveProgress && (
              <div className="text-xs text-slate-600 pl-6">
                Your progress will be saved for 24 hours and can be recovered when you return.
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Continue Planning
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isLoading ? "Saving..." : hasProgress && saveProgress ? "Save & Exit" : "Exit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}