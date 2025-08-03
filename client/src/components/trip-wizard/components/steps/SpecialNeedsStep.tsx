import { Heart, Baby, Accessibility } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AccessibleFormField } from "../shared/AccessibleFormField";
import { ValidationMessage } from "../shared/ValidationMessage";
import { SpecialNeedsData, AccessibilityNeeds } from "@/types/trip-wizard";

interface SpecialNeedsStepProps {
  specialNeeds: SpecialNeedsData;
  accessibility: AccessibilityNeeds;
  onSpecialNeedsChange: (value: SpecialNeedsData) => void;
  onAccessibilityChange: (value: AccessibilityNeeds) => void;
  errors?: {
    specialNeeds?: string;
    accessibility?: string;
  };
}

export function SpecialNeedsStep({
  specialNeeds,
  accessibility,
  onSpecialNeedsChange,
  onAccessibilityChange,
  errors,
}: SpecialNeedsStepProps) {
  const updateSpecialNeeds = (field: keyof SpecialNeedsData, value: any) => {
    onSpecialNeedsChange({
      ...specialNeeds,
      [field]: value,
    });
  };

  const updateAccessibility = (field: keyof AccessibilityNeeds, value: any) => {
    onAccessibilityChange({
      ...accessibility,
      [field]: value,
    });
  };

  const hasAnySpecialNeeds = specialNeeds.pets || specialNeeds.accessibility || specialNeeds.kids;
  const hasAnyAccessibilityNeeds = accessibility.screenReader || accessibility.motorImpairment || 
                                   accessibility.visualImpairment || accessibility.cognitiveSupport;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-slate-600">
          Help us personalize your trip by letting us know about any special requirements or preferences.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          All fields are optional - only fill out what applies to you.
        </p>
      </div>

      {/* Travel companions and special needs */}
      <div className="space-y-6">
        <h4 className="font-medium text-slate-800 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-red-500" />
          Travel Companions & Special Considerations
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pets */}
          <div className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg">
            <Checkbox
              id="pets"
              checked={specialNeeds.pets}
              onCheckedChange={(checked) => updateSpecialNeeds('pets', !!checked)}
            />
            <div className="flex-1">
              <label htmlFor="pets" className="text-sm font-medium cursor-pointer">
                🐕 Traveling with pets
              </label>
              <p className="text-xs text-slate-600 mt-1">
                We'll find pet-friendly accommodations and attractions
              </p>
            </div>
          </div>

          {/* Kids */}
          <div className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg">
            <Checkbox
              id="kids"
              checked={specialNeeds.kids}
              onCheckedChange={(checked) => updateSpecialNeeds('kids', !!checked)}
            />
            <div className="flex-1">
              <label htmlFor="kids" className="text-sm font-medium cursor-pointer">
                <Baby className="w-4 h-4 inline mr-1" />
                Traveling with children
              </label>
              <p className="text-xs text-slate-600 mt-1">
                We'll suggest family-friendly activities and facilities
              </p>
            </div>
          </div>

          {/* General accessibility */}
          <div className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg">
            <Checkbox
              id="accessibility-general"
              checked={specialNeeds.accessibility}
              onCheckedChange={(checked) => updateSpecialNeeds('accessibility', !!checked)}
            />
            <div className="flex-1">
              <label htmlFor="accessibility-general" className="text-sm font-medium cursor-pointer">
                <Accessibility className="w-4 h-4 inline mr-1" />
                Accessibility needs
              </label>
              <p className="text-xs text-slate-600 mt-1">
                We'll prioritize accessible venues and routes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed accessibility options */}
      {specialNeeds.accessibility && (
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900">
            Specific Accessibility Requirements
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="screen-reader"
                checked={accessibility.screenReader}
                onCheckedChange={(checked) => updateAccessibility('screenReader', !!checked)}
              />
              <label htmlFor="screen-reader" className="text-sm cursor-pointer">
                Screen reader support
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="motor-impairment"
                checked={accessibility.motorImpairment}
                onCheckedChange={(checked) => updateAccessibility('motorImpairment', !!checked)}
              />
              <label htmlFor="motor-impairment" className="text-sm cursor-pointer">
                Mobility assistance needed
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="visual-impairment"
                checked={accessibility.visualImpairment}
                onCheckedChange={(checked) => updateAccessibility('visualImpairment', !!checked)}
              />
              <label htmlFor="visual-impairment" className="text-sm cursor-pointer">
                Visual assistance needed
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cognitive-support"
                checked={accessibility.cognitiveSupport}
                onCheckedChange={(checked) => updateAccessibility('cognitiveSupport', !!checked)}
              />
              <label htmlFor="cognitive-support" className="text-sm cursor-pointer">
                Cognitive support needed
              </label>
            </div>
          </div>
          
          <AccessibleFormField
            label="Other accessibility needs"
            description="Describe any other specific accessibility requirements"
          >
            <Textarea
              value={accessibility.other}
              onChange={(e) => updateAccessibility('other', e.target.value)}
              placeholder="E.g., wheelchair accessible venues, sign language interpretation..."
              className="resize-none"
              rows={2}
            />
          </AccessibleFormField>
        </div>
      )}

      {/* Additional notes */}
      <div className="space-y-4">
        <AccessibleFormField
          label="Additional Notes"
          description="Any other special requirements or preferences for your trip?"
        >
          <Textarea
            value={specialNeeds.notes}
            onChange={(e) => updateSpecialNeeds('notes', e.target.value)}
            placeholder="E.g., dietary restrictions, medical considerations, group size, special occasions..."
            className="resize-none"
            rows={4}
          />
        </AccessibleFormField>
      </div>

      {/* Summary of selections */}
      {(hasAnySpecialNeeds || hasAnyAccessibilityNeeds || specialNeeds.notes || accessibility.other) && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">
            We'll keep these requirements in mind:
          </h4>
          <ul className="text-sm text-green-800 space-y-1">
            {specialNeeds.pets && <li>• Pet-friendly accommodations and activities</li>}
            {specialNeeds.kids && <li>• Family-friendly venues and attractions</li>}
            {specialNeeds.accessibility && <li>• Accessible routes and facilities</li>}
            {accessibility.screenReader && <li>• Screen reader compatible information</li>}
            {accessibility.motorImpairment && <li>• Mobility accessible venues</li>}
            {accessibility.visualImpairment && <li>• Visual assistance accommodations</li>}
            {accessibility.cognitiveSupport && <li>• Clear, simple navigation and information</li>}
            {(specialNeeds.notes || accessibility.other) && <li>• Your specific notes and requirements</li>}
          </ul>
        </div>
      )}

      <ValidationMessage error={errors?.specialNeeds || errors?.accessibility} />
    </div>
  );
}