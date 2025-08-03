import { z } from 'zod';
import { log } from './logger';

/**
 * Environment validation schema with strict requirements for production
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server configuration
  PORT: z.string().default('3001').transform(Number),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // JWT Authentication
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .refine(val => {
      if (process.env.NODE_ENV === 'production' && val === 'route-wise-dev-secret-key') {
        throw new Error('Development JWT_SECRET cannot be used in production');
      }
      return true;
    }, 'Development JWT_SECRET detected in production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Google Services (optional but recommended)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Cache configuration
  GOOGLE_PLACES_CACHE_DURATION: z.string().default('5').transform(Number),
  GOOGLE_GEOCODING_CACHE_DURATION: z.string().default('10').transform(Number),
  
  // Redis configuration (optional)
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),
  CACHE_DEFAULT_TTL: z.string().default('300000').transform(Number),
  CACHE_KEY_PREFIX: z.string().default('routewise:'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  
  // TripAdvisor API (optional)
  TRIPADVISOR_API_KEY: z.string().optional(),
  
  // Development flags
  MSW_DISABLED: z.string().optional().transform(val => val === 'true'),
}).refine(data => {
  // Google OAuth validation - all or none
  const googleOAuthFields = [data.GOOGLE_CLIENT_ID, data.GOOGLE_CLIENT_SECRET, data.GOOGLE_REDIRECT_URI];
  const providedFields = googleOAuthFields.filter(Boolean).length;
  
  if (providedFields > 0 && providedFields < 3) {
    throw new Error('Google OAuth requires all three: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI');
  }
  
  return true;
}, 'Invalid Google OAuth configuration').refine(data => {
  // Redis validation - if Redis URL is provided, other Redis configs are optional
  if (data.REDIS_URL && (data.REDIS_HOST || data.REDIS_PORT)) {
    log.warn('Both REDIS_URL and individual Redis configs provided. REDIS_URL will take precedence.');
  }
  
  return true;
}, 'Redis configuration conflict');

/**
 * Production-specific validation
 */
const productionEnvSchema = z.object({
  ...envSchema.shape,
  DATABASE_URL: z.string()
    .url('DATABASE_URL must be a valid URL')
    .refine(url => !url.includes('localhost'), 'Production should not use localhost database'),
  
  JWT_SECRET: z.string()
    .min(64, 'Production JWT_SECRET should be at least 64 characters')
    .refine(val => val !== 'route-wise-dev-secret-key', 'Cannot use development JWT_SECRET in production'),
  
  GOOGLE_PLACES_API_KEY: z.string()
    .min(1, 'GOOGLE_PLACES_API_KEY is required in production'),
  
  GOOGLE_MAPS_API_KEY: z.string()
    .min(1, 'GOOGLE_MAPS_API_KEY is required in production'),
});

/**
 * Development-specific validation (more lenient)
 */
const developmentEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server configuration
  PORT: z.string().default('3001').transform(Number),
  
  // Database (optional in development)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').optional(),
  
  // JWT Authentication (more lenient in development)
  JWT_SECRET: z.string().min(32).default('route-wise-dev-secret-key'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Google Services (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Cache configuration
  GOOGLE_PLACES_CACHE_DURATION: z.string().default('5').transform(Number),
  GOOGLE_GEOCODING_CACHE_DURATION: z.string().default('10').transform(Number),
  
  // Redis configuration (optional)
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),
  CACHE_DEFAULT_TTL: z.string().default('300000').transform(Number),
  CACHE_KEY_PREFIX: z.string().default('routewise:'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  
  // TripAdvisor API (optional)
  TRIPADVISOR_API_KEY: z.string().optional(),
  
  // Development flags
  MSW_DISABLED: z.string().optional().transform(val => val === 'true'),
});

/**
 * Validate environment variables with appropriate schema
 */
export function validateEnvironment(): z.infer<typeof envSchema> {
  const isProduction = process.env.NODE_ENV === 'production';
  const schema = isProduction ? productionEnvSchema : developmentEnvSchema;
  
  try {
    const env = schema.parse(process.env);
    
    log.info('Environment validation successful', {
      nodeEnv: env.NODE_ENV,
      hasDatabase: !!env.DATABASE_URL,
      hasGoogleOAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      hasGoogleMaps: !!env.GOOGLE_MAPS_API_KEY,
      hasRedis: !!(env.REDIS_URL || env.REDIS_HOST),
      logLevel: env.LOG_LEVEL
    });
    
    return env;
  } catch (error) {
    log.error('Environment validation failed', error);
    
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join('\n');
      
      throw new Error(`Environment validation failed:\n${issues}`);
    }
    
    throw error;
  }
}

/**
 * Check for common environment issues and provide helpful warnings
 */
export function checkEnvironmentHealth(env: z.infer<typeof envSchema>): void {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Check for missing optional but recommended configurations
  if (!env.GOOGLE_PLACES_API_KEY) {
    warnings.push('GOOGLE_PLACES_API_KEY not configured - POI features will use fallback data');
    recommendations.push('Configure Google Places API key for better POI data');
  }
  
  if (!env.GOOGLE_MAPS_API_KEY) {
    warnings.push('GOOGLE_MAPS_API_KEY not configured - maps features will be limited');
    recommendations.push('Configure Google Maps API key for full map functionality');
  }
  
  if (!env.REDIS_URL && !env.REDIS_HOST) {
    warnings.push('Redis not configured - using in-memory cache (not recommended for production)');
    if (env.NODE_ENV === 'production') {
      recommendations.push('Configure Redis for production caching');
    }
  }
  
  if (!env.GOOGLE_CLIENT_ID) {
    warnings.push('Google OAuth not configured - only local authentication available');
    recommendations.push('Configure Google OAuth for social login');
  }
  
  // Check for security concerns
  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET.length < 64) {
      warnings.push('JWT_SECRET is shorter than recommended 64 characters for production');
      recommendations.push('Use a longer, cryptographically secure JWT_SECRET');
    }
    
    if (env.DATABASE_URL.includes('localhost')) {
      warnings.push('Database URL points to localhost in production');
      recommendations.push('Use a remote database service for production');
    }
  }
  
  // Log warnings and recommendations
  if (warnings.length > 0) {
    log.warn('Environment configuration warnings detected', { 
      warnings,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    });
  }
  
  if (recommendations.length > 0) {
    log.info('Environment configuration recommendations', { recommendations });
  }
}

/**
 * Get environment configuration summary for debugging
 */
export function getEnvironmentSummary(env: z.infer<typeof envSchema>) {
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    database: {
      configured: !!env.DATABASE_URL,
      type: env.DATABASE_URL ? (env.DATABASE_URL.startsWith('postgresql') ? 'postgresql' : 'other') : 'none'
    },
    authentication: {
      jwtConfigured: !!env.JWT_SECRET,
      googleOAuthConfigured: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
    },
    googleServices: {
      placesApiConfigured: !!env.GOOGLE_PLACES_API_KEY,
      mapsApiConfigured: !!env.GOOGLE_MAPS_API_KEY
    },
    caching: {
      redisConfigured: !!(env.REDIS_URL || env.REDIS_HOST),
      placesCacheDuration: env.GOOGLE_PLACES_CACHE_DURATION,
      geocodingCacheDuration: env.GOOGLE_GEOCODING_CACHE_DURATION
    },
    logging: {
      level: env.LOG_LEVEL
    }
  };
}

/**
 * Initialize and validate environment - to be called at startup
 */
export function initializeEnvironment() {
  log.info('Validating environment configuration...');
  
  const env = validateEnvironment();
  checkEnvironmentHealth(env);
  
  const summary = getEnvironmentSummary(env);
  log.info('Environment initialized successfully', summary);
  
  return env;
}

// Export types
export type ValidatedEnv = z.infer<typeof envSchema>;