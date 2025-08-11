import React from "react";
import { cn } from "@/lib/utils";
import { OptionCardProps } from "@/types/trip-wizard";
import { Car, Plane, Bus, Bike, Hotel, Home, Tent, Users, HelpCircle } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  car: Car,
  plane: Plane,
  bus: Bus,
  bike: Bike,
  hotel: Hotel,
  home: Home,
  tent: Tent,
  users: Users,
  'help-circle': HelpCircle,
  combo: () => <div className="flex items-center space-x-1"><Car className="w-6 h-6" /><Plane className="w-6 h-6" /></div>
};

export function OptionCard({
  title,
  description,
  icon,
  selected,
  onClick,
  disabled = false,
  className,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full p-4 rounded-lg border-2 transition-all duration-200 min-h-[120px]",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg",
        "hover:shadow-md transform hover:-translate-y-1",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-surface hover:border-border",
        disabled && "opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none",
        className
      )}
      aria-pressed={selected}
      aria-describedby={description ? `${title}-description` : undefined}
    >
      
      {/* Content */}
      <div className="flex flex-col items-center text-center space-y-2">
        {/* Icon */}
        {icon && (
          <div className="text-2xl mb-1">
            {typeof icon === 'string' ? (
              // Check if it's an icon identifier we can map to Lucide
              iconMap[icon] ? (
                React.createElement(iconMap[icon], { className: 'w-8 h-8' })
              ) : (
                // Fallback to emoji/string
                <span role="img" aria-hidden="true">{icon}</span>
              )
            ) : (
              icon
            )}
          </div>
        )}
        
        {/* Title */}
        <h3 className={cn(
          "font-semibold text-sm",
          selected ? "text-primary" : "text-fg"
        )}>
          {title}
        </h3>
        
        {/* Description */}
        {description && (
          <p 
            id={`${title}-description`}
            className="text-xs text-muted-fg leading-relaxed"
          >
            {description}
          </p>
        )}
      </div>
    </button>
  );
}