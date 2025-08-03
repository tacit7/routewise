import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Enhanced rate limiting middleware with Redis store support
 */

/**
 * Create rate limiter with Redis support
 */
function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: any;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: options.keyGenerator || ((req: Request) => {
      // Use IP address as default key, but allow for user-based limiting
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : req.ip || 'unknown';
    }),
    handler: (req: Request, res: Response) => {
      res.status(429).json(options.message);
    },
    // TODO: Add Redis store for production
    // store: new RedisStore({
    //   sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    // }),
  });
}

/**
 * General API rate limiter
 */
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60 // seconds
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 authentication attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  }
});

/**
 * Rate limiter for location/places API endpoints
 */
export const placesRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 location requests per minute
  message: {
    success: false,
    message: 'Too many location requests from this IP, please try again later',
    code: 'PLACES_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  }
});

/**
 * Rate limiter for trip management endpoints
 */
export const tripsRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 trip operations per 15 minutes
  message: {
    success: false,
    message: 'Too many trip operations from this IP, please try again later',
    code: 'TRIPS_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  }
});

/**
 * Rate limiter for POI endpoints
 */
export const poisRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 POI requests per 5 minutes
  message: {
    success: false,
    message: 'Too many POI requests from this IP, please try again later',
    code: 'POIS_RATE_LIMIT_EXCEEDED',
    retryAfter: 5 * 60
  }
});

/**
 * Strict rate limiter for resource-intensive operations
 */
export const heavyOperationsRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 heavy operations per hour
  message: {
    success: false,
    message: 'Too many resource-intensive requests from this IP, please try again later',
    code: 'HEAVY_OPERATIONS_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  }
});

/**
 * User-based rate limiter for authenticated users
 */
export const userBasedRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Authenticated users get higher limits
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many requests from this account, please try again later',
    code: 'USER_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  }
});

/**
 * Development rate limiter (more lenient for development)
 */
export const developmentRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Very high limit for development
  message: {
    success: false,
    message: 'Development rate limit exceeded',
    code: 'DEV_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  }
});

/**
 * Get appropriate rate limiter based on environment and endpoint type
 */
export function getRateLimiter(type: 'general' | 'auth' | 'places' | 'trips' | 'pois' | 'heavy' | 'user') {
  // Use more lenient limits in development
  if (process.env.NODE_ENV === 'development') {
    return developmentRateLimit;
  }
  
  switch (type) {
    case 'auth':
      return authRateLimit;
    case 'places':
      return placesRateLimit;
    case 'trips':
      return tripsRateLimit;
    case 'pois':
      return poisRateLimit;
    case 'heavy':
      return heavyOperationsRateLimit;
    case 'user':
      return userBasedRateLimit;
    default:
      return generalRateLimit;
  }
}

/**
 * Middleware to log rate limit hits for monitoring
 */
export function logRateLimit(req: Request, res: Response, next: Function) {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Log rate limit hits
    if (res.statusCode === 429) {
      console.warn(`🚨 Rate limit hit: ${req.method} ${req.path} from ${req.ip || 'unknown'}`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}