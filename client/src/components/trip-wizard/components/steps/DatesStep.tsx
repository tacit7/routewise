import { useState } from "react";
import { Calendar, Info } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AccessibleFormField } from "../shared/AccessibleFormField";
import { ValidationMessage } from "../shared/ValidationMessage";
import { cn } from "@/lib/utils";

interface DatesStepProps {
  startDate: Date | null;
  endDate: Date | null;
  flexibleDates: boolean;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onFlexibleDatesChange: (flexible: boolean) => void;
  errors?: {
    startDate?: string;
    endDate?: string;
  };
}

export function DatesStep({
  startDate,
  endDate,
  flexibleDates,
  onStartDateChange,
  onEndDateChange,
  onFlexibleDatesChange,
  errors,
}: DatesStepProps) {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleFlexibleChange = (checked: boolean) => {
    onFlexibleDatesChange(checked);
    if (checked) {
      // Clear specific dates when flexible is enabled
      onStartDateChange(null);
      onEndDateChange(null);
    }
  };

  const today = new Date();
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);
  
  const minEndDate = startDate ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) : minDate;

  const calculateDuration = () => {
    if (!startDate || !endDate) return null;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const duration = calculateDuration();

  return (
    <div className="space-y-6">
      {/* Flexible dates option */}
      <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Checkbox
          id="flexible-dates"
          checked={flexibleDates}
          onCheckedChange={handleFlexibleChange}
          className="mt-0.5"
        />
        <div className="flex-1">
          <label
            htmlFor="flexible-dates"
            className="text-sm font-medium text-blue-900 cursor-pointer"
          >
            I'm flexible with my dates
          </label>
          <p className="text-sm text-blue-800 mt-1">
            Get better recommendations and deals by being flexible with your travel dates
          </p>
        </div>
      </div>

      {/* Date selection (hidden when flexible) */}
      {!flexibleDates && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start date */}
          <AccessibleFormField
            label="Start Date"
            description="When do you want to begin your trip?"
            error={errors?.startDate}
            required={!flexibleDates}
          >
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                  aria-label={startDate ? `Start date: ${format(startDate, "PPP")}` : "Select start date"}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate || undefined}
                  onSelect={(date) => {
                    onStartDateChange(date || null);
                    setStartDateOpen(false);
                    // Clear end date if it's before the new start date
                    if (date && endDate && endDate <= date) {
                      onEndDateChange(null);
                    }
                  }}
                  disabled={(date) => date < minDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </AccessibleFormField>

          {/* End date */}
          <AccessibleFormField
            label="End Date"
            description="When will your trip end?"
            error={errors?.endDate}
            required={!flexibleDates}
          >
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                  disabled={!startDate}
                  aria-label={endDate ? `End date: ${format(endDate, "PPP")}` : "Select end date"}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate || undefined}
                  onSelect={(date) => {
                    onEndDateChange(date || null);
                    setEndDateOpen(false);
                  }}
                  disabled={(date) => date < minEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </AccessibleFormField>
        </div>
      )}

      {/* Trip duration info */}
      {!flexibleDates && startDate && endDate && duration && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="flex items-center justify-center space-x-2">
            <Info className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-900">Trip Duration</span>
          </div>
          <p className="text-green-800 mt-1">
            Your trip will be {duration} {duration === 1 ? 'day' : 'days'} long
            {duration >= 7 && (
              <span className="text-green-700">
                {' '}({Math.floor(duration / 7)} {Math.floor(duration / 7) === 1 ? 'week' : 'weeks'}
                {duration % 7 > 0 ? ` and ${duration % 7} ${duration % 7 === 1 ? 'day' : 'days'}` : ''})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Flexible dates info */}
      {flexibleDates && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-900">Flexible Planning Mode</span>
          </div>
          <p className="text-amber-800 mt-1">
            We'll help you find the best times to travel based on weather, crowds, and pricing. 
            You can set specific dates later when you're ready to book.
          </p>
        </div>
      )}

      <ValidationMessage 
        error={errors?.startDate || errors?.endDate} 
      />
    </div>
  );
}