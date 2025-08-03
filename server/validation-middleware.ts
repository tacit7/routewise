import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Enhanced validation middleware with comprehensive input sanitization
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      
      // Parse and validate the data
      const validatedData = schema.parse(data);
      
      // Replace the original data with validated/sanitized data
      (req as any)[source] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationError.details,
          code: 'VALIDATION_ERROR'
        });
      }
      
      // Handle other errors
      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Common validation schemas for reuse across endpoints
 */
export const commonSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(Number)
  }),
  
  // Pagination validation
  pagination: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('20').transform(Number).refine(n => n <= 100, 'Limit cannot exceed 100'),
    offset: z.string().optional().transform(n => n ? Number(n) : undefined)
  }),
  
  // Location validation
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  
  // Search validation
  search: z.object({
    q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
    limit: z.string().optional().default('20').transform(Number)
  }),
  
  // City name validation (for POI and route endpoints)
  cityName: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(100, 'City name too long')
    .regex(/^[a-zA-Z\s\-',.]+$/, 'City name contains invalid characters'),
};

/**
 * POI-specific validation schemas
 */
export const poiSchemas = {
  poisQuery: z.object({
    start: commonSchemas.cityName.optional(),
    end: commonSchemas.cityName.optional(),
    checkpoint: commonSchemas.cityName.optional()
  }).refine(
    data => data.start || data.end || data.checkpoint,
    'At least one location parameter is required'
  ),
  
  createPoi: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().min(1, 'Description is required').max(1000),
    category: z.enum(['restaurant', 'attraction', 'park', 'scenic', 'historic', 'market', 'outdoor', 'cultural', 'shopping', 'nightlife']),
    rating: z.string().regex(/^\d+(\.\d)?$/, 'Rating must be a decimal number'),
    reviewCount: z.number().int().min(0),
    timeFromStart: z.string().max(50),
    imageUrl: z.string().url('Must be a valid URL'),
    placeId: z.string().optional(),
    address: z.string().max(500).optional(),
    priceLevel: z.number().int().min(1).max(4).optional(),
    isOpen: z.boolean().optional()
  })
};

/**
 * User and authentication validation schemas
 */
export const authSchemas = {
  register: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username too long')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    email: z.string().email('Must be a valid email').optional()
  }),
  
  login: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required')
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one lowercase letter, one uppercase letter, and one number')
  })
};

/**
 * Trip validation schemas
 */
export const tripSchemas = {
  createTrip: z.object({
    title: z.string().min(1, 'Title is required').max(200).optional(),
    startCity: commonSchemas.cityName,
    endCity: commonSchemas.cityName,
    checkpoints: z.array(commonSchemas.cityName).max(10, 'Too many checkpoints').optional().default([]),
    routeData: z.object({
      distance: z.string(),
      duration: z.string(),
      coordinates: z.array(commonSchemas.coordinates)
    }).optional(),
    poisData: z.array(z.object({
      id: z.number(),
      selected: z.boolean()
    })).optional().default([]),
    isPublic: z.boolean().optional().default(false)
  }),
  
  updateTrip: z.object({
    title: z.string().min(1).max(200).optional(),
    checkpoints: z.array(commonSchemas.cityName).max(10).optional(),
    routeData: z.any().optional(),
    poisData: z.array(z.any()).optional(),
    isPublic: z.boolean().optional()
  }),
  
  routeCalculation: z.object({
    startLocation: commonSchemas.cityName,
    endLocation: commonSchemas.cityName,
    stops: z.array(commonSchemas.cityName).max(10).optional().default([])
  })
};

/**
 * Places autocomplete validation
 */
export const placesSchemas = {
  autocomplete: z.object({
    input: z.string()
      .min(2, 'Input must be at least 2 characters')
      .max(100, 'Input too long'),
    types: z.string().optional()
  })
};

/**
 * Rate limiting configuration per endpoint type
 */
export const rateLimitConfig = {
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
  },
  
  places: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per minute for places API
    message: {
      success: false,
      message: 'Too many location requests, please try again later',
      code: 'PLACES_RATE_LIMIT_EXCEEDED'
    }
  },
  
  trips: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 trip operations per 15 minutes
    message: {
      success: false,
      message: 'Too many trip operations, please try again later',
      code: 'TRIPS_RATE_LIMIT_EXCEEDED'
    }
  }
};

/**
 * Sanitize input by removing potentially dangerous characters
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS characters and normalize whitespace
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Security headers middleware
 */
export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Remove server signature
    res.removeHeader('X-Powered-By');
    
    next();
  };
}