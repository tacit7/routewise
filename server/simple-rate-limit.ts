import { Request, Response, NextFunction } from 'express';
import { getRedisService } from './redis-service';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: any;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  useRedis?: boolean;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

/**
 * Rate limiter with Redis support and in-memory fallback
 */
export function createRateLimiter(options: RateLimitOptions) {
  const requests = new Map<string, RequestRecord>();
  const useRedis = options.useRedis !== false; // Default to true
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Generate key for this request
    const baseKey = options.keyGenerator ? options.keyGenerator(req) : req.ip || 'unknown';
    const key = `rate_limit:${baseKey}`;
    
    const now = Date.now();
    const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
    const windowKey = `${key}:${windowStart}`;
    
    try {
      if (useRedis) {
        // Try Redis-based rate limiting
        const redisService = getRedisService();
        const stats = redisService.getStats();
        
        if (stats.isRedisConnected) {
          const count = await redisService.incr(windowKey);
          
          // Set expiration only for the first request in this window
          if (count === 1) {
            await redisService.expire(windowKey, Math.ceil(options.windowMs / 1000));
          }
          
          if (count > options.max) {
            const resetInSeconds = Math.ceil(options.windowMs / 1000);
            const message = options.message || {
              message: `Too many requests, please try again in ${resetInSeconds} seconds.`
            };
            
            res.status(429).json(message);
            return;
          }
          
          // Handle skipSuccessfulRequests with Redis
          if (options.skipSuccessfulRequests) {
            const originalSend = res.send;
            res.send = function(data) {
              if (res.statusCode < 400) {
                // Decrement counter asynchronously
                redisService.incr(windowKey).then(newCount => {
                  if (newCount > 0) {
                    redisService.set(windowKey, newCount - 1, Math.ceil(options.windowMs / 1000));
                  }
                }).catch(() => {
                  // Ignore decrement errors
                });
              }
              return originalSend.call(this, data);
            };
          }
          
          next();
          return;
        }
      }
    } catch (error) {
      // Fall through to memory-based rate limiting
    }
    
    // Memory-based rate limiting (fallback)
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