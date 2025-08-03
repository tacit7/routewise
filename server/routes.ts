import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GooglePlacesService, SAMPLE_ROUTE_COORDINATES } from "./google-places";
import { NominatimService } from "./nominatim-service";
import { tripService } from "./trip-service";
import { interestsService } from "./interests-service";
import { suggestedTripsService } from "./suggested-trips-service";
import { AuthMiddleware } from "./auth-middleware";
import { 
  validateSchema, 
  checkUserOwnership, 
  validateInterestCategories,
  rateLimitSuggestedTrips 
} from "./interests-middleware";
import { 
  updateUserInterestsSchema,
  suggestedTripsQuerySchema,
  userIdParamSchema,
  tripIdParamSchema 
} from "./interests-validation";
import type { InsertPoi } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  let placesService: GooglePlacesService | null = null;
  const nominatimService = new NominatimService(); // Always available, no API key needed

  console.log('🔧 Environment check:');
  console.log('  - Google Places API Key:', googlePlacesApiKey ? 'configured' : 'missing');
  console.log('  - Google Maps API Key:', googleMapsApiKey ? 'configured' : 'missing');

  if (googlePlacesApiKey) {
    placesService = new GooglePlacesService(googlePlacesApiKey);
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        nominatim: 'available',
        googlePlaces: placesService ? 'available' : 'unavailable',
        googleMaps: googleMapsApiKey ? 'available' : 'unavailable'
      }
    });
  });

  // Cache stats endpoint (development only)
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/cache-stats", async (req, res) => {
      const { getCacheStats } = await import('./dev-api-cache');
      const apiCacheStats = getCacheStats();
      const placesServiceStats = placesService ? await placesService.getCacheStats() : null;
      
      res.json({
        apiCache: apiCacheStats,
        placesServiceCache: placesServiceStats,
        mswDisabled: process.env.MSW_DISABLED === 'true',
        timestamp: new Date().toISOString()
      });
    });

    // Clear cache endpoint
    app.post("/api/clear-cache", async (req, res) => {
      const { clearCache } = await import('./dev-api-cache');
      await clearCache();
      if (placesService) {
        await placesService.clearCache();
      }
      res.json({ message: 'Cache cleared', timestamp: new Date().toISOString() });
    });

    // Test geocoding endpoint to demonstrate caching
    app.get("/api/test-geocoding/:city", async (req, res) => {
      if (!placesService) {
        return res.status(503).json({ error: 'Google Places service not available' });
      }
      
      const startTime = Date.now();
      const result = await placesService.geocodeCity(req.params.city);
      const endTime = Date.now();
      
      res.json({
        city: req.params.city,
        coordinates: result,
        responseTime: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Serve Google Maps API key to frontend
  app.get("/api/maps-key", (req, res) => {
    res.json({ apiKey: googleMapsApiKey || '' });
  });

  // Free Places Autocomplete endpoint (using OpenStreetMap Nominatim)
  app.get("/api/places/autocomplete", async (req, res) => {
    const { input, types } = req.query;
    
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ message: "Input parameter is required" });
    }
    
    try {
      // Use free Nominatim service for city autocomplete
      const suggestions = await nominatimService.searchCities(input, 8);
      
      // Transform to match frontend expectations
      const predictions = suggestions.map(suggestion => ({
        place_id: suggestion.place_id,
        description: suggestion.description,
        main_text: suggestion.main_text,
        secondary_text: suggestion.secondary_text,
      }));
      
      res.json({ predictions });
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
  });

  // Premium Google Places Autocomplete endpoint (fallback if needed)
  app.get("/api/places/autocomplete/google", async (req, res) => {
    const { input, types } = req.query;
    
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ message: "Input parameter is required" });
    }
    
    if (!googlePlacesApiKey) {
      return res.status(503).json({ message: "Google Places API key not configured" });
    }
    
    try {
      const baseUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
      const params = new URLSearchParams({
        input: input,
        key: googlePlacesApiKey,
        language: 'en'
      });
      
      // Add types filter if provided (e.g., '(cities)' for cities only)
      if (types && typeof types === 'string') {
        params.append('types', types);
      }
      
      const response = await fetch(`${baseUrl}?${params}`);
      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places Autocomplete API error:', data.status, data.error_message);
        return res.status(500).json({ message: 'Failed to fetch suggestions' });
      }
      
      // Transform to match frontend expectations
      const predictions = data.predictions?.map((prediction: any) => ({
        place_id: prediction.place_id,
        description: prediction.description,
        main_text: prediction.structured_formatting?.main_text || prediction.description,
        secondary_text: prediction.structured_formatting?.secondary_text || '',
      })) || [];
      
      res.json({ predictions });
    } catch (error) {
      console.error('Error fetching Google autocomplete suggestions:', error);
      res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
  });

  // Get POIs for a specific route or checkpoint
  app.get("/api/pois", async (req, res) => {
    const { start, end, checkpoint } = req.query;
    
    // If checkpoint parameter is provided, fetch places for that specific city
    if (checkpoint && typeof checkpoint === 'string') {
      return await getCheckpointPois(checkpoint, placesService, res);
    }
    
    // If route parameters are provided, fetch places along that specific route
    if (start && end && typeof start === 'string' && typeof end === 'string') {
      return await getRoutePois(start, end, placesService, res);
    }
    
    // Otherwise return cached general places
    return await getGeneralPois(placesService, res);
  });

  async function getRoutePois(startCity: string, endCity: string, placesService: GooglePlacesService | null, res: any) {
    try {
      if (!placesService) {
        return res.status(503).json({ 
          message: "Google Places API key is required for route-specific places" 
        });
      }

      console.log(`Fetching places along route: ${startCity} → ${endCity}`);
      
      // Try to get coordinates for start and end cities
      const startCoords = await placesService.geocodeCity(startCity);
      const endCoords = await placesService.geocodeCity(endCity);
      
      if (!startCoords || !endCoords) {
        console.log("Geocoding failed, using route-relevant places");
        // Use route-relevant places based on known city coordinates
        return await getRouteRelevantPois(startCity, endCity, placesService, res);
      }

      // Generate points along the route
      const routePoints = placesService.generateRoutePoints(startCoords, endCoords, 4);
      const allPlaces: InsertPoi[] = [];
      
      // Search for places at each point along the route
      for (let i = 0; i < routePoints.length; i++) {
        const point = routePoints[i];
        const types = ['restaurant', 'tourist_attraction', 'park'];
        
        for (const type of types) {
          const places = await placesService.searchNearbyPlaces(
            point.lat, 
            point.lng, 
            25000, // 25km radius
            type
          );
          
          // Convert Google Places to our POI format
          for (let j = 0; j < Math.min(places.length, 3); j++) {
            const place = places[j];
            
            if (!place.name || !place.rating) continue;
            
            // Skip if we already have this place
            if (allPlaces.some(p => p.placeId === place.place_id)) continue;
            
            let imageUrl = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
            
            if (place.photos && place.photos.length > 0) {
              imageUrl = await placesService.getPhotoUrl(place.photos[0].photo_reference);
            }
            
            const distanceFromStart = Math.sqrt(
              Math.pow(point.lat - startCoords.lat, 2) + 
              Math.pow(point.lng - startCoords.lng, 2)
            );
            
            const poi: InsertPoi = {
              name: place.name,
              description: placesService.generateDescription(place),
              category: placesService.mapPlaceTypeToCategory(place.types),
              rating: place.rating.toFixed(1),
              reviewCount: place.user_ratings_total || 0,
              timeFromStart: placesService.generateTimeFromStart(),
              imageUrl: imageUrl,
              placeId: place.place_id,
              address: place.formatted_address || place.vicinity || null,
              priceLevel: place.price_level || null,
              isOpen: place.opening_hours?.open_now ?? null,
            };
            
            allPlaces.push(poi);
          }
        }
        
        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log(`Found ${allPlaces.length} places along route`);
      res.json(allPlaces);
    } catch (error) {
      console.error("Error fetching route POIs:", error);
      res.status(500).json({ message: "Failed to fetch places along route" });
    }
  }

  async function getRouteRelevantPois(startCity: string, endCity: string, placesService: GooglePlacesService | null, res: any) {
    try {
      if (!placesService) {
        return res.status(503).json({ 
          message: "Google Places API key is required" 
        });
      }

      // Known coordinates for major US cities
      const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
        'austin': { lat: 30.2672, lng: -97.7431 },
        'dallas': { lat: 32.7767, lng: -96.7970 },
        'houston': { lat: 29.7604, lng: -95.3698 },
        'san antonio': { lat: 29.4241, lng: -98.4936 },
        'fort worth': { lat: 32.7555, lng: -97.3308 },
        'el paso': { lat: 31.7619, lng: -106.4850 },
        'amarillo': { lat: 35.2220, lng: -101.8313 },
        'lubbock': { lat: 33.5779, lng: -101.8552 },
        'waco': { lat: 31.5494, lng: -97.1467 },
        'corpus christi': { lat: 27.8006, lng: -97.3964 },
        'phoenix': { lat: 33.4484, lng: -112.0740 },
        'tucson': { lat: 32.2226, lng: -110.9747 },
        'flagstaff': { lat: 35.1983, lng: -111.6513 },
        'los angeles': { lat: 34.0522, lng: -118.2437 },
        'san francisco': { lat: 37.7749, lng: -122.4194 },
        'san diego': { lat: 32.7157, lng: -117.1611 },
        'sacramento': { lat: 38.5816, lng: -121.4944 },
        'fresno': { lat: 36.7378, lng: -119.7871 },
        'denver': { lat: 39.7392, lng: -104.9903 },
        'colorado springs': { lat: 38.8339, lng: -104.8214 },
        'las vegas': { lat: 36.1699, lng: -115.1398 },
        'reno': { lat: 39.5296, lng: -119.8138 },
        'albuquerque': { lat: 35.0844, lng: -106.6504 },
        'santa fe': { lat: 35.6870, lng: -105.9378 },
        'oklahoma city': { lat: 35.4676, lng: -97.5164 },
        'tulsa': { lat: 36.1540, lng: -95.9928 },
        'new orleans': { lat: 29.9511, lng: -90.0715 },
        'baton rouge': { lat: 30.4515, lng: -91.1871 },
        'atlanta': { lat: 33.7490, lng: -84.3880 },
        'savannah': { lat: 32.0835, lng: -81.0998 },
        'nashville': { lat: 36.1627, lng: -86.7816 },
        'memphis': { lat: 35.1495, lng: -90.0490 },
        'knoxville': { lat: 35.9606, lng: -83.9207 },
        'birmingham': { lat: 33.5186, lng: -86.8104 },
        'montgomery': { lat: 32.3617, lng: -86.2792 },
        'mobile': { lat: 30.6954, lng: -88.0399 },
        'jacksonville': { lat: 30.3322, lng: -81.6557 },
        'miami': { lat: 25.7617, lng: -80.1918 },
        'orlando': { lat: 28.5383, lng: -81.3792 },
        'tampa': { lat: 27.9506, lng: -82.4572 },
        'tallahassee': { lat: 30.4518, lng: -84.2807 },
        'charlotte': { lat: 35.2271, lng: -80.8431 },
        'raleigh': { lat: 35.7796, lng: -78.6382 },
        'charleston': { lat: 32.7765, lng: -79.9311 },
        'columbia': { lat: 34.0007, lng: -81.0348 },
        'new york': { lat: 40.7128, lng: -74.0060 },
        'new york city': { lat: 40.7128, lng: -74.0060 },
        'brooklyn': { lat: 40.6782, lng: -73.9442 },
        'queens': { lat: 40.7282, lng: -73.7949 },
        'manhattan': { lat: 40.7831, lng: -73.9712 },
        'bronx': { lat: 40.8448, lng: -73.8648 },
        'staten island': { lat: 40.5795, lng: -74.1502 },
        'boston': { lat: 42.3601, lng: -71.0589 },
        'philadelphia': { lat: 39.9526, lng: -75.1652 },
        'washington': { lat: 38.9072, lng: -77.0369 },
        'washington dc': { lat: 38.9072, lng: -77.0369 },
        'baltimore': { lat: 39.2904, lng: -76.6122 },
        'richmond': { lat: 37.5407, lng: -77.4360 },
        'virginia beach': { lat: 36.8529, lng: -75.9780 },
        'norfolk': { lat: 36.8508, lng: -76.2859 },
        'detroit': { lat: 42.3314, lng: -83.0458 },
        'cleveland': { lat: 41.4993, lng: -81.6944 },
        'cincinnati': { lat: 39.1031, lng: -84.5120 },
        'columbus': { lat: 39.9612, lng: -82.9988 },
        'pittsburgh': { lat: 40.4406, lng: -79.9959 },
        'buffalo': { lat: 42.8864, lng: -78.8784 },
        'rochester': { lat: 43.1566, lng: -77.6088 },
        'syracuse': { lat: 43.0481, lng: -76.1474 },
        'albany': { lat: 42.6526, lng: -73.7562 },
        'milwaukee': { lat: 43.0389, lng: -87.9065 },
        'madison': { lat: 43.0731, lng: -89.4012 },
        'minneapolis': { lat: 44.9778, lng: -93.2650 },
        'saint paul': { lat: 44.9537, lng: -93.0900 },
        'des moines': { lat: 41.5868, lng: -93.6250 },
        'kansas city': { lat: 39.0997, lng: -94.5786 },
        'saint louis': { lat: 38.6270, lng: -90.1994 },
        'little rock': { lat: 34.7465, lng: -92.2896 },
        'jackson': { lat: 32.2988, lng: -90.1848 },
        'louisville': { lat: 38.2527, lng: -85.7585 },
        'indianapolis': { lat: 39.7684, lng: -86.1581 },
        'fort wayne': { lat: 41.0793, lng: -85.1394 }
      };

      const startCoords = cityCoordinates[startCity.toLowerCase()];
      const endCoords = cityCoordinates[endCity.toLowerCase()];

      if (startCoords && endCoords) {
        console.log(`Fetching route-specific places for ${startCity} to ${endCity}`);
        
        // Generate points along the route and fetch places
        const routePoints = placesService.generateRoutePoints(startCoords, endCoords, 4);
        const allPlaces: InsertPoi[] = [];

        for (const point of routePoints) {
          const placeTypes = ['restaurant', 'tourist_attraction', 'park', 'gas_station'];
          
          for (const type of placeTypes) {
            const places = await placesService.searchNearbyPlaces(point.lat, point.lng, 25000, type);
            
            for (const place of places.slice(0, 6)) {
              // Skip if we already have this place
              if (allPlaces.some(p => p.placeId === place.place_id)) continue;
              
              if (!place.name || !place.rating) continue;
              
              try {
                let imageUrl = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
                
                if (place.photos && place.photos.length > 0) {
                  imageUrl = await placesService.getPhotoUrl(place.photos[0].photo_reference);
                }

                const poi: InsertPoi = {
                  name: place.name,
                  description: placesService.generateDescription(place),
                  category: placesService.mapPlaceTypeToCategory(place.types),
                  rating: place.rating.toFixed(1),
                  reviewCount: place.user_ratings_total || 0,
                  timeFromStart: placesService.generateTimeFromStart(),
                  imageUrl: imageUrl,
                  placeId: place.place_id,
                  address: place.formatted_address || place.vicinity || '',
                  isOpen: place.opening_hours?.open_now || null,
                  priceLevel: place.price_level || null
                };

                allPlaces.push(poi);
              } catch (error) {
                console.error(`Error processing place ${place.name}:`, error);
              }
            }
          }
        }

        console.log(`Found ${allPlaces.length} route-specific places for ${startCity} to ${endCity}`);
        return res.json(allPlaces);
      } else {
        console.log(`Unknown cities: ${startCity}, ${endCity}. Using general places.`);
        return await getGeneralPois(placesService, res);
      }
    } catch (error) {
      console.error("Error fetching route-relevant places:", error);
      return await getGeneralPois(placesService, res);
    }
  }

  async function getCheckpointPois(checkpoint: string, placesService: GooglePlacesService | null, res: any) {
    try {
      if (!placesService) {
        return res.status(503).json({ 
          message: "Google Places API key is required for checkpoint places" 
        });
      }

      console.log(`Fetching places for checkpoint: ${checkpoint}`);
      
      // Try to get coordinates for the checkpoint city
      const checkpointCoords = await placesService.geocodeCity(checkpoint);
      
      if (!checkpointCoords) {
        // Fall back to known city coordinates if geocoding fails
        const knownCities: { [key: string]: { lat: number; lng: number } } = {
          'austin': { lat: 30.2672, lng: -97.7431 },
          'dallas': { lat: 32.7767, lng: -96.7970 },
          'houston': { lat: 29.7604, lng: -95.3698 },
          'san antonio': { lat: 29.4241, lng: -98.4936 },
          'fort worth': { lat: 32.7555, lng: -97.3308 },
          'el paso': { lat: 31.7619, lng: -106.4850 },
          'amarillo': { lat: 35.2220, lng: -101.8313 },
          'lubbock': { lat: 33.5779, lng: -101.8552 },
          'waco': { lat: 31.5494, lng: -97.1467 },
          'corpus christi': { lat: 27.8006, lng: -97.3964 },
          'phoenix': { lat: 33.4484, lng: -112.0740 },
          'tucson': { lat: 32.2226, lng: -110.9747 },
          'flagstaff': { lat: 35.1983, lng: -111.6513 },
          'los angeles': { lat: 34.0522, lng: -118.2437 },
          'san francisco': { lat: 37.7749, lng: -122.4194 },
          'san diego': { lat: 32.7157, lng: -117.1611 },
          'sacramento': { lat: 38.5816, lng: -121.4944 },
          'fresno': { lat: 36.7378, lng: -119.7871 },
          'denver': { lat: 39.7392, lng: -104.9903 },
          'colorado springs': { lat: 38.8339, lng: -104.8214 },
          'las vegas': { lat: 36.1699, lng: -115.1398 },
          'reno': { lat: 39.5296, lng: -119.8138 },
          'albuquerque': { lat: 35.0844, lng: -106.6504 },
          'santa fe': { lat: 35.6870, lng: -105.9378 },
          'oklahoma city': { lat: 35.4676, lng: -97.5164 },
          'tulsa': { lat: 36.1540, lng: -95.9928 },
          'new orleans': { lat: 29.9511, lng: -90.0715 },
          'baton rouge': { lat: 30.4515, lng: -91.1871 },
          'atlanta': { lat: 33.7490, lng: -84.3880 },
          'savannah': { lat: 32.0835, lng: -81.0998 },
          'nashville': { lat: 36.1627, lng: -86.7816 },
          'memphis': { lat: 35.1495, lng: -90.0490 },
          'knoxville': { lat: 35.9606, lng: -83.9207 },
          'birmingham': { lat: 33.5186, lng: -86.8104 },
          'montgomery': { lat: 32.3617, lng: -86.2792 },
          'mobile': { lat: 30.6954, lng: -88.0399 },
          'jacksonville': { lat: 30.3322, lng: -81.6557 },
          'miami': { lat: 25.7617, lng: -80.1918 },
          'orlando': { lat: 28.5383, lng: -81.3792 },
          'tampa': { lat: 27.9506, lng: -82.4572 },
          'tallahassee': { lat: 30.4518, lng: -84.2807 },
          'charlotte': { lat: 35.2271, lng: -80.8431 },
          'raleigh': { lat: 35.7796, lng: -78.6382 },
          'charleston': { lat: 32.7765, lng: -79.9311 },
          'columbia': { lat: 34.0007, lng: -81.0348 },
          'new york': { lat: 40.7128, lng: -74.0060 },
          'new york city': { lat: 40.7128, lng: -74.0060 },
          'brooklyn': { lat: 40.6782, lng: -73.9442 },
          'queens': { lat: 40.7282, lng: -73.7949 },
          'manhattan': { lat: 40.7831, lng: -73.9712 },
          'bronx': { lat: 40.8448, lng: -73.8648 },
          'staten island': { lat: 40.5795, lng: -74.1502 },
          'boston': { lat: 42.3601, lng: -71.0589 },
          'philadelphia': { lat: 39.9526, lng: -75.1652 },
          'washington': { lat: 38.9072, lng: -77.0369 },
          'washington dc': { lat: 38.9072, lng: -77.0369 },
          'baltimore': { lat: 39.2904, lng: -76.6122 },
          'richmond': { lat: 37.5407, lng: -77.4360 },
          'virginia beach': { lat: 36.8529, lng: -75.9780 },
          'norfolk': { lat: 36.8508, lng: -76.2859 },
          'detroit': { lat: 42.3314, lng: -83.0458 },
          'cleveland': { lat: 41.4993, lng: -81.6944 },
          'cincinnati': { lat: 39.1031, lng: -84.5120 },
          'columbus': { lat: 39.9612, lng: -82.9988 },
          'pittsburgh': { lat: 40.4406, lng: -79.9959 },
          'buffalo': { lat: 42.8864, lng: -78.8784 },
          'rochester': { lat: 43.1566, lng: -77.6088 },
          'syracuse': { lat: 43.0481, lng: -76.1474 },
          'albany': { lat: 42.6526, lng: -73.7562 },
          'milwaukee': { lat: 43.0389, lng: -87.9065 },
          'madison': { lat: 43.0731, lng: -89.4012 },
          'minneapolis': { lat: 44.9778, lng: -93.2650 },
          'saint paul': { lat: 44.9537, lng: -93.0900 },
          'des moines': { lat: 41.5868, lng: -93.6250 },
          'kansas city': { lat: 39.0997, lng: -94.5786 },
          'saint louis': { lat: 38.6270, lng: -90.1994 },
          'little rock': { lat: 34.7465, lng: -92.2896 },
          'jackson': { lat: 32.2988, lng: -90.1848 },
          'louisville': { lat: 38.2527, lng: -85.7585 },
          'indianapolis': { lat: 39.7684, lng: -86.1581 },
          'fort wayne': { lat: 41.0793, lng: -85.1394 }
        };
        
        const cityKey = checkpoint.toLowerCase().trim();
        const coords = knownCities[cityKey];
        
        if (!coords) {
          console.log(`Unknown checkpoint city: ${checkpoint}`);
          return res.json([]);
        }
        
        console.log(`Using known coordinates for ${checkpoint}: ${coords.lat}, ${coords.lng}`);
        const allPlaces: InsertPoi[] = [];
        
        // Search for places in the checkpoint city
        const types = ['restaurant', 'tourist_attraction', 'park', 'museum', 'shopping_mall'];
        
        for (const type of types) {
          const places = await placesService.searchNearbyPlaces(
            coords.lat, 
            coords.lng, 
            15000, // 15km radius for city-specific search
            type
          );
          
          // Convert Google Places to our POI format
          for (let j = 0; j < Math.min(places.length, 4); j++) {
            const place = places[j];
            
            if (!place.name || !place.rating) continue;
            
            // Skip if we already have this place
            if (allPlaces.some(p => p.placeId === place.place_id)) continue;
            
            let imageUrl = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
            
            if (place.photos && place.photos.length > 0) {
              imageUrl = await placesService.getPhotoUrl(place.photos[0].photo_reference);
            }
            
            const poi: InsertPoi = {
              name: place.name,
              description: placesService.generateDescription(place),
              category: placesService.mapPlaceTypeToCategory(place.types),
              rating: place.rating.toFixed(1),
              reviewCount: place.user_ratings_total || 0,
              timeFromStart: `In ${checkpoint}`,
              imageUrl: imageUrl,
              placeId: place.place_id,
              address: place.formatted_address || place.vicinity || '',
              isOpen: place.opening_hours?.open_now || null,
              priceLevel: place.price_level || null
            };
            
            allPlaces.push(poi);
          }
        }
        
        console.log(`Found ${allPlaces.length} places for checkpoint ${checkpoint}`);
        return res.json(allPlaces);
      }
      
      // Use geocoded coordinates if available
      const allPlaces: InsertPoi[] = [];
      const types = ['restaurant', 'tourist_attraction', 'park', 'museum', 'shopping_mall'];
      
      for (const type of types) {
        const places = await placesService.searchNearbyPlaces(
          checkpointCoords.lat, 
          checkpointCoords.lng, 
          15000, // 15km radius
          type
        );
        
        // Convert Google Places to our POI format
        for (let j = 0; j < Math.min(places.length, 4); j++) {
          const place = places[j];
          
          if (!place.name || !place.rating) continue;
          
          // Skip if we already have this place
          if (allPlaces.some(p => p.placeId === place.place_id)) continue;
          
          let imageUrl = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
          
          if (place.photos && place.photos.length > 0) {
            imageUrl = await placesService.getPhotoUrl(place.photos[0].photo_reference);
          }
          
          const poi: InsertPoi = {
            name: place.name,
            description: placesService.generateDescription(place),
            category: placesService.mapPlaceTypeToCategory(place.types),
            rating: place.rating.toFixed(1),
            reviewCount: place.user_ratings_total || 0,
            timeFromStart: `In ${checkpoint}`,
            imageUrl: imageUrl,
            placeId: place.place_id,
            address: place.formatted_address || place.vicinity || '',
            isOpen: place.opening_hours?.open_now || null,
            priceLevel: place.price_level || null
          };
          
          allPlaces.push(poi);
        }
      }
      
      console.log(`Found ${allPlaces.length} places for checkpoint ${checkpoint}`);
      return res.json(allPlaces);
      
    } catch (error) {
      console.error(`Error fetching checkpoint places for ${checkpoint}:`, error);
      return res.json([]);
    }
  }

  async function getGeneralPois(placesService: GooglePlacesService | null, res: any) {
    try {
      // Check if we already have POIs in storage
      let pois = await storage.getAllPois();
      
      // If no POIs and we have Google Places API, fetch real data
      if (pois.length === 0 && placesService) {
        console.log("Fetching general places from Google Places API...");
        
        // Fetch places from multiple locations along the sample route
        const allPlaces: InsertPoi[] = [];
        
        for (let i = 0; i < SAMPLE_ROUTE_COORDINATES.length; i += 2) {
          const coord = SAMPLE_ROUTE_COORDINATES[i];
          
          // Fetch different types of places
          const types = ['restaurant', 'tourist_attraction', 'park'];
          
          for (const type of types) {
            const places = await placesService.searchNearbyPlaces(
              coord.lat, 
              coord.lng, 
              30000, // 30km radius
              type
            );
            
            // Convert Google Places to our POI format
            for (let j = 0; j < Math.min(places.length, 2); j++) {
              const place = places[j];
              
              if (!place.name || !place.rating) continue;
              
              let imageUrl = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
              
              if (place.photos && place.photos.length > 0) {
                imageUrl = await placesService.getPhotoUrl(place.photos[0].photo_reference);
              }
              
              const poi: InsertPoi = {
                name: place.name,
                description: placesService.generateDescription(place),
                category: placesService.mapPlaceTypeToCategory(place.types),
                rating: place.rating.toFixed(1),
                reviewCount: place.user_ratings_total || 0,
                timeFromStart: placesService.generateTimeFromStart(),
                imageUrl: imageUrl,
                placeId: place.place_id,
                address: place.formatted_address || place.vicinity || null,
                priceLevel: place.price_level || null,
                isOpen: place.opening_hours?.open_now ?? null,
              };
              
              allPlaces.push(poi);
            }
          }
          
          // Small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Store the fetched places
        for (const poi of allPlaces) {
          await storage.createPoi(poi);
        }
        
        // Get the updated list
        pois = await storage.getAllPois();
        console.log(`Stored ${pois.length} general places from Google Places API`);
      }
      
      if (pois.length === 0) {
        return res.status(503).json({ 
          message: "No places data available. Please check if Google Places API key is configured." 
        });
      }

      res.json(pois);
    } catch (error) {
      console.error("Error fetching general POIs:", error);
      res.status(500).json({ message: "Failed to fetch places data" });
    }
  }

  // Get POI by ID
  app.get("/api/pois/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid POI ID" });
      }

      const poi = await storage.getPoiById(id);
      if (!poi) {
        return res.status(404).json({ message: "POI not found" });
      }

      res.json(poi);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch POI" });
    }
  });

  // ===== INTERESTS MANAGEMENT ENDPOINTS =====

  // Get all available interest categories
  app.get("/api/interests/categories", async (req, res) => {
    try {
      const categories = await interestsService.getInterestCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching interest categories:", error);
      res.status(500).json({ message: "Failed to fetch interest categories" });
    }
  });

  // Get user's interests (requires authentication)
  app.get("/api/users/:id/interests", 
    AuthMiddleware.authenticate,
    validateSchema(userIdParamSchema, 'params'),
    checkUserOwnership,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const interests = await interestsService.getUserInterests(userId);
        res.json(interests);
      } catch (error) {
        console.error("Error fetching user interests:", error);
        res.status(500).json({ message: "Failed to fetch user interests" });
      }
    }
  );

  // Update user's interests (requires authentication)
  app.put("/api/users/:id/interests", 
    AuthMiddleware.authenticate,
    validateSchema(userIdParamSchema, 'params'),
    validateSchema(updateUserInterestsSchema, 'body'),
    checkUserOwnership,
    validateInterestCategories(),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { interests, enableAll } = req.body;

        let updatedInterests;
        if (enableAll === true) {
          updatedInterests = await interestsService.enableAllInterestsForUser(userId);
        } else {
          updatedInterests = await interestsService.updateUserInterests(userId, interests);
        }

        res.json(updatedInterests);
      } catch (error) {
        console.error("Error updating user interests:", error);
        res.status(500).json({ message: "Failed to update user interests" });
      }
    }
  );

  // Get suggested trips based on user interests (requires authentication)
  app.get("/api/trips/suggested", 
    AuthMiddleware.authenticate,
    validateSchema(suggestedTripsQuerySchema, 'query'),
    rateLimitSuggestedTrips(),
    async (req, res) => {
      try {
        const userId = (req as any).user?.id;
        const limit = parseInt(req.query.limit as string) || 5;

        const suggestedTrips = await suggestedTripsService.getSuggestedTripsWithRateLimit(userId, limit);
        res.json(suggestedTrips);
      } catch (error) {
        console.error("Error fetching suggested trips:", error);
        res.status(500).json({ message: "Failed to fetch suggested trips" });
      }
    }
  );

  // Get specific suggested trip by ID
  app.get("/api/trips/suggested/:id", 
    AuthMiddleware.optionalAuth,
    validateSchema(tripIdParamSchema, 'params'),
    async (req, res) => {
      try {
        const tripId = req.params.id;
        const userId = (req as any).user?.id; // Optional for anonymous users
        
        const trip = await suggestedTripsService.getSuggestedTripById(tripId, userId);
        
        if (!trip) {
          return res.status(404).json({ message: "Suggested trip not found" });
        }

        res.json(trip);
      } catch (error) {
        console.error("Error fetching suggested trip:", error);
        res.status(500).json({ message: "Failed to fetch suggested trip" });
      }
    }
  );

  // ===== ROUTE CALCULATION ENDPOINT =====

  // Calculate route from wizard data
  app.post("/api/route", async (req, res) => {
    try {
      const { startLocation, endLocation, stops } = req.body;
      
      // Validate required fields
      if (!startLocation || !endLocation) {
        return res.status(400).json({ message: "Start and end locations are required" });
      }

      // For now, return a simple route response that matches what the wizard expects
      // In a real implementation, this would call Google Directions API
      const routeData = {
        startCity: startLocation,
        endCity: endLocation,
        distance: "unknown",
        duration: "unknown",
        stops: stops || [],
        coordinates: SAMPLE_ROUTE_COORDINATES, // Use sample coordinates for now
      };

      res.json(routeData);
    } catch (error) {
      console.error("Error calculating route:", error);
      res.status(500).json({ message: "Route calculation failed" });
    }
  });

  // ===== TRIP MANAGEMENT ENDPOINTS =====

  // Create a trip (requires authentication or allows anonymous public trips)
  app.post("/api/trips", async (req, res) => {
    try {
      const { title, startCity, endCity, checkpoints, routeData, poisData, isPublic } = req.body;
      
      // Validate required fields
      if (!startCity || !endCity) {
        return res.status(400).json({ message: "Start city and end city are required" });
      }

      // Get user ID from authenticated request (may be null for anonymous users)
      const userId = (req as any).user?.id || null;
      
      // Anonymous users can only create public trips
      if (!userId && !isPublic) {
        return res.status(401).json({ message: "Authentication required for private trips" });
      }

      const tripData = {
        userId,
        title: title || tripService.generateTripTitle(startCity, endCity, checkpoints || []),
        startCity,
        endCity,
        checkpoints: checkpoints || [],
        routeData: routeData || null,
        poisData: poisData || [],
        isPublic: isPublic || false
      };

      const trip = await tripService.createTrip(tripData);
      res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  // Get trip by ID (public trips or user's own trips)
  app.get("/api/trips/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }

      const userId = (req as any).user?.id;
      let trip;

      if (userId) {
        // Authenticated user - can see their own trips or public trips
        trip = await tripService.getTripById(id, userId);
        if (!trip) {
          trip = await tripService.getPublicTripById(id);
        }
      } else {
        // Anonymous user - can only see public trips
        trip = await tripService.getPublicTripById(id);
      }

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  // Get user's trips (requires authentication)
  app.get("/api/trips", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const trips = await tripService.getUserTrips(userId, limit);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching user trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  // Get public trips
  app.get("/api/trips/public/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const trips = await tripService.getPublicTrips(limit);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching public trips:", error);
      res.status(500).json({ message: "Failed to fetch public trips" });
    }
  });

  // Update trip (requires authentication and ownership)
  app.put("/api/trips/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const updateData = req.body;
      const trip = await tripService.updateTrip(id, userId, updateData);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found or access denied" });
      }

      res.json(trip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(500).json({ message: "Failed to update trip" });
    }
  });

  // Delete trip (requires authentication and ownership)
  app.delete("/api/trips/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const deleted = await tripService.deleteTrip(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Trip not found or access denied" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // Search trips
  app.get("/api/trips/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const userId = (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const trips = await tripService.searchTrips(query, userId, limit);
      res.json(trips);
    } catch (error) {
      console.error("Error searching trips:", error);
      res.status(500).json({ message: "Failed to search trips" });
    }
  });

  // Save current route as trip (convenience endpoint)
  app.post("/api/trips/save-route", async (req, res) => {
    try {
      const { startCity, endCity, checkpoints, routeData, poisData, isPublic, title } = req.body;
      
      if (!startCity || !endCity) {
        return res.status(400).json({ message: "Start city and end city are required" });
      }

      const userId = (req as any).user?.id || null;
      
      // Anonymous users can only create public trips
      if (!userId && !isPublic) {
        return res.status(401).json({ message: "Authentication required for private trips" });
      }

      const trip = await tripService.createTripFromRoute(
        userId,
        startCity,
        endCity,
        checkpoints || [],
        routeData,
        poisData || [],
        isPublic || false
      );

      if (!trip) {
        return res.status(400).json({ message: "Failed to create trip" });
      }

      res.status(201).json(trip);
    } catch (error) {
      console.error("Error saving route as trip:", error);
      res.status(500).json({ message: "Failed to save route as trip" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
