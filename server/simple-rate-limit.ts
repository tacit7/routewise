import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: any;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter without IPv6 validation issues
 */
export function createRateLimiter(options: RateLimitOptions) {
  const requests = new Map<string, RequestRecord>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate key for this request
    const key = options.keyGenerator ? options.keyGenerator(req) : req.ip || 'unknown';
    
    const now = Date.now();
    
    // Clean up expired entries
    for (const [k, v] of requests.entries()) {
      if (now > v.resetTime) {
        requests.delete(k);
      }
    }
    
    // Check current request
    const current = requests.get(key);
    
    if (!current) {
      requests.set(key, { count: 1, resetTime: now + options.windowMs });
      next();
      return;
    }
    
    if (current.count >= options.max) {
      const resetInSeconds = Math.ceil((current.resetTime - now) / 1000);
      const message = options.message || {
        message: `Too many requests, please try again in ${resetInSeconds} seconds.`
      };
      
      res.status(429).json(message);
      return;
    }
    
    // Increment count
    current.count++;
    
    // For skipSuccessfulRequests, decrement on successful response
    if (options.skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode < 400) {
          current.count--;
        }
        return originalSend.call(this, data);
      };
    }
    
    next();
  };
}

/**
 * General API rate limiter
 */
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  }
});

/**
 * Rate limiter for places API endpoints
 */
export const placesRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Too many location requests from this IP, please try again later',
    code: 'PLACES_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  }
});

/**
 * User-based rate limiter for authenticated users
 */
export const userBasedRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : `ip:${req.ip || 'unknown'}`;
  },
  message: {
    success: false,
    message: 'Too many requests from this account, please try again later',
    code: 'USER_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  }
});

/**
 * Development rate limiter (very lenient)
 */
export const developmentRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 10000,
  message: {
    success: false,
    message: 'Development rate limit exceeded',
    code: 'DEV_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  }
});

/**
 * Get appropriate rate limiter based on environment
 */
export function getRateLimiter(type: 'general' | 'auth' | 'places' | 'user' = 'general') {
  if (process.env.NODE_ENV === 'development') {
    return developmentRateLimit;
  }
  
  switch (type) {
    case 'auth':
      return authRateLimit;
    case 'places':
      return placesRateLimit;
    case 'user':
      return userBasedRateLimit;
    default:
      return generalRateLimit;
  }
}