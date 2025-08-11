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
  tripMode?: 'route' | 'explore';
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
  tripMode = 'route',
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
      <div className="flex items-center gap-3 sm:flex-row flex-col sm:gap-4">
        <div className="flex items-center gap-3 flex-1">
          <label
            htmlFor="flexible-dates"
            className="text-sm font-medium cursor-pointer text-foreground select-none"
          >
            I'm flexible with my dates
          </label>
          <Switch
            id="flexible-dates"
            checked={flexibleDates}
            onCheckedChange={handleFlexibleChange}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
          />
        </div>
      </div>

      {/* Helpful text about providing dates */}
      <div className="text-center py-4 px-6 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-sm text-slate-600">
          💡 <strong>Pro tip:</strong> {tripMode === 'explore' 
            ? "Dates are completely optional for exploration! You can plan for future trips or get recommendations for places you're visiting right now."
            : "If you give us your dates, we can provide more detailed information about your trip and help you find better deals on accommodations and activities."
          }
        </p>
      </div>

      {/* Date selection - always show but disabled when flexible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start date */}
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal transition-all duration-200",
                  !startDate && "text-muted-foreground",
                  flexibleDates && "opacity-40 cursor-not-allowed bg-muted/30",
                  !flexibleDates && "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                )}
                disabled={flexibleDates}
                aria-label={startDate ? `Start date: ${format(startDate, "PPP")}` : "Select start date"}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : (tripMode === 'explore' ? "Select start date (optional)" : "Select start date")}
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
                  "w-full justify-start text-left font-normal transition-all duration-200",
                  !endDate && "text-muted-foreground",
                  (flexibleDates || (tripMode === 'route' && !startDate)) && "opacity-40 cursor-not-allowed bg-muted/30",
                  !flexibleDates && (tripMode === 'explore' || startDate) && "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                )}
                disabled={flexibleDates || (tripMode === 'route' && !startDate)}
                aria-label={endDate ? `End date: ${format(endDate, "PPP")}` : "Select end date"}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : (tripMode === 'explore' ? "Select end date (optional)" : "Select end date")}
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
        <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg py-3 px-4">
          Your trip will be <span className="font-medium text-foreground">{duration} {duration === 1 ? 'day' : 'days'}</span> long
          {duration >= 7 && (
            <span>
              {' '}(<span className="font-medium text-foreground">{Math.floor(duration / 7)} {Math.floor(duration / 7) === 1 ? 'week' : 'weeks'}</span>
              {duration % 7 > 0 ? ` and ${duration % 7} ${duration % 7 === 1 ? 'day' : 'days'}` : ''})
            </span>
          )}
        </div>
      )}

    </div>
  );
}