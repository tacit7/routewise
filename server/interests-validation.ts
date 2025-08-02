import { z } from "zod";

// User interests update validation schema
export const updateUserInterestsSchema = z.object({
  interests: z.array(z.object({
    categoryId: z.number().min(1, "Category ID must be a positive integer"),
    isEnabled: z.boolean(),
    priority: z.number().min(1).max(5).optional().default(1)
  })).optional(),
  enableAll: z.boolean().optional()
}).refine(
  (data) => {
    // Either interests array OR enableAll must be provided, but not both
    return (Array.isArray(data.interests) && data.interests.length > 0) || data.enableAll === true;
  },
  {
    message: "Either 'interests' array or 'enableAll: true' must be provided"
  }
);

// Interest categories validation
export const createInterestCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  displayName: z.string().min(1, "Display name is required").max(100, "Display name too long"),
  description: z.string().max(500, "Description too long").optional(),
  iconName: z.string().max(50, "Icon name too long").optional(),
  isActive: z.boolean().optional().default(true)
});

// Suggested trips query validation - keep as string since query params are strings
export const suggestedTripsQuerySchema = z.object({
  limit: z.string()
    .optional()
    .default("5")
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 20;
    }, "Limit must be between 1 and 20")
});

// User ID parameter validation - keep as string since middleware expects string params
export const userIdParamSchema = z.object({
  id: z.string().min(1).regex(/^\d+$/, "Must be a valid number")
});

// Trip ID parameter validation
export const tripIdParamSchema = z.object({
  id: z.string().min(1, "Trip ID is required").max(100, "Trip ID too long")
});

export type UpdateUserInterestsInput = z.infer<typeof updateUserInterestsSchema>;
export type CreateInterestCategoryInput = z.infer<typeof createInterestCategorySchema>;
export type SuggestedTripsQuery = z.infer<typeof suggestedTripsQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type TripIdParam = z.infer<typeof tripIdParamSchema>;