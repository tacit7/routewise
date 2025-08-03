import React, { useId } from "react";
import { Label } from "@/components/ui/label";
import { FormFieldProps } from "@/types/trip-wizard";
import { ValidationMessage } from "./ValidationMessage";

export function AccessibleFormField({
  label,
  children,
  error,
  description,
  required = false,
}: FormFieldProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;
  
  return (
    <div className="space-y-2">
      <Label 
        htmlFor={fieldId}
        className="text-sm font-medium text-slate-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </Label>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-sm text-slate-600"
        >
          {description}
        </p>
      )}
      
      {React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': [
          description && descriptionId,
          error && errorId
        ].filter(Boolean).join(' ') || undefined,
        'aria-invalid': !!error,
        'aria-required': required
      })}
      
      <ValidationMessage error={error} />
    </div>
  );
}