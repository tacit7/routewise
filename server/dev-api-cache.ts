// dev-api-cache.ts
// Simple in-memory cache for API responses, enabled only in development
import type { Request, Response, NextFunction } from "express";

interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const cache: Record<string, CacheEntry> = {};

function makeCacheKey(req: Request): string {
  // Key by method + url + query + body (for POST)
  let key = req.method + req.originalUrl;
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    key += JSON.stringify(req.body);
  }
  return key;
}

export function devApiCacheMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== "development") return next();
  if (!req.path.startsWith("/api")) return next();

  const key = makeCacheKey(req);
  const now = Date.now();
  const entry = cache[key];

  if (entry && now - entry.timestamp < CACHE_DURATION_MS) {
    return res.json(entry.data);
  }

  // Monkey-patch res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    cache[key] = { data: body, timestamp: Date.now() };
    return originalJson(body);
  };

  next();
}
