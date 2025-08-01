// dev-api-cache.ts
// Enhanced in-memory cache for API responses, enabled in development
// Provides intelligent caching when MSW is disabled
import type { Request, Response, NextFunction } from "express";

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
  '/api/pois': 2 * 60 * 1000,         // 2 minutes - POI data can be updated
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
  
  // Check if MSW is disabled (when caching is most useful)
  const isMswDisabled = process.env.MSW_DISABLED === 'true';
  
  const key = makeCacheKey(req);
  const now = Date.now();
  const entry = cache[key];
  const cacheDuration = getCacheDuration(req.path);

  // Check for cache hit
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
}

// Utility function to clear cache (useful for testing)
export function clearCache() {
  const count = Object.keys(cache).length;
  Object.keys(cache).forEach(key => delete cache[key]);
  console.log(`🗑️  [cache] Cleared ${count} cache entries`);
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
    endpoints: [...new Set(entries.map(entry => new URL(entry.url, 'http://localhost').pathname))]
  };
  
  return stats;
}
