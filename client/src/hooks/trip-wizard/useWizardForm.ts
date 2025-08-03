import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { TripWizardData } from "@/types/trip-wizard";
import { tripWizardSchema, stepValidations } from "@/lib/trip-wizard/validation-schemas";
import { getInitialWizardData } from "@/lib/trip-wizard/wizard-utils";

interface UseWizardFormProps {
  initialData?: Partial<TripWizardData>;
  onDataChange?: (data: TripWizardData) => void;
}

export const useWizardForm = ({ initialData, onDataChange }: UseWizardFormProps = {}) => {
  const defaultValues = useMemo(() => ({
    ...getInitialWizardData(),
    ...initialData,
  }), [initialData]);

  const form = useForm<TripWizardData>({
    resolver: zodResolver(tripWizardSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Watch all form data to trigger onChange
  const watchedData = form.watch();
  
  // Trigger callback when data changes
  useMemo(() => {
    if (onDataChange) {
      onDataChange(watchedData);
    }
  }, [watchedData, onDataChange]);

  const validateStep = async (stepNumber: number): Promise<boolean> => {
    const stepSchema = stepValidations[stepNumber as keyof typeof stepValidations];
    if (!stepSchema) return true;

    try {
      const currentData = form.getValues();
      await stepSchema.parseAsync(currentData);
      return true;
    } catch (error) {
      // Set form errors based on validation results
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as any;
        zodError.issues.forEach((issue: any) => {
          const path = issue.path.join('.');
          form.setError(path as any, {
            type: 'validation',
            message: issue.message,
          });
        });
      }
      return false;
    }
  };

  const clearStepErrors = (stepNumber: number) => {
    const stepSchema = stepValidations[stepNumber as keyof typeof stepValidations];
    if (!stepSchema) return;

    // Get the fields that belong to this step
    const stepFields = Object.keys(stepSchema.shape || {});
    stepFields.forEach(field => {
      form.clearErrors(field as keyof TripWizardData);
    });
  };

  const getStepData = (stepNumber: number) => {
    const currentData = form.getValues();
    
    switch (stepNumber) {
      case 1:
        return { tripType: currentData.tripType };
      case 2:
        return {
          startLocation: currentData.startLocation,
          endLocation: currentData.endLocation,
          stops: currentData.stops,
        };
      case 3:
        return {
          startDate: currentData.startDate,
          endDate: currentData.endDate,
          flexibleDates: currentData.flexibleDates,
        };
      case 4:
        return { transportation: currentData.transportation };
      case 5:
        return {
          lodging: currentData.lodging,
          budgetRange: currentData.budgetRange,
        };
      case 6:
        return { intentions: currentData.intentions };
      case 7:
        return {
          specialNeeds: currentData.specialNeeds,
          accessibility: currentData.accessibility,
        };
      default:
        return {};
    }
  };

  const updateStepData = (stepNumber: number, stepData: Partial<TripWizardData>) => {
    Object.entries(stepData).forEach(([key, value]) => {
      form.setValue(key as keyof TripWizardData, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    });
  };

  const resetForm = (newData?: Partial<TripWizardData>) => {
    const resetData = {
      ...getInitialWizardData(),
      ...newData,
    };
    form.reset(resetData);
  };

  return {
    form,
    validateStep,
    clearStepErrors,
    getStepData,
    updateStepData,
    resetForm,
    formData: watchedData,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
  };
};