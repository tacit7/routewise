import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { storage } from './storage';

/**
 * Generic validation middleware factory
 */
export function validateSchema<T>(schema: ZodSchema<T>, source: 'body' | 'params' | 'query' = 'body') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
      const validatedData = schema.parse(data);
      
      // Attach validated data back to request
      if (source === 'body') {
        req.body = validatedData;
      } else if (source === 'params') {
        req.params = validatedData as any;
      } else {
        req.query = validatedData as any;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        res.status(400).json({
          message: 'Validation error',
          errors: errorMessages
        });
        return;
      }
      
      console.error('Validation middleware error:', error);
      res.status(500).json({ message: 'Internal validation error' });
      return;
    }
  };
}

/**
 * Middleware to check if user owns the resource being accessed
 */
export function checkUserOwnership(req: Request, res: Response, next: NextFunction): void {
  try {
    const requestingUserId = (req as any).user?.id;
    const resourceUserId = parseInt(req.params.id);
    
    if (!requestingUserId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    if (isNaN(resourceUserId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }
    
    if (requestingUserId !== resourceUserId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    
    next();
  } catch (error) {
    console.error('User ownership check error:', error);
    res.status(500).json({ message: 'Authorization error' });
    return;
  }
}

/**
 * Middleware to check if interest categories exist
 */
export function validateInterestCategories() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { interests } = req.body;
      
      if (!Array.isArray(interests)) {
        next();
        return;
      }
      
      // Get all valid category IDs
      const allCategories = await storage.getAllInterestCategories();
      const validCategoryIds = new Set(allCategories.map(cat => cat.id));
      
      // Check if all provided category IDs exist
      const invalidCategoryIds = interests
        .map(interest => interest.categoryId)
        .filter(id => !validCategoryIds.has(id));
      
      if (invalidCategoryIds.length > 0) {
        res.status(400).json({
          message: 'Invalid interest categories',
          invalidIds: invalidCategoryIds
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Interest categories validation error:', error);
      res.status(500).json({ message: 'Validation error' });
      return;
    }
  };
}

/**
 * Error handling middleware for interests routes
 */
export function handleInterestsError(
  error: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  console.error('Interests API error:', error);
  
  // Handle specific error types
  if (error.message.includes('not found')) {
    res.status(404).json({ message: error.message });
    return;
  }
  
  if (error.message.includes('duplicate') || error.message.includes('unique')) {
    res.status(409).json({ message: 'Duplicate entry' });
    return;
  }
  
  if (error.message.includes('foreign key') || error.message.includes('reference')) {
    res.status(400).json({ message: 'Invalid reference' });
    return;
  }
  
  // Default server error
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
}

/**
 * Rate limiting for suggested trips endpoint
 */
export function rateLimitSuggestedTrips() {
  const userRequests = new Map<number, { count: number; resetTime: number }>();
  const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  const MAX_REQUESTS = 10; // 10 requests per 5 minutes per user

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      next();
      return;
    }
    
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, value] of userRequests.entries()) {
      if (now > value.resetTime) {
        userRequests.delete(key);
      }
    }
    
    // Check current requests
    const current = userRequests.get(userId);
    if (!current) {
      userRequests.set(userId, { count: 1, resetTime: now + WINDOW_MS });
      next();
      return;
    }
    
    if (current.count >= MAX_REQUESTS) {
      const resetInMinutes = Math.ceil((current.resetTime - now) / 1000 / 60);
      res.status(429).json({
        message: `Too many requests. Try again in ${resetInMinutes} minutes.`
      });
      return;
    }
    
    // Increment request count
    current.count++;
    next();
  };
}