import { z } from "zod";

const placeSuggestionSchema = z.object({
  place_id: z.string(),
  description: z.string(),
  main_text: z.string(),
  secondary_text: z.string(),
});

const budgetRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
}).refine(data => data.max > data.min, {
  message: "Maximum budget must be greater than minimum",
  path: ["max"],
});

const specialNeedsSchema = z.object({
  pets: z.boolean(),
  accessibility: z.boolean(),
  kids: z.boolean(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters"),
});

const accessibilityNeedsSchema = z.object({
  screenReader: z.boolean(),
  motorImpairment: z.boolean(),
  visualImpairment: z.boolean(),
  cognitiveSupport: z.boolean(),
  other: z.string().max(200, "Other accessibility needs cannot exceed 200 characters"),
});

// Step 1: Trip Type
export const tripTypeSchema = z.object({
  tripType: z.enum(['road-trip', 'flight-based', 'combo'], {
    required_error: "Please select a trip type",
  }),
});

// Step 2: Locations
export const locationSchema = z.object({
  startLocation: placeSuggestionSchema.nullable(),
  endLocation: placeSuggestionSchema.nullable(),
  stops: z.array(placeSuggestionSchema).max(5, "Maximum 5 stops allowed"),
  flexibleLocations: z.boolean(),
}).refine(data => {
  // Always require at least a starting location
  return data.startLocation !== null;
}, {
  message: "Please select at least a starting location",
  path: ["startLocation"],
}).refine(data => {
  // If not flexible, require both start and end locations
  if (!data.flexibleLocations) {
    return data.startLocation && data.endLocation;
  }
  return true;
}, {
  message: "Please select a destination or mark as flexible",
  path: ["endLocation"],
}).refine(data => {
  if (!data.startLocation || !data.endLocation) return true;
  return data.startLocation.place_id !== data.endLocation.place_id;
}, {
  message: "Start and destination locations must be different",
  path: ["endLocation"],
});

// Step 3: Dates
export const datesSchema = z.object({
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  flexibleDates: z.boolean(),
}).refine(data => {
  if (data.flexibleDates) return true;
  return data.startDate && data.endDate;
}, {
  message: "Please select dates or mark as flexible",
  path: ["startDate"],
}).refine(data => {
  if (data.flexibleDates || !data.startDate || !data.endDate) return true;
  return data.endDate >= data.startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine(data => {
  if (data.flexibleDates || !data.startDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return data.startDate >= today;
}, {
  message: "Start date cannot be in the past",
  path: ["startDate"],
});

// Step 4: Transportation
export const transportationSchema = z.object({
  transportation: z.array(z.enum(['my-car', 'rental-car', 'flights', 'public-transport', 'other']))
    .min(1, "Please select at least one transportation method"),
});

// Step 5: Lodging and Budget
export const lodgingSchema = z.object({
  lodging: z.array(z.enum(['hotels', 'airbnb', 'campgrounds', 'free-camping', 'friends']))
    .min(1, "Please select at least one lodging option"),
  budgetRange: z.enum(['budget', 'mid-range', 'luxury', 'no-limit']),
});

// Step 6: Intentions
export const intentionsSchema = z.object({
  intentions: z.array(z.string())
    .min(1, "Please select at least one trip intention")
    .max(8, "Maximum 8 intentions allowed"),
});

// Step 7: Special Needs
export const specialNeedsStepSchema = z.object({
  specialNeeds: specialNeedsSchema,
  accessibility: accessibilityNeedsSchema,
});

// Complete wizard schema - define directly to avoid merge issues
export const tripWizardSchema = z.object({
  // Step 1: Trip Type
  tripType: z.enum(['road-trip', 'flight-based', 'combo'], {
    required_error: "Please select a trip type",
  }),
  
  // Step 2: Locations
  startLocation: placeSuggestionSchema.nullable(),
  endLocation: placeSuggestionSchema.nullable(),
  stops: z.array(placeSuggestionSchema),
  flexibleLocations: z.boolean(),
  
  // Step 3: Dates
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  flexibleDates: z.boolean(),
  
  // Step 4: Transportation
  transportation: z.array(z.enum(['my-car', 'rental-car', 'flights', 'public-transport', 'other'])),
  
  // Step 5: Lodging & Budget
  lodging: z.array(z.enum(['hotels', 'airbnb', 'campgrounds', 'free-camping', 'friends'])),
  budgetRange: z.enum(['budget', 'mid-range', 'luxury', 'no-limit']),
  
  // Step 6: Intentions
  intentions: z.array(z.string()),
  
  // Step 7: Special Needs
  specialNeeds: z.string(),
  accessibility: z.object({
    mobilityAssistance: z.boolean(),
    wheelchairAccess: z.boolean(),
    hearingAssistance: z.boolean(),
    visualAssistance: z.boolean(),
    other: z.string(),
  }),
});

// Step validation map
export const stepValidations = {
  1: tripTypeSchema,
  2: locationSchema,
  3: datesSchema,
  4: transportationSchema,
  5: lodgingSchema,
  6: intentionsSchema,
  7: specialNeedsStepSchema,
};

export type TripWizardFormData = z.infer<typeof tripWizardSchema>;