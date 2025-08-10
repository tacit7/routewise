import { TransportationOption } from "@/types/trip-wizard";
import { OptionCard } from "../shared/OptionCard";
import { ValidationMessage } from "../shared/ValidationMessage";
import { TRANSPORTATION_OPTIONS } from "@/lib/trip-wizard/wizard-utils";

interface TransportationStepProps {
  value: TransportationOption[];
  onChange: (value: TransportationOption[]) => void;
  error?: string;
}

export function TransportationStep({ value, onChange, error }: TransportationStepProps) {
  const handleToggle = (option: TransportationOption) => {
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-slate-600">
          Select all transportation methods you'd like to use during your trip
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRANSPORTATION_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            title={option.title}
            description={option.description}
            icon={option.icon}
            selected={value.includes(option.value)}
            onClick={() => handleToggle(option.value)}
            className="h-full"
          />
        ))}
      </div>


      <ValidationMessage error={error} />
    </div>
  );
}