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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Benefits section */}
      {value && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            {TRIP_TYPE_OPTIONS.find(opt => opt.value === value)?.title} Benefits:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {TRIP_TYPE_OPTIONS.find(opt => opt.value === value)?.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 flex-shrink-0"></span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ValidationMessage error={error} />
    </div>
  );
}