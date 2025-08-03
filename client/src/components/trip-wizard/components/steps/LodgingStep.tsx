import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { LodgingOption, BudgetRange } from "@/types/trip-wizard";
import { OptionCard } from "../shared/OptionCard";
import { ValidationMessage } from "../shared/ValidationMessage";
import { AccessibleFormField } from "../shared/AccessibleFormField";
import { LODGING_OPTIONS } from "@/lib/trip-wizard/wizard-utils";

interface LodgingStepProps {
  lodging: LodgingOption[];
  budgetRange: BudgetRange;
  onLodgingChange: (value: LodgingOption[]) => void;
  onBudgetRangeChange: (value: BudgetRange) => void;
  error?: string;
}

export function LodgingStep({ 
  lodging, 
  budgetRange, 
  onLodgingChange, 
  onBudgetRangeChange, 
  error 
}: LodgingStepProps) {
  const [sliderValue, setSliderValue] = useState([budgetRange.min, budgetRange.max]);

  const handleToggleLodging = (option: LodgingOption) => {
    const newValue = lodging.includes(option)
      ? lodging.filter(v => v !== option)
      : [...lodging, option];
    onLodgingChange(newValue);
  };

  const handleBudgetChange = (value: number[]) => {
    setSliderValue(value);
    onBudgetRangeChange({ min: value[0], max: value[1] });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBudgetCategory = (min: number, max: number) => {
    const avg = (min + max) / 2;
    if (avg < 75) return { category: "Budget", color: "green" };
    if (avg < 150) return { category: "Mid-range", color: "blue" };
    if (avg < 300) return { category: "Premium", color: "purple" };
    return { category: "Luxury", color: "gold" };
  };

  const budgetCategory = getBudgetCategory(budgetRange.min, budgetRange.max);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-slate-600">
          Select your preferred accommodation types and budget range per night
        </p>
      </div>

      {/* Lodging options */}
      <div>
        <h4 className="font-medium text-slate-800 mb-4">Accommodation Types</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LODGING_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              title={option.title}
              description={option.description}
              icon={option.icon}
              selected={lodging.includes(option.value)}
              onClick={() => handleToggleLodging(option.value)}
              className="h-full"
            />
          ))}
        </div>
      </div>

      {/* Budget range */}
      <div>
        <AccessibleFormField
          label="Budget Range per Night"
          description="Set your accommodation budget range"
        >
          <div className="space-y-4">
            <div className="px-4">
              <Slider
                value={sliderValue}
                onValueChange={handleBudgetChange}
                max={500}
                min={25}
                step={25}
                className="w-full"
                aria-label="Budget range slider"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <span className="font-medium">{formatCurrency(budgetRange.min)}</span>
                <span className="text-slate-500">min</span>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${budgetCategory.color}-100 text-${budgetCategory.color}-800`}>
                {budgetCategory.category}
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-slate-500">max</span>
                <span className="font-medium">{formatCurrency(budgetRange.max)}</span>
                <DollarSign className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>
        </AccessibleFormField>
      </div>

      {/* Selection summary */}
      {lodging.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <h4 className="font-medium text-blue-900 mb-2">
            Your Accommodation Preferences:
          </h4>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 justify-center">
              {lodging.map((lodgingOption) => {
                const option = LODGING_OPTIONS.find(opt => opt.value === lodgingOption);
                return option ? (
                  <span
                    key={lodgingOption}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.title}
                  </span>
                ) : null;
              })}
            </div>
            <div className="text-sm text-blue-800">
              Budget: {formatCurrency(budgetRange.min)} - {formatCurrency(budgetRange.max)} per night ({budgetCategory.category})
            </div>
          </div>
        </div>
      )}

      {/* Budget tips */}
      <div className="space-y-3">
        {budgetRange.max <= 100 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              💰 <strong>Budget tip:</strong> Consider hostels, camping, or staying outside city centers for great savings.
            </p>
          </div>
        )}
        
        {budgetRange.min >= 200 && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800">
              ✨ <strong>Premium tip:</strong> Look for hotels with loyalty programs and consider booking directly for perks.
            </p>
          </div>
        )}
        
        {lodging.includes('campgrounds') || lodging.includes('free-camping') && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-800">
              🏕️ <strong>Camping tip:</strong> We'll help you find campgrounds with amenities and free camping spots along your route.
            </p>
          </div>
        )}
      </div>

      <ValidationMessage error={error} />
    </div>
  );
}