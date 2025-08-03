import { createClient, RedisClientType } from 'redis';
import { log } from './logger';

/**
 * Redis service for caching and session management
 * Provides connection management, caching operations, and fallback to memory
 */
export class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private memoryCache = new Map<string, { value: any; expires: number }>();
  private readonly maxMemoryItems = 1000;

  constructor(private redisUrl?: string) {
    if (redisUrl) {
      this.initializeRedisClient();
    } else {
      log.warn('Redis URL not configured, using in-memory cache fallback');
    }
  }

  private async initializeRedisClient() {
    try {
      this.client = createClient({
        url: this.redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
        retryStrategy: (retries) => {
          if (retries > 3) {
            log.error('Redis connection failed after 3 retries, falling back to memory cache');
            return false;
          }
          return Math.min(retries * 50, 500);
        }
      });

      this.client.on('error', (err) => {
        log.error('Redis client error', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        log.info('🔗 Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        log.warn('Redis disconnected, falling back to memory cache');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      log.error('Failed to initialize Redis client, using memory cache', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache (Redis or memory fallback)
   */
  async get<T = any>(key: string): Promise<T | null> {
    const prefixedKey = `routewise:${key}`;

    if (this.isConnected && this.client) {
      try {
        const value = await this.client.get(prefixedKey);
        if (value) {
          return JSON.parse(value);
        }
        return null;
      } catch (error) {
        log.error(`Redis GET failed for key ${key}`, error);
        // Fall through to memory cache
      }
    }

    // Memory cache fallback
    const cached = this.memoryCache.get(prefixedKey);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    if (cached && cached.expires <= Date.now()) {
      this.memoryCache.delete(prefixedKey);
    }

    return null;
  }

  /**
   * Set value in cache with TTL (Redis or memory fallback)
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    const prefixedKey = `routewise:${key}`;

    if (this.isConnected && this.client) {
      try {
        await this.client.setEx(prefixedKey, ttlSeconds, JSON.stringify(value));
        return true;
      } catch (error) {
        log.error(`Redis SET failed for key ${key}`, error);
        // Fall through to memory cache
      }
    }

    // Memory cache fallback
    if (this.memoryCache.size >= this.maxMemoryItems) {
      // Remove oldest items (simple LRU)
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }

    this.memoryCache.set(prefixedKey, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });

    return true;
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    const prefixedKey = `routewise:${key}`;

    if (this.isConnected && this.client) {
      try {
        await this.client.del(prefixedKey);
      } catch (error) {
        log.error(`Redis DEL failed for key ${key}`, error);
      }
    }

    // Also remove from memory cache
    this.memoryCache.delete(prefixedKey);
    return true;
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const prefixedKey = `routewise:${key}`;

    if (this.isConnected && this.client) {
      try {
        const exists = await this.client.exists(prefixedKey);
        return exists === 1;
      } catch (error) {
        log.error(`Redis EXISTS failed for key ${key}`, error);
      }
    }

    // Check memory cache
    const cached = this.memoryCache.get(prefixedKey);
    return cached !== undefined && cached.expires > Date.now();
  }

  /**
   * Set with expiration at specific time
   */
  async setExpireAt(key: string, value: any, expireAt: Date): Promise<boolean> {
    const ttlSeconds = Math.max(0, Math.floor((expireAt.getTime() - Date.now()) / 1000));
    return this.set(key, value, ttlSeconds);
  }

  /**
   * Increment counter (useful for rate limiting)
   */
  async incr(key: string): Promise<number> {
    const prefixedKey = `routewise:${key}`;

    if (this.isConnected && this.client) {
      try {
        return await this.client.incr(prefixedKey);
      } catch (error) {
        log.error(`Redis INCR failed for key ${key}`, error);
      }
    }

    // Memory cache fallback
    const current = await this.get(key) || 0;
    const newValue = typeof current === 'number' ? current + 1 : 1;
    await this.set(key, newValue, 300); // 5 minute default
    return newValue;
  }

  /**
   * Set TTL on existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const prefixedKey = `routewise:${key}`;

    if (this.isConnected && this.client) {
      try {
        await this.client.expire(prefixedKey, ttlSeconds);
        return true;
      } catch (error) {
        log.error(`Redis EXPIRE failed for key ${key}`, error);
      }
    }

    // For memory cache, we'd need to update the expires time
    const cached = this.memoryCache.get(prefixedKey);
    if (cached) {
      cached.expires = Date.now() + (ttlSeconds * 1000);
      return true;
    }

    return false;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      isRedisConnected: this.isConnected,
      memoryItemCount: this.memoryCache.size,
      maxMemoryItems: this.maxMemoryItems,
      cacheType: this.isConnected ? 'redis' : 'memory'
    };
  }

  /**
   * Clean up expired items from memory cache
   */
  private cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      try {
        await this.client.quit();
        log.info('Redis connection closed');
      } catch (error) {
        log.error('Error closing Redis connection', error);
      }
    }
  }
}

// Singleton instance
let redisService: RedisService | null = null;

/**
 * Initialize Redis service with environment configuration
 */
export function initializeRedisService(redisUrl?: string): RedisService {
  if (!redisService) {
    redisService = new RedisService(redisUrl);
    
    // Clean up memory cache every 5 minutes
    setInterval(() => {
      if (redisService) {
        (redisService as any).cleanupMemoryCache();
      }
    }, 5 * 60 * 1000);
  }
  return redisService;
}

/**
 * Get Redis service instance
 */
export function getRedisService(): RedisService {
  if (!redisService) {
    throw new Error('Redis service not initialized. Call initializeRedisService() first.');
  }
  return redisService;
}