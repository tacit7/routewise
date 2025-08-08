import React from "react";
import { Clock } from "lucide-react";

interface TimeSchedulerProps {
  scheduledTime?: string;
  onTimeChange: (newTime: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function TimeScheduler({ 
  scheduledTime, 
  onTimeChange, 
  size = "md",
  className = ""
}: TimeSchedulerProps) {
  const sizeClasses = {
    sm: "text-xs h-3 w-3 mr-1",
    md: "text-sm h-3 w-3 mr-2", 
    lg: "text-base h-4 w-4 mr-2"
  };

  const pillClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <div 
      className={`time-pill inline-flex items-center ${pillClasses[size]} ${className}`}
    >
      <Clock 
        className={`${sizeClasses[size]} inline`} 
        style={{ color: 'var(--text-muted)' }} 
      />
      <input
        type="time"
        value={scheduledTime || '09:00'}
        onChange={(e) => onTimeChange(e.target.value)}
        className="bg-transparent border-none outline-none focus:outline-none"
        style={{ color: 'var(--text)' }}
      />
    </div>
  );
}