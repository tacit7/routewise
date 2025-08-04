import React from 'react';
import { Sun, CloudSun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

interface TimeOfDayTagProps {
  timeOfDay: TimeOfDay;
  variant?: 'default' | 'compact';
  className?: string;
}

// Color mapping for accessibility and consistency
const timeOfDayConfig = {
  morning: {
    colors: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Sun,
    label: 'Morning',
    ariaLabel: 'Planned for morning',
  },
  afternoon: {
    colors: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CloudSun,
    label: 'Afternoon', 
    ariaLabel: 'Planned for afternoon',
  },
  evening: {
    colors: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Moon,
    label: 'Evening',
    ariaLabel: 'Planned for evening',
  },
};

export function TimeOfDayTag({ 
  timeOfDay, 
  variant = 'default', 
  className 
}: TimeOfDayTagProps) {
  const config = timeOfDayConfig[timeOfDay];
  const Icon = config.icon;
  const isCompact = variant === 'compact';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border rounded-full font-medium transition-colors',
        config.colors,
        isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
      aria-label={config.ariaLabel}
      role="img"
    >
      <Icon 
        className={cn(
          'flex-shrink-0',
          isCompact ? 'h-3 w-3' : 'h-4 w-4'
        )} 
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
}

// Dropdown component for selecting time of day
interface TimeOfDaySelectProps {
  value?: TimeOfDay;
  onChange: (timeOfDay: TimeOfDay) => void;
  placeholder?: string;
  className?: string;
}

export function TimeOfDaySelect({ 
  value, 
  onChange, 
  placeholder = 'Select time',
  className 
}: TimeOfDaySelectProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value as TimeOfDay)}
      className={cn(
        'text-xs border border-gray-200 rounded px-2 py-1 bg-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        className
      )}
      aria-label="Select time of day for this place"
    >
      <option value="">{placeholder}</option>
      <option value="morning">Morning</option>
      <option value="afternoon">Afternoon</option>
      <option value="evening">Evening</option>
    </select>
  );
}

export default TimeOfDayTag;