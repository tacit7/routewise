import { useState } from "react";
import { Clock, MapPin, Calendar, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TripWizardDraft } from "@/types/trip-wizard";
import { getDraftAge } from "@/lib/trip-wizard/storage";

interface DraftRecoveryModalProps {
  isOpen: boolean;
  draft: TripWizardDraft | null;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export function DraftRecoveryModal({
  isOpen,
  draft,
  onAccept,
  onReject,
  onCancel,
}: DraftRecoveryModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!draft) return null;

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      onAccept();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      onReject();
    } finally {
      setIsLoading(false);
    }
  };

  const age = getDraftAge(draft);
  const { data, currentStep, completedSteps } = draft;
  
  const hasLocations = !!(data.startLocation && data.endLocation);
  const hasDates = !!(data.startDate && data.endDate) || data.flexibleDates;
  const hasPreferences = data.transportation.length > 0 || data.lodging.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Continue Your Trip?</span>
          </DialogTitle>
          <DialogDescription>
            We found a saved trip draft from {age}. Would you like to continue where you left off?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">
              Progress: Step {currentStep} of 7
            </span>
            <Badge variant="secondary">
              {completedSteps.length} steps completed
            </Badge>
          </div>

          {/* Trip details */}
          <div className="space-y-3">
            {hasLocations && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium">Route:</span>
                  <div className="text-slate-600">
                    {data.startLocation?.main_text} → {data.endLocation?.main_text}
                  </div>
                </div>
              </div>
            )}

            {hasDates && (
              <div className="flex items-start space-x-3">
                <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium">Dates:</span>
                  <div className="text-slate-600">
                    {data.flexibleDates ? (
                      "Flexible dates"
                    ) : data.startDate && data.endDate ? (
                      `${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`
                    ) : (
                      "Not set"
                    )}
                  </div>
                </div>
              </div>
            )}

            {hasPreferences && (
              <div className="flex items-start space-x-3">
                <Users className="w-4 h-4 text-slate-500 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium">Preferences:</span>
                  <div className="text-slate-600">
                    {data.transportation.length > 0 && (
                      <div>Transportation: {data.transportation.join(", ")}</div>
                    )}
                    {data.lodging.length > 0 && (
                      <div>Lodging: {data.lodging.join(", ")}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {data.intentions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.intentions.slice(0, 3).map((intention) => (
                  <Badge key={intention} variant="outline" className="text-xs">
                    {intention}
                  </Badge>
                ))}
                {data.intentions.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.intentions.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Warning for old drafts */}
          {age.includes('day') && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                This draft is from {age}. Some information might be outdated.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Start Fresh
          </Button>
          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? "Loading..." : "Continue Trip"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}