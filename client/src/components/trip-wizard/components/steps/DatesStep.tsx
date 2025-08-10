import { useState, useEffect } from "react";
import { Calendar, Info } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

  // Clear end date if it's before the start date (using useEffect to avoid render-time updates)
  useEffect(() => {
    if (startDate && endDate && startDate instanceof Date && endDate instanceof Date && endDate <= startDate) {
      onEndDateChange(null);
    }
  }, [startDate, endDate, onEndDateChange]);

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
  
  const minEndDate = startDate instanceof Date ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) : minDate;

  const calculateDuration = () => {
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) return null;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const duration = calculateDuration();

  return (
    <div className="space-y-6">
      {/* Flexible dates toggle */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="flexible-dates"
          className="text-sm font-medium cursor-pointer text-slate-700"
        >
          I'm flexible with my dates
        </label>
        <Switch
          id="flexible-dates"
          checked={flexibleDates}
          onCheckedChange={handleFlexibleChange}
        />
      </div>

      {/* Date selection - always show but disabled when flexible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start date */}
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground",
                  flexibleDates && "opacity-50 cursor-not-allowed"
                )}
                disabled={flexibleDates}
                aria-label={startDate ? `Start date: ${format(startDate, "PPP")}` : "Select start date"}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Select start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate || undefined}
                onSelect={(date) => {
                  onStartDateChange(date || null);
                  setStartDateOpen(false);
                }}
                disabled={(date) => date < minDate}
                initialFocus
                className="bg-white"
              />
            </PopoverContent>
          </Popover>

          {/* End date */}
          <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground",
                  flexibleDates && "opacity-50 cursor-not-allowed"
                )}
                disabled={flexibleDates || !startDate}
                aria-label={endDate ? `End date: ${format(endDate, "PPP")}` : "Select end date"}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Select end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate || undefined}
                onSelect={(date) => {
                  onEndDateChange(date || null);
                  setEndDateOpen(false);
                }}
                disabled={(date) => date < minEndDate}
                initialFocus
                className="bg-white"
              />
            </PopoverContent>
          </Popover>
      </div>

      {/* Trip duration info - only show when dates are selected */}
      {!flexibleDates && startDate && endDate && duration && (
        <div className="text-center text-sm text-slate-600">
          Your trip will be {duration} {duration === 1 ? 'day' : 'days'} long
          {duration >= 7 && (
            <span>
              {' '}({Math.floor(duration / 7)} {Math.floor(duration / 7) === 1 ? 'week' : 'weeks'}
              {duration % 7 > 0 ? ` and ${duration % 7} ${duration % 7 === 1 ? 'day' : 'days'}` : ''})
            </span>
          )}
        </div>
      )}

    </div>
  );
}