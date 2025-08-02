/**
 * Performance monitoring and optimization utilities for RouteWise
 * Tracks API calls, cache performance, and user interactions
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'api' | 'cache' | 'component' | 'user-action';
  metadata?: Record<string, any>;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  avgHitTime: number;
  avgMissTime: number;
}

interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  slowestEndpoint: { endpoint: string; avgTime: number } | null;
  rateLimitHits: number;
}

/**
 * Performance monitoring class with metrics collection and analysis
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private listeners: Array<(metric: PerformanceMetric) => void> = [];

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    duration: number,
    type: PerformanceMetric['type'],
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      type,
      metadata,
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(metric);
      } catch (error) {
        console.error('Error in performance listener:', error);
      }
    });
  }

  /**
   * Measure function execution time
   */
  measure<T>(
    name: string,
    type: PerformanceMetric['type'],
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, type, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, type, { 
        ...metadata, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(
    name: string,
    type: PerformanceMetric['type'],
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, type, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, type, { 
        ...metadata, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics(): CacheMetrics {
    const cacheMetrics = this.metrics.filter(m => m.type === 'cache');
    const hits = cacheMetrics.filter(m => m.metadata?.hit === true);
    const misses = cacheMetrics.filter(m => m.metadata?.hit === false);

    const avgHitTime = hits.length > 0 
      ? hits.reduce((sum, m) => sum + m.duration, 0) / hits.length 
      : 0;

    const avgMissTime = misses.length > 0 
      ? misses.reduce((sum, m) => sum + m.duration, 0) / misses.length 
      : 0;

    return {
      hits: hits.length,
      misses: misses.length,
      hitRate: cacheMetrics.length > 0 ? (hits.length / cacheMetrics.length) * 100 : 0,
      avgHitTime,
      avgMissTime,
    };
  }

  /**
   * Get API performance metrics
   */
  getAPIMetrics(): APIMetrics {
    const apiMetrics = this.metrics.filter(m => m.type === 'api');
    const successful = apiMetrics.filter(m => !m.metadata?.error);
    const failed = apiMetrics.filter(m => m.metadata?.error);
    const rateLimited = apiMetrics.filter(m => m.metadata?.statusCode === 429);

    const avgResponseTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length 
      : 0;

    // Find slowest endpoint
    const endpointTimes = new Map<string, number[]>();
    apiMetrics.forEach(metric => {
      const endpoint = metric.metadata?.endpoint || metric.name;
      if (!endpointTimes.has(endpoint)) {
        endpointTimes.set(endpoint, []);
      }
      endpointTimes.get(endpoint)!.push(metric.duration);
    });

    let slowestEndpoint: { endpoint: string; avgTime: number } | null = null;
    endpointTimes.forEach((times, endpoint) => {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (!slowestEndpoint || avgTime > slowestEndpoint.avgTime) {
        slowestEndpoint = { endpoint, avgTime };
      }
    });

    return {
      totalRequests: apiMetrics.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      avgResponseTime,
      slowestEndpoint,
      rateLimitHits: rateLimited.length,
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    cache: CacheMetrics;
    api: APIMetrics;
    totalMetrics: number;
    timeRange: { start: number; end: number } | null;
  } {
    const timeRange = this.metrics.length > 0 
      ? {
          start: Math.min(...this.metrics.map(m => m.timestamp)),
          end: Math.max(...this.metrics.map(m => m.timestamp))
        }
      : null;

    return {
      cache: this.getCacheMetrics(),
      api: this.getAPIMetrics(),
      totalMetrics: this.metrics.length,
      timeRange,
    };
  }

  /**
   * Add a performance listener
   */
  addListener(listener: (metric: PerformanceMetric) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getPerformanceSummary(),
      exportTime: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Get slow operations (above threshold)
   */
  getSlowOperations(thresholdMs: number = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > thresholdMs);
  }

  /**
   * Check if performance is degrading
   */
  isPerformanceDegrading(windowMs: number = 5 * 60 * 1000): boolean {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < windowMs);
    
    if (recentMetrics.length < 10) return false;

    const avgTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const slowOperations = recentMetrics.filter(m => m.duration > avgTime * 2);
    
    return slowOperations.length / recentMetrics.length > 0.3; // 30% slow operations
  }
}

/**
 * Cache performance optimizer with intelligent cache management
 */
export class CacheOptimizer {
  private accessPatterns = new Map<string, { count: number; lastAccess: number }>();
  private preloadQueue = new Set<string>();
  private maxPreloadSize = 5;

  /**
   * Record cache access for pattern analysis
   */
  recordAccess(key: string): void {
    const pattern = this.accessPatterns.get(key) || { count: 0, lastAccess: 0 };
    pattern.count++;
    pattern.lastAccess = Date.now();
    this.accessPatterns.set(key, pattern);
  }

  /**
   * Get most frequently accessed items
   */
  getHotKeys(limit: number = 10): string[] {
    return Array.from(this.accessPatterns.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([key]) => key);
  }

  /**
   * Get items that haven't been accessed recently
   */
  getColdKeys(thresholdMs: number = 30 * 60 * 1000): string[] {
    const now = Date.now();
    return Array.from(this.accessPatterns.entries())
      .filter(([, pattern]) => now - pattern.lastAccess > thresholdMs)
      .map(([key]) => key);
  }

  /**
   * Suggest items for preloading based on access patterns
   */
  suggestPreload(): string[] {
    const hotKeys = this.getHotKeys(this.maxPreloadSize);
    const newSuggestions = hotKeys.filter(key => !this.preloadQueue.has(key));
    
    newSuggestions.forEach(key => this.preloadQueue.add(key));
    
    // Clean old preload suggestions
    if (this.preloadQueue.size > this.maxPreloadSize) {
      const excess = Array.from(this.preloadQueue).slice(0, this.preloadQueue.size - this.maxPreloadSize);
      excess.forEach(key => this.preloadQueue.delete(key));
    }

    return newSuggestions;
  }

  /**
   * Clear access patterns
   */
  clearPatterns(): void {
    this.accessPatterns.clear();
    this.preloadQueue.clear();
  }

  /**
   * Get cache optimization suggestions
   */
  getOptimizationSuggestions(): {
    keysToPreload: string[];
    keysToEvict: string[];
    cacheHitRate: number;
  } {
    const keysToPreload = this.suggestPreload();
    const keysToEvict = this.getColdKeys();
    const totalAccesses = Array.from(this.accessPatterns.values()).reduce((sum, p) => sum + p.count, 0);
    const cacheHitRate = totalAccesses > 0 ? (this.accessPatterns.size / totalAccesses) * 100 : 0;

    return {
      keysToPreload,
      keysToEvict,
      cacheHitRate,
    };
  }
}

/**
 * Singleton instances
 */
export const performanceMonitor = new PerformanceMonitor();
export const cacheOptimizer = new CacheOptimizer();

/**
 * Decorator for automatic performance monitoring
 */
export function monitored(name?: string, type: PerformanceMetric['type'] = 'component') {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) return;

    descriptor.value = function (...args: any[]) {
      const methodName = name || `${target.constructor.name}.${propertyKey}`;
      return performanceMonitor.measure(methodName, type, () => originalMethod.apply(this, args));
    } as T;

    return descriptor;
  };
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const recordMetric = (name: string, duration: number, type: PerformanceMetric['type'], metadata?: Record<string, any>) => {
    performanceMonitor.recordMetric(name, duration, type, metadata);
  };

  const measure = <T>(name: string, type: PerformanceMetric['type'], fn: () => T, metadata?: Record<string, any>): T => {
    return performanceMonitor.measure(name, type, fn, metadata);
  };

  const measureAsync = async <T>(name: string, type: PerformanceMetric['type'], fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> => {
    return performanceMonitor.measureAsync(name, type, fn, metadata);
  };

  const getSummary = () => performanceMonitor.getPerformanceSummary();

  const addListener = (listener: (metric: PerformanceMetric) => void) => {
    return performanceMonitor.addListener(listener);
  };

  return {
    recordMetric,
    measure,
    measureAsync,
    getSummary,
    addListener,
  };
}