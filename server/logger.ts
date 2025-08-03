import winston from 'winston';
import { Request, Response } from 'express';

/**
 * Structured logging system for RouteWise backend
 * Replaces console.log with secure, structured logging
 */

// Define log levels with custom colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, userId, operation, duration, ...meta } = info;
    
    let logMessage = `${timestamp} [${level}]`;
    
    if (service) logMessage += ` [${service}]`;
    if (operation) logMessage += ` [${operation}]`;
    if (userId) logMessage += ` [user:${userId}]`;
    
    logMessage += `: ${message}`;
    
    if (duration) logMessage += ` (${duration}ms)`;
    
    // Add metadata if present (excluding sensitive fields)
    const metaKeys = Object.keys(meta).filter(key => 
      !['password', 'token', 'secret', 'key', 'authorization'].includes(key.toLowerCase())
    );
    
    if (metaKeys.length > 0) {
      const sanitizedMeta: any = {};
      metaKeys.forEach(key => {
        sanitizedMeta[key] = meta[key];
      });
      logMessage += ` ${JSON.stringify(sanitizedMeta)}`;
    }
    
    return logMessage;
  })
);

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: logFormat,
  defaultMeta: { service: 'routewise-backend' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    
    // File transports for production
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
  ],
});

// Create logs directory if it doesn't exist
import { existsSync, mkdirSync } from 'fs';
if (!existsSync('logs')) {
  mkdirSync('logs');
}

/**
 * Enhanced logging interface with context-aware methods
 */
export class Logger {
  private static instance: Logger;
  private winston: winston.Logger;

  private constructor() {
    this.winston = logger;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log an informational message
   */
  info(message: string, meta?: any) {
    this.winston.info(message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: any) {
    this.winston.warn(message, meta);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | any, meta?: any) {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
    };
    this.winston.error(message, errorMeta);
  }

  /**
   * Log HTTP requests
   */
  http(message: string, meta?: any) {
    this.winston.http(message, meta);
  }

  /**
   * Log debug information
   */
  debug(message: string, meta?: any) {
    this.winston.debug(message, meta);
  }

  /**
   * Log authentication events
   */
  auth(operation: string, userId?: number, success: boolean = true, meta?: any) {
    const level = success ? 'info' : 'warn';
    this.winston[level](`Authentication ${operation}`, {
      operation: 'auth',
      userId,
      success,
      ...meta,
    });
  }

  /**
   * Log API operations
   */
  api(operation: string, userId?: number, duration?: number, meta?: any) {
    this.winston.info(`API operation: ${operation}`, {
      operation: 'api',
      userId,
      duration,
      ...meta,
    });
  }

  /**
   * Log database operations
   */
  database(operation: string, table?: string, duration?: number, meta?: any) {
    this.winston.debug(`Database ${operation}`, {
      operation: 'database',
      table,
      duration,
      ...meta,
    });
  }

  /**
   * Log cache operations
   */
  cache(operation: string, key: string, hit: boolean = true, duration?: number, meta?: any) {
    this.winston.debug(`Cache ${operation}`, {
      operation: 'cache',
      key,
      hit,
      duration,
      ...meta,
    });
  }

  /**
   * Log external API calls
   */
  external(service: string, operation: string, duration?: number, success: boolean = true, meta?: any) {
    const level = success ? 'info' : 'warn';
    this.winston[level](`External API: ${service} ${operation}`, {
      operation: 'external',
      service,
      duration,
      success,
      ...meta,
    });
  }

  /**
   * Log security events
   */
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any) {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this.winston[level](`Security event: ${event}`, {
      operation: 'security',
      severity,
      ...meta,
    });
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, unit: string = 'ms', meta?: any) {
    this.winston.info(`Performance: ${metric}`, {
      operation: 'performance',
      metric,
      value,
      unit,
      ...meta,
    });
  }
}

// Export singleton instance
export const log = Logger.getInstance();

/**
 * Express middleware for request logging
 */
export function requestLogger() {
  return (req: Request, res: Response, next: Function) => {
    const startTime = Date.now();
    const originalUrl = req.originalUrl || req.url;
    const method = req.method;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = (req as any).user?.id;

    // Override res.json to capture response data (without sensitive info)
    const originalJson = res.json;
    let responseBody: any;
    
    res.json = function(data: any) {
      responseBody = sanitizeResponseForLogging(data);
      return originalJson.call(this, data);
    };

    // Log when response finishes
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const level = statusCode >= 400 ? 'warn' : 'info';

      log.winston[level](`${method} ${originalUrl}`, {
        operation: 'http',
        method,
        url: originalUrl,
        statusCode,
        duration,
        ip,
        userAgent,
        userId,
        responseSize: res.get('content-length'),
        ...(responseBody && { response: responseBody }),
      });
    });

    next();
  };
}

/**
 * Error logging middleware
 */
export function errorLogger() {
  return (error: any, req: Request, res: Response, next: Function) => {
    const userId = (req as any).user?.id;
    
    log.error('Unhandled route error', error, {
      operation: 'error',
      method: req.method,
      url: req.originalUrl,
      userId,
      ip: req.ip,
      body: sanitizeRequestForLogging(req.body),
      query: req.query,
    });

    next(error);
  };
}

/**
 * Sanitize request data for logging (remove sensitive fields)
 */
function sanitizeRequestForLogging(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize response data for logging (remove sensitive fields)
 */
function sanitizeResponseForLogging(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  // Don't log large response bodies
  if (JSON.stringify(data).length > 1000) {
    return { size: 'large', type: typeof data };
  }
  
  return sanitizeRequestForLogging(data);
}

/**
 * Replace console methods with structured logging
 */
export function replaceConsole() {
  // Override console methods to use structured logging
  const originalConsole = { ...console };
  
  console.log = (message: any, ...args: any[]) => {
    log.info(typeof message === 'string' ? message : JSON.stringify(message), 
      args.length > 0 ? { args } : undefined);
  };
  
  console.warn = (message: any, ...args: any[]) => {
    log.warn(typeof message === 'string' ? message : JSON.stringify(message), 
      args.length > 0 ? { args } : undefined);
  };
  
  console.error = (message: any, ...args: any[]) => {
    log.error(typeof message === 'string' ? message : JSON.stringify(message), 
      undefined, args.length > 0 ? { args } : undefined);
  };
  
  console.debug = (message: any, ...args: any[]) => {
    log.debug(typeof message === 'string' ? message : JSON.stringify(message), 
      args.length > 0 ? { args } : undefined);
  };
  
  // Keep original console methods available if needed
  (console as any).originalLog = originalConsole.log;
  (console as any).originalWarn = originalConsole.warn;
  (console as any).originalError = originalConsole.error;
  (console as any).originalDebug = originalConsole.debug;
}

// Initialize structured logging
if (process.env.NODE_ENV !== 'test') {
  replaceConsole();
  log.info('Structured logging initialized', { 
    logLevel: process.env.LOG_LEVEL || 'info',
    environment: process.env.NODE_ENV || 'development'
  });
}