// cache-service.ts
// Unified caching service with Redis support and in-memory fallback
import { createClient, RedisClientType } from 'redis';

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
  private redisClient: RedisClientType | null = null;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private isRedisConnected = false;
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(options: { defaultTTL?: number; keyPrefix?: string } = {}) {
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes default
    this.keyPrefix = options.keyPrefix || 'routewise:';
    
    // Initialize Redis connection if configured
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection with graceful fallback
   */
  private async initializeRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;

    // Skip Redis setup if not configured
    if (!redisUrl && !process.env.REDIS_HOST) {
      console.log('🗄️ Redis not configured, using in-memory cache');
      return;
    }

    try {
      // Create Redis client
      const clientConfig: any = {};
      
      if (redisUrl) {
        clientConfig.url = redisUrl;
      } else {
        clientConfig.socket = {
          host: redisHost,
          port: redisPort
        };
        if (redisPassword) {
          clientConfig.password = redisPassword;
        }
      }

      this.redisClient = createClient(clientConfig);

      // Set up error handling
      this.redisClient.on('error', (err) => {
        console.error('🚨 Redis error:', err.message);
        this.isRedisConnected = false;
      });

      this.redisClient.on('connect', () => {
        console.log('🔗 Redis connecting...');
      });

      this.redisClient.on('ready', () => {
        console.log('✅ Redis connected and ready');
        this.isRedisConnected = true;
      });

      this.redisClient.on('end', () => {
        console.log('⚠️ Redis connection closed');
        this.isRedisConnected = false;
      });

      // Connect to Redis
      await this.redisClient.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      console.log('🔄 Falling back to in-memory cache');
      this.redisClient = null;
      this.isRedisConnected = false;
    }
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
      if (this.isRedisConnected && this.redisClient) {
        // Use Redis
        const value = await this.redisClient.get(fullKey);
        if (value) {
          console.log(`🎯 Redis cache HIT: ${key}`);
          return JSON.parse(value) as T;
        }
        console.log(`🔍 Redis cache MISS: ${key}`);
        return null;
      }
    } catch (error) {
      console.error(`⚠️ Redis get error for ${key}:`, error.message);
      // Fall through to memory cache
    }

    // Use in-memory cache
    const entry = this.memoryCache.get(fullKey);
    if (entry && Date.now() - entry.timestamp < this.defaultTTL) {
      console.log(`🎯 Memory cache HIT: ${key}`);
      return entry.data as T;
    }
    
    if (entry) {
      // Expired entry
      this.memoryCache.delete(fullKey);
    }
    
    console.log(`🔍 Memory cache MISS: ${key}`);
    return null;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    const fullKey = this.generateKey(key);
    const ttl = options?.ttl || this.defaultTTL;
    
    try {
      if (this.isRedisConnected && this.redisClient) {
        // Use Redis with TTL in seconds
        const ttlSeconds = Math.ceil(ttl / 1000);
        await this.redisClient.setEx(fullKey, ttlSeconds, JSON.stringify(value));
        console.log(`💾 Redis cache SET: ${key} (TTL: ${ttlSeconds}s)`);
        return;
      }
    } catch (error) {
      console.error(`⚠️ Redis set error for ${key}:`, error.message);
      // Fall through to memory cache
    }

    // Use in-memory cache
    this.memoryCache.set(fullKey, {
      data: value,
      timestamp: Date.now()
    });
    console.log(`💾 Memory cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.generateKey(key);
    
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(fullKey);
        console.log(`🗑️ Redis cache DELETE: ${key}`);
        return;
      }
    } catch (error) {
      console.error(`⚠️ Redis delete error for ${key}:`, error.message);
      // Fall through to memory cache
    }

    // Use in-memory cache
    this.memoryCache.delete(fullKey);
    console.log(`🗑️ Memory cache DELETE: ${key}`);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        // Clear only keys with our prefix
        const keys = await this.redisClient.keys(`${this.keyPrefix}*`);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          console.log(`🗑️ Redis cache cleared: ${keys.length} entries`);
        }
      }
    } catch (error) {
      console.error('⚠️ Redis clear error:', error.message);
    }

    // Clear memory cache
    const count = this.memoryCache.size;
    this.memoryCache.clear();
    console.log(`🗑️ Memory cache cleared: ${count} entries`);
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.generateKey(key);
    
    try {
      if (this.isRedisConnected && this.redisClient) {
        const exists = await this.redisClient.exists(fullKey);
        return exists === 1;
      }
    } catch (error) {
      console.error(`⚠️ Redis exists error for ${key}:`, error.message);
    }

    // Check memory cache
    const entry = this.memoryCache.get(fullKey);
    return entry ? Date.now() - entry.timestamp < this.defaultTTL : false;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const baseStats: CacheStats = {
      type: this.isRedisConnected ? 'redis' : 'memory',
      connected: this.isRedisConnected
    };

    try {
      if (this.isRedisConnected && this.redisClient) {
        // Get Redis info
        const info = await this.redisClient.info('memory');
        const keyCount = await this.redisClient.dbSize();
        
        return {
          ...baseStats,
          totalEntries: keyCount,
          redisInfo: {
            memory: info,
            connected: true
          }
        };
      }
    } catch (error) {
      console.error('⚠️ Redis stats error:', error.message);
    }

    // Memory cache stats
    const validEntries = Array.from(this.memoryCache.values()).filter(
      entry => Date.now() - entry.timestamp < this.defaultTTL
    ).length;

    return {
      ...baseStats,
      totalEntries: validEntries
    };
  }

  /**
   * Generate cache key from method and parameters
   */
  static generateCacheKey(method: string, ...params: any[]): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  /**
   * Get or set pattern - get from cache, or execute function and cache result
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fetchFunction();
    await this.set(key, result, options);
    return result;
  }

  /**
   * Close Redis connection gracefully
   */
  async disconnect(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        console.log('👋 Redis connection closed gracefully');
      } catch (error) {
        console.error('⚠️ Error closing Redis connection:', error.message);
      }
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService({
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300000'), // 5 minutes
  keyPrefix: process.env.CACHE_KEY_PREFIX || 'routewise:'
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await cacheService.disconnect();
});

process.on('SIGINT', async () => {
  await cacheService.disconnect();
});