import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
}

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: GooglePlacePhoto[];
  types: string[];
  opening_hours?: {
    open_now?: boolean;
  };
}

interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
  next_page_token?: string;
}

export class GooglePlacesService {
  private apiKey: string;
  private baseUrl = "https://maps.googleapis.com/maps/api/place";
  private geocodingUrl = "https://maps.googleapis.com/maps/api/geocode/json";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocodeCity(
    cityName: string
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      // Add more specific location formatting for better geocoding results
      const formattedCity = cityName.includes(",")
        ? cityName
        : `${cityName}, USA`;
      const response = await fetch(
        `${this.geocodingUrl}?address=${encodeURIComponent(
          formattedCity
        )}&key=${this.apiKey}`
      );
      const data = await response.json();
      fs.writeFileSync(
        path.join(__dirname, "geocode.mock.json"),
        JSON.stringify(data, null, 2)
      );
      console.log(`Geocoding ${formattedCity}: status = ${data.status}`);

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log(`Found coordinates: ${location.lat}, ${location.lng}`);
        return { lat: location.lat, lng: location.lng };
      } else {
        console.error(
          `Geocoding failed for ${formattedCity}:`,
          data.status,
          data.error_message
        );
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  generateRoutePoints(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    numPoints: number = 5
  ): Array<{ lat: number; lng: number }> {
    const points = [];

    for (let i = 0; i <= numPoints; i++) {
      const ratio = i / numPoints;
      const lat = start.lat + (end.lat - start.lat) * ratio;
      const lng = start.lng + (end.lng - start.lng) * ratio;
      points.push({ lat, lng });
    }

    return points;
  }

  async searchNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 50000,
    type?: string
  ): Promise<GooglePlace[]> {
    const url = `${this.baseUrl}/nearbysearch/json`;
    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: radius.toString(),
      key: this.apiKey,
    });

    if (type) {
      params.append("type", type);
    }

    try {
      const response = await fetch(`${url}?${params}`);
      const data: GooglePlacesResponse = await response.json();

      fs.writeFileSync(
        path.join(__dirname, "google-places-nearby.mock.json"),
        JSON.stringify(data, null, 2)
      );
      if (data.status !== "OK") {
        console.error("Google Places API error:", data.status);
        return [];
      }

      return data.results;
    } catch (error) {
      console.error("Error fetching places:", error);
      return [];
    }
  }

  async getPhotoUrl(
    photoReference: string,
    maxWidth: number = 800
  ): Promise<string> {
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }

  mapPlaceTypeToCategory(types: string[]): string {
    // Priority order for mapping types to our categories
    const typeMapping: Record<string, string> = {
      restaurant: "restaurant",
      food: "restaurant",
      meal_takeaway: "restaurant",
      meal_delivery: "restaurant",
      park: "park",
      natural_feature: "scenic",
      tourist_attraction: "attraction",
      amusement_park: "attraction",
      zoo: "attraction",
      museum: "historic",
      church: "historic",
      synagogue: "historic",
      hindu_temple: "historic",
      mosque: "historic",
      cemetery: "historic",
      shopping_mall: "market",
      store: "market",
      supermarket: "market",
    };

    // Find the first matching type in priority order
    for (const type of types) {
      if (typeMapping[type]) {
        return typeMapping[type];
      }
    }

    // Default fallback
    return "attraction";
  }

  generateTimeFromStart(): string {
    const hours = Math.floor(Math.random() * 8) + 1; // 1-8 hours
    const minutes = Math.floor(Math.random() * 6) * 10; // 0, 10, 20, 30, 40, 50 minutes

    if (minutes === 0) {
      return `${hours} hour${hours === 1 ? "" : "s"} in`;
    } else {
      return `${hours}.${minutes / 10} hours in`;
    }
  }

  generateDescription(place: GooglePlace): string {
    const category = this.mapPlaceTypeToCategory(place.types);
    const descriptions: Record<string, string[]> = {
      restaurant: [
        "A highly-rated dining spot perfect for a meal break during your journey.",
        "Local favorite restaurant offering delicious food and a welcoming atmosphere.",
        "Great place to refuel with quality food and friendly service.",
        "Popular eatery known for fresh ingredients and excellent service.",
      ],
      park: [
        "Beautiful natural area perfect for stretching your legs and enjoying nature.",
        "Scenic park offering walking trails and peaceful surroundings.",
        "Great spot for a relaxing break with beautiful outdoor scenery.",
        "Natural retreat perfect for photos and a breath of fresh air.",
      ],
      attraction: [
        "Must-see attraction that offers unique experiences and photo opportunities.",
        "Popular destination perfect for exploring and creating memories.",
        "Interesting attraction worth the stop for its unique character.",
        "Notable landmark that adds excitement to your road trip adventure.",
      ],
      scenic: [
        "Breathtaking natural beauty perfect for photography and sightseeing.",
        "Stunning natural landmark offering spectacular views and photo ops.",
        "Scenic wonder that showcases the natural beauty of the area.",
        "Picture-perfect location with incredible views and peaceful atmosphere.",
      ],
      market: [
        "Local shopping destination perfect for finding unique items and souvenirs.",
        "Great place to browse local goods and pick up travel essentials.",
        "Shopping spot offering local products and interesting finds.",
        "Market area perfect for exploring local culture and shopping.",
      ],
      historic: [
        "Historic site rich in culture and history, perfect for learning and exploration.",
        "Important historical landmark offering insights into local heritage.",
        "Cultural treasure that tells the story of the area's past.",
        "Significant historical site worth visiting for its cultural value.",
      ],
    };

    const categoryDescriptions =
      descriptions[category] || descriptions.attraction;
    return categoryDescriptions[
      Math.floor(Math.random() * categoryDescriptions.length)
    ];
  }
}

// Coordinates for a route from San Francisco to Los Angeles (sample route)
export const SAMPLE_ROUTE_COORDINATES = [
  { lat: 37.7749, lng: -122.4194, name: "San Francisco, CA" },
  { lat: 37.4419, lng: -122.143, name: "Palo Alto, CA" },
  { lat: 36.9741, lng: -122.0308, name: "Santa Cruz, CA" },
  { lat: 36.6177, lng: -121.9166, name: "Monterey, CA" },
  { lat: 35.687, lng: -121.3381, name: "Paso Robles, CA" },
  { lat: 35.2828, lng: -120.6596, name: "San Luis Obispo, CA" },
  { lat: 34.9213, lng: -120.4357, name: "Santa Maria, CA" },
  { lat: 34.4208, lng: -119.6982, name: "Santa Barbara, CA" },
  { lat: 34.2689, lng: -118.7815, name: "Thousand Oaks, CA" },
  { lat: 34.0522, lng: -118.2437, name: "Los Angeles, CA" },
];
