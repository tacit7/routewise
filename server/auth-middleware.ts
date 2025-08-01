import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth-service';
import type { User } from '@shared/schema';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export class AuthMiddleware {
  /**
   * Middleware to authenticate requests using JWT tokens
   * Looks for token in Authorization header (Bearer token) or cookies
   */
  static async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let token: string | null = null;

      // Check Authorization header first
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      // Fallback to cookie if no Authorization header
      if (!token && req.cookies?.auth_token) {
        token = req.cookies.auth_token;
      }

      if (!token) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      // Verify token and get user
      const user = await authService.getUserFromToken(token);
      if (!user) {
        res.status(401).json({ 
          success: false, 
          message: 'Invalid or expired token' 
        });
        return;
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Authentication error' 
      });
      return;
    }
  }

  /**
   * Optional authentication middleware - doesn't fail if no token provided
   * Useful for endpoints that work with or without authentication
   */
  static async optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let token: string | null = null;

      // Check Authorization header first
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      // Fallback to cookie if no Authorization header
      if (!token && req.cookies?.auth_token) {
        token = req.cookies.auth_token;
      }

      if (token) {
        // Try to get user, but don't fail if token is invalid
        const user = await authService.getUserFromToken(token);
        if (user) {
          req.user = user;
        }
      }

      next();
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Continue without authentication
      next();
    }
  }

  /**
   * Rate limiting middleware for auth endpoints
   */
  static rateLimit() {
    const attempts = new Map<string, { count: number; resetTime: number }>();
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const MAX_ATTEMPTS = 5; // 5 attempts per window

    return (req: Request, res: Response, next: NextFunction) => {
      const clientId = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      
      // Clean up expired entries
      for (const [key, value] of attempts.entries()) {
        if (now > value.resetTime) {
          attempts.delete(key);
        }
      }

      // Check current attempts
      const current = attempts.get(clientId);
      if (!current) {
        attempts.set(clientId, { count: 1, resetTime: now + WINDOW_MS });
        next();
        return;
      }

      if (current.count >= MAX_ATTEMPTS) {
        const resetInMinutes = Math.ceil((current.resetTime - now) / 1000 / 60);
        res.status(429).json({
          success: false,
          message: `Too many authentication attempts. Try again in ${resetInMinutes} minutes.`
        });
        return;
      }

      // Increment attempt count
      current.count++;
      next();
    };
  }

  /**
   * Input validation middleware for auth endpoints
   */
  static validateAuthInput(req: Request, res: Response, next: NextFunction): void {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Username is required'
      });
      return;
    }

    if (!password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Password is required'
      });
      return;
    }

    // Sanitize username
    req.body.username = username.trim();

    next();
  }

  /**
   * Security headers middleware
   */
  static securityHeaders(req: Request, res: Response, next: NextFunction): void {
    // Prevent XSS attacks
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // HTTPS redirect in production
    if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  }
}
