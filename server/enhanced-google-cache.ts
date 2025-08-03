import { CacheService } from './cache-service';
import { log } from './logger';

/**
 * Enhanced Google API caching service with intelligent cache strategies
 * Optimized for development workflow with longer TTLs and smart invalidation
 */
export class EnhancedGoogleCacheService {
  private placesCache: CacheService;
  private directionsCache: CacheService;
  private staticCache: CacheService;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Development-optimized cache durations (longer TTLs to reduce API calls)
    const devMultiplier = this.isDevelopment ? 10 : 1; // 10x longer in dev
    
    this.placesCache = new CacheService({
      defaultTTL: 5 * 60 * 1000 * devMultiplier, // 5min prod, 50min dev
      keyPrefix: 'places:'
    });
    
    this.directionsCache = new CacheService({
      defaultTTL: 15 * 60 * 1000 * devMultiplier, // 15min prod, 150min dev
      keyPrefix: 'directions:'
    });
    
    this.staticCache = new CacheService({
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
      keyPrefix: 'static:'
    });

    log.info(`🗄️ Enhanced Google Cache initialized (dev: ${this.isDevelopment})`);
  }

  /**
   * GOOGLE PLACES API CACHING
   */
  
  // Cache geocoding results (city → coordinates)
  async cacheGeocode(cityName: string, coordinates: { lat: number; lng: number }) {
    const key = this.generateGeocodeKey(cityName);
    await this.placesCache.set(key, coordinates);
  }

  async getCachedGeocode(cityName: string): Promise<{ lat: number; lng: number } | null> {
    const key = this.generateGeocodeKey(cityName);
    return await this.placesCache.get(key);
  }

  // Cache nearby places searches
  async cacheNearbyPlaces(
    lat: number, 
    lng: number, 
    radius: number, 
    type: string | undefined, 
    places: any[]
  ) {
    const key = this.generateNearbyKey(lat, lng, radius, type);
    await this.placesCache.set(key, places);
  }

  async getCachedNearbyPlaces(
    lat: number, 
    lng: number, 
    radius: number, 
    type?: string
  ): Promise<any[] | null> {
    const key = this.generateNearbyKey(lat, lng, radius, type);
    return await this.placesCache.get(key);
  }

  // Cache place photos (URLs are static for photo_reference)
  async cachePhotoUrl(photoReference: string, maxWidth: number, url: string) {
    const key = `photo:${photoReference}:${maxWidth}`;
    await this.staticCache.set(key, url);
  }

  async getCachedPhotoUrl(photoReference: string, maxWidth: number): Promise<string | null> {
    const key = `photo:${photoReference}:${maxWidth}`;
    return await this.staticCache.get(key);
  }

  /**
   * GOOGLE DIRECTIONS API CACHING
   */
  
  // Cache route calculations (most expensive API calls)
  async cacheRoute(
    origin: string,
    destination: string,
    travelMode: string,
    route: any
  ) {
    const key = this.generateRouteKey(origin, destination, travelMode);
    // Longer TTL for routes since they rarely change significantly
    const ttl = this.isDevelopment ? 4 * 60 * 60 * 1000 : 30 * 60 * 1000; // 4hr dev, 30min prod
    await this.directionsCache.set(key, route, ttl);
  }

  async getCachedRoute(
    origin: string,
    destination: string,
    travelMode: string = 'DRIVING'
  ): Promise<any | null> {
    const key = this.generateRouteKey(origin, destination, travelMode);
    return await this.directionsCache.get(key);
  }

  // Cache distance matrix calculations
  async cacheDistanceMatrix(
    origins: string[],
    destinations: string[],
    travelMode: string,
    matrix: any
  ) {
    const key = this.generateDistanceMatrixKey(origins, destinations, travelMode);
    await this.directionsCache.set(key, matrix);
  }

  async getCachedDistanceMatrix(
    origins: string[],
    destinations: string[],
    travelMode: string = 'DRIVING'
  ): Promise<any | null> {
    const key = this.generateDistanceMatrixKey(origins, destinations, travelMode);
    return await this.directionsCache.get(key);
  }

  /**
   * GOOGLE MAPS STATIC API CACHING
   */
  
  // Cache static map images (binary data or URLs)
  async cacheStaticMap(params: Record<string, any>, imageUrl: string) {
    const key = this.generateStaticMapKey(params);
    await this.staticCache.set(key, imageUrl);
  }

  async getCachedStaticMap(params: Record<string, any>): Promise<string | null> {
    const key = this.generateStaticMapKey(params);
    return await this.staticCache.get(key);
  }

  /**
   * ROUTE-SPECIFIC OPTIMIZATIONS
   */
  
  // Cache entire route POI results (most common dev use case)
  async cacheRoutePois(
    startCity: string,
    endCity: string,
    pois: any[]
  ) {
    const key = `route-pois:${startCity.toLowerCase()}:${endCity.toLowerCase()}`;
    // Very long TTL for development since routes don't change often
    const ttl = this.isDevelopment ? 8 * 60 * 60 * 1000 : 10 * 60 * 1000; // 8hr dev, 10min prod
    await this.placesCache.set(key, pois, ttl);
  }

  async getCachedRoutePois(startCity: string, endCity: string): Promise<any[] | null> {
    const key = `route-pois:${startCity.toLowerCase()}:${endCity.toLowerCase()}`;
    return await this.placesCache.get(key);
  }

  // Cache route polyline data (for map rendering)
  async cacheRoutePolyline(
    startCity: string,
    endCity: string,
    polylineData: any
  ) {
    const key = `route-polyline:${startCity.toLowerCase()}:${endCity.toLowerCase()}`;
    const ttl = this.isDevelopment ? 12 * 60 * 60 * 1000 : 60 * 60 * 1000; // 12hr dev, 1hr prod
    await this.staticCache.set(key, polylineData, ttl);
  }

  async getCachedRoutePolyline(startCity: string, endCity: string): Promise<any | null> {
    const key = `route-polyline:${startCity.toLowerCase()}:${endCity.toLowerCase()}`;
    return await this.staticCache.get(key);
  }

  /**
   * DEVELOPMENT HELPERS
   */
  
  // Get comprehensive cache stats for development
  async getDevCacheStats() {
    const placesStats = await this.placesCache.getStats();
    const directionsStats = await this.directionsCache.getStats();
    const staticStats = await this.staticCache.getStats();

    return {
      development: this.isDevelopment,
      places: placesStats,
      directions: directionsStats,
      static: staticStats,
      suggestions: this.generateCacheSuggestions()
    };
  }

  // Clear development cache (useful for testing)
  async clearDevCache() {
    if (!this.isDevelopment) {
      log.warn('clearDevCache() called in production - ignoring');
      return false;
    }

    await Promise.all([
      this.placesCache.clear(),
      this.directionsCache.clear(),
      this.staticCache.clear()
    ]);

    log.info('🗑️ Development cache cleared');
    return true;
  }

  // Generate cache usage suggestions
  private generateCacheSuggestions(): string[] {
    const suggestions = [];
    
    if (this.isDevelopment) {
      suggestions.push('Development mode: Using extended cache TTLs (10x longer)');
      suggestions.push('Route POIs cached for 8 hours - perfect for route testing');
      suggestions.push('Geocoding cached for 50 minutes - great for city testing');
      suggestions.push('Use clearDevCache() to reset during development');
    } else {
      suggestions.push('Production mode: Using optimized cache TTLs');
      suggestions.push('Consider warming cache for popular routes');
    }

    return suggestions;
  }

  /**
   * PRIVATE KEY GENERATORS
   */
  
  private generateGeocodeKey(cityName: string): string {
    return `geocode:${cityName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  private generateNearbyKey(lat: number, lng: number, radius: number, type?: string): string {
    const roundedLat = Math.round(lat * 1000) / 1000; // 3 decimal precision
    const roundedLng = Math.round(lng * 1000) / 1000;
    return `nearby:${roundedLat}:${roundedLng}:${radius}:${type || 'all'}`;
  }

  private generateRouteKey(origin: string, destination: string, travelMode: string): string {
    const cleanOrigin = origin.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const cleanDest = destination.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `route:${cleanOrigin}:${cleanDest}:${travelMode.toLowerCase()}`;
  }

  private generateDistanceMatrixKey(
    origins: string[], 
    destinations: string[], 
    travelMode: string
  ): string {
    const originsHash = origins.join('|').toLowerCase().replace(/[^a-z0-9|]/g, '-');
    const destsHash = destinations.join('|').toLowerCase().replace(/[^a-z0-9|]/g, '-');
    return `matrix:${originsHash}:${destsHash}:${travelMode.toLowerCase()}`;
  }

  private generateStaticMapKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // Create hash of parameters for consistent key
    return `static-map:${Buffer.from(sortedParams).toString('base64')}`;
  }
}

// Singleton instance
export const enhancedGoogleCache = new EnhancedGoogleCacheService();

// Export types
export type CacheStats = {
  development: boolean;
  places: any;
  directions: any;
  static: any;
  suggestions: string[];
};