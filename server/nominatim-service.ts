// server/nominatim-service.ts
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { saveMockResponse } from "./saveMockResponse";
import { cacheService, CacheService } from "./cache-service";

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NominatimPlace {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: string[];
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export class NominatimService {
  private baseUrl = "https://nominatim.openstreetmap.org";
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 second between requests (respectful rate limiting)
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (city data is very stable)

  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  async searchPlaces(
    query: string,
    limit: number = 10
  ): Promise<PlaceSuggestion[]> {
    if (query.length < 2) {
      return [];
    }

    await this.respectRateLimit();

    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: limit.toString(),
        countrycodes: "us,ca", // Focus on US and Canada for road trips
        "accept-language": "en",
        featuretype: "city",
        // Focus on cities, towns, villages
        layer: "address",
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          "User-Agent": "RouteWise/1.0 (roadtrip-planner)", // Required by Nominatim
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data: NominatimPlace[] = await response.json();
      console.log(data);
      saveMockResponse("nominatim-search-places.mock.json", data);
      return this.transformToSuggestions(data);
    } catch (error) {
      console.error("Nominatim search error:", error);
      return [];
    }
  }

  private transformToSuggestions(places: NominatimPlace[]): PlaceSuggestion[] {
    return places
      .filter((place) => {
        // Focus on populated places (cities, towns, villages)
        const validTypes = [
          "city",
          "town",
          "village",
          "hamlet",
          "administrative",
        ];
        return validTypes.some(
          (type) =>
            place.type === type ||
            place.class === "place" ||
            place.class === "boundary"
        );
      })
      .map((place) => {
        const addressParts = place.display_name.split(", ");
        const mainText = addressParts[0]; // City name
        const secondaryText = addressParts.slice(1, 3).join(", "); // State, Country

        return {
          place_id: place.place_id.toString(),
          description: place.display_name,
          main_text: mainText,
          secondary_text: secondaryText,
          coordinates: {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
          },
        };
      })
      .slice(0, 8); // Limit to 8 suggestions for better UX
  }

  // Alternative method for more precise city searches
  async searchCities(
    query: string,
    limit: number = 8
  ): Promise<PlaceSuggestion[]> {
    if (query.length < 2) {
      return [];
    }

    const cacheKey = CacheService.generateCacheKey("nominatim:searchCities", query, limit);

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        await this.respectRateLimit();

        try {
          // More specific search for cities
          const params = new URLSearchParams({
            q: `${query} city`,
            format: "json",
            addressdetails: "1",
            limit: (limit * 2).toString(), // Get more results to filter
            countrycodes: "us,ca",
            "accept-language": "en",
            class: "place",
            type: "city,town,village",
          });

          const response = await fetch(`${this.baseUrl}/search?${params}`, {
            headers: {
              "User-Agent": "RouteWise/1.0 (roadtrip-planner)",
            },
          });

          if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status}`);
          }

          const data: NominatimPlace[] = await response.json();

          fs.writeFileSync(
            path.join(__dirname, "nominatim-search-cities.mock.json"),
            JSON.stringify(data, null, 2)
          );
          
          // Filter and rank results
          const suggestions = this.transformToSuggestions(data);

          // Sort by importance and relevance
          return suggestions
            .sort((a, b) => {
              // Prioritize exact matches at the beginning
              const aStartsWithQuery = a.main_text
                .toLowerCase()
                .startsWith(query.toLowerCase());
              const bStartsWithQuery = b.main_text
                .toLowerCase()
                .startsWith(query.toLowerCase());

              if (aStartsWithQuery && !bStartsWithQuery) return -1;
              if (!aStartsWithQuery && bStartsWithQuery) return 1;

              return 0;
            })
            .slice(0, limit);
        } catch (error) {
          console.error("Nominatim city search error:", error);
          return [];
        }
      },
      { ttl: this.CACHE_DURATION }
    );
  }
}
