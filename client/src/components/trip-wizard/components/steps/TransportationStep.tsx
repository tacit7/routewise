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

      {/* Selection summary */}
      {value.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Selected Transportation:
          </h4>
          <div className="flex flex-wrap gap-2">
            {value.map((transportOption) => {
              const option = TRANSPORTATION_OPTIONS.find(opt => opt.value === transportOption);
              return option ? (
                <span
                  key={transportOption}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.title}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Helpful tips based on selection */}
      {value.length > 0 && (
        <div className="mt-4 space-y-3">
          {value.includes('flights') && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>Flying tip:</strong> Book flights early for better prices, and consider flying mid-week for savings.
              </p>
            </div>
          )}
          
          {(value.includes('my-car') || value.includes('rental-car')) && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                🚗 <strong>Road trip tip:</strong> We'll help you find scenic routes, gas stations, and rest stops along the way.
              </p>
            </div>
          )}
          
          {value.includes('public-transport') && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                🚌 <strong>Public transport tip:</strong> Consider getting local transit passes for savings in cities.
              </p>
            </div>
          )}
        </div>
      )}

      <ValidationMessage error={error} />
    </div>
  );
}