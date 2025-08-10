import { Controller } from "react-hook-form";
import { TripType } from "@/types/trip-wizard";
import { OptionCard } from "../shared/OptionCard";
import { ValidationMessage } from "../shared/ValidationMessage";
import { TRIP_TYPE_OPTIONS } from "@/lib/trip-wizard/wizard-utils";

interface TripTypeStepProps {
  value: TripType;
  onChange: (value: TripType) => void;
  error?: string;
}

export function TripTypeStep({ value, onChange, error }: TripTypeStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRIP_TYPE_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            title={option.title}
            description={option.description}
            icon={option.icon}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
            className="h-full"
          />
        ))}
      </div>


      <ValidationMessage error={error} />
    </div>
  );
}