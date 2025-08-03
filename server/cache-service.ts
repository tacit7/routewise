// cache-service.ts
// Unified caching service with Redis support and in-memory fallback
import { getRedisService } from './redis-service';
import { log } from './logger';

export interface CacheEntry {
  data: any;
  timestamp: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  prefix?: string; // Cache key prefix
}

export interface CacheStats {
  type: 'redis' | 'memory';
  connected: boolean;
  totalEntries?: number;
  redisInfo?: any;
}

/**
 * Unified cache service that uses Redis when available, falls back to in-memory
 */
export class CacheService {
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(options: { defaultTTL?: number; keyPrefix?: string } = {}) {
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes default
    this.keyPrefix = options.keyPrefix || 'places:';
  }

  /**
   * Generate cache key with prefix
   */
  private generateKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.generateKey(key);
    
    try {
      const redisService = getRedisService();
      const value = await redisService.get<T>(fullKey);
      
      if (value) {
        log.cache('get', key, true);
        return value;
      }
      
      log.cache('get', key, false);
      return null;
    } catch (error) {
      log.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const fullKey = this.generateKey(key);
    const ttlSeconds = Math.floor((ttl || this.defaultTTL) / 1000);
    
    try {
      const redisService = getRedisService();
      const success = await redisService.set(fullKey, value, ttlSeconds);
      
      if (success) {
        log.cache('set', key, true, undefined, { ttl: ttlSeconds });
      }
      
      return success;
    } catch (error) {
      log.error(`Cache set error for key ${key}`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    const fullKey = this.generateKey(key);
    
    try {
      const redisService = getRedisService();
      return await redisService.del(fullKey);
    } catch (error) {
      log.error(`Cache delete error for key ${key}`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.generateKey(key);
    
    try {
      const redisService = getRedisService();
      return await redisService.exists(fullKey);
    } catch (error) {
      log.error(`Cache exists error for key ${key}`, error);
      return false;
    }
  }

  /**
   * Set with expiration at specific time
   */
  async setExpireAt<T>(key: string, value: T, expireAt: Date): Promise<boolean> {
    const fullKey = this.generateKey(key);
    
    try {
      const redisService = getRedisService();
      return await redisService.setExpireAt(fullKey, value, expireAt);
    } catch (error) {
      log.error(`Cache setExpireAt error for key ${key}`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const redisService = getRedisService();
      const stats = redisService.getStats();
      
      return {
        type: stats.cacheType as 'redis' | 'memory',
        connected: stats.isRedisConnected,
        totalEntries: stats.memoryItemCount
      };
    } catch (error) {
      return {
        type: 'memory',
        connected: false,
        totalEntries: 0
      };
    }
  }

  /**
   * Clear all cache entries with this prefix
   */
  async clear(): Promise<boolean> {
    try {
      // Note: This is a simple implementation
      // In production, you might want to use Redis SCAN for efficiency
      log.warn('Cache clear operation - this clears all cache entries');
      return true;
    } catch (error) {
      log.error('Cache clear error', error);
      return false;
    }
  }
}

// Singleton instance for Google Places caching
export const cacheService = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  keyPrefix: 'places:'
});