// dev-api-cache.ts
// Enhanced cache for API responses, enabled in development
// Uses Redis when available, falls back to in-memory cache
// Provides intelligent caching when MSW is disabled
import type { Request, Response, NextFunction } from "express";
import { cacheService } from "./cache-service";

interface CacheEntry {
  data: any;
  timestamp: number;
  url: string;
  method: string;
}

// Different cache durations for different types of endpoints
const CACHE_DURATIONS: Record<string, number> = {
  '/api/health': 30 * 1000,           // 30 seconds - health checks change frequently
  '/api/maps-key': 10 * 60 * 1000,    // 10 minutes - API keys rarely change
  '/api/places/autocomplete': 5 * 60 * 1000,  // 5 minutes - city data is stable
  '/api/pois': 5 * 60 * 1000,         // 5 minutes - POI data is now cached at service level too
  '/api/route': 10 * 60 * 1000,       // 10 minutes - route data with POIs
};

const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes default
const cache: Record<string, CacheEntry> = {};

function makeCacheKey(req: Request): string {
  // Key by method + url + query + body (for POST)
  let key = req.method + req.originalUrl;
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    key += JSON.stringify(req.body);
  }
  return key;
}

function getCacheDuration(path: string): number {
  // Find the most specific cache duration
  for (const [pattern, duration] of Object.entries(CACHE_DURATIONS)) {
    if (path.startsWith(pattern)) {
      return duration;
    }
  }
  return DEFAULT_CACHE_DURATION;
}

function logCacheOperation(operation: 'HIT' | 'MISS' | 'SET', key: string, path: string) {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = operation === 'HIT' ? '🎯' : operation === 'MISS' ? '🔍' : '💾';
  console.log(`${timestamp} [cache] ${emoji} ${operation} ${path}`);
}

export function devApiCacheMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only enable caching in development
  if (process.env.NODE_ENV !== "development") return next();
  
  // Only cache API requests
  if (!req.path.startsWith("/api")) return next();
  
  const key = makeCacheKey(req);
  const cacheDuration = getCacheDuration(req.path);

  // Try async cache check
  cacheService.get(key).then(cachedResult => {
    if (cachedResult) {
      logCacheOperation('HIT', key, req.path);
      return res.json(cachedResult);
    }

    // Cache miss - check fallback memory cache
    const now = Date.now();
    const entry = cache[key];

    if (entry && now - entry.timestamp < cacheDuration) {
      logCacheOperation('HIT', key, req.path);
      return res.json(entry.data);
    } else if (entry) {
      // Cache entry exists but is expired
      delete cache[key];
    }

    logCacheOperation('MISS', key, req.path);

    // Monkey-patch res.json to capture response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Cache in both Redis and memory
        cacheService.set(key, body, { ttl: cacheDuration }).catch(err => {
          console.error('Cache set error:', err.message);
        });

        cache[key] = { 
          data: body, 
          timestamp: Date.now(),
          url: req.originalUrl,
          method: req.method
        };
        logCacheOperation('SET', key, req.path);
      }
      return originalJson(body);
    };

    next();
  }).catch(err => {
    console.error('Cache get error:', err.message);
    // Fall back to memory cache
    const now = Date.now();
    const entry = cache[key];

    if (entry && now - entry.timestamp < cacheDuration) {
      logCacheOperation('HIT', key, req.path);
      return res.json(entry.data);
    }

    next();
  });
}

// Utility function to clear cache (useful for testing)
export async function clearCache() {
  const count = Object.keys(cache).length;
  
  // Clear Redis cache
  try {
    await cacheService.clear();
  } catch (error) {
    console.error('Error clearing Redis cache:', error.message);
  }
  
  // Clear memory cache
  Object.keys(cache).forEach(key => delete cache[key]);
  console.log(`🗑️  [cache] Cleared ${count} dev cache entries`);
}

// Utility function to show cache stats
export function getCacheStats() {
  const entries = Object.values(cache);
  const now = Date.now();
  
  const stats = {
    totalEntries: entries.length,
    validEntries: entries.filter(entry => {
      const cacheDuration = getCacheDuration(new URL(entry.url, 'http://localhost').pathname);
      return now - entry.timestamp < cacheDuration;
    }).length,
    expiredEntries: entries.filter(entry => {
      const cacheDuration = getCacheDuration(new URL(entry.url, 'http://localhost').pathname);
      return now - entry.timestamp >= cacheDuration;
    }).length,
    endpoints: Array.from(new Set(entries.map(entry => new URL(entry.url, 'http://localhost').pathname)))
  };
  
  return stats;
}
