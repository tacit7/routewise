import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GooglePlacesService, SAMPLE_ROUTE_COORDINATES } from "./google-places";
import type { InsertPoi } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  let placesService: GooglePlacesService | null = null;

  if (googleApiKey) {
    placesService = new GooglePlacesService(googleApiKey);
  }

  // Get POIs for a specific route
  app.get("/api/pois", async (req, res) => {
    const { start, end } = req.query;
    
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
      
      // Get coordinates for start and end cities
      const startCoords = await placesService.geocodeCity(startCity);
      const endCoords = await placesService.geocodeCity(endCity);
      
      if (!startCoords || !endCoords) {
        return res.status(400).json({ 
          message: "Could not find coordinates for one or both cities" 
        });
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

  const httpServer = createServer(app);
  return httpServer;
}
