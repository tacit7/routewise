import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DirectionsLeg {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_address: string;
  end_location: {
    lat: number;
    lng: number;
  };
  start_address: string;
  start_location: {
    lat: number;
    lng: number;
  };
  steps: DirectionsStep[];
}

interface DirectionsStep {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  html_instructions: string;
  polyline: {
    points: string;
  };
  start_location: {
    lat: number;
    lng: number;
  };
  travel_mode: string;
}

interface DirectionsRoute {
  legs: DirectionsLeg[];
  overview_polyline: {
    points: string;
  };
  summary: string;
  warnings: string[];
  waypoint_order: number[];
}

interface DirectionsResponse {
  routes: DirectionsRoute[];
  status: string;
  error_message?: string;
}

export interface RouteResult {
  distance: string;
  duration: string;
  start_address: string;
  end_address: string;
  polyline: string;
  legs: {
    distance: string;
    duration: string;
    start_address: string;
    end_address: string;
    start_location: { lat: number; lng: number };
    end_location: { lat: number; lng: number };
  }[];
  route_points: { lat: number; lng: number }[];
}

export class GoogleDirectionsService {
  private apiKey: string;
  private baseUrl = "https://maps.googleapis.com/maps/api/directions/json";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async calculateRoute(
    origin: string,
    destination: string,
    travelMode: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT" = "DRIVING"
  ): Promise<RouteResult | null> {
    try {
      const params = new URLSearchParams({
        origin: origin,
        destination: destination,
        mode: travelMode.toLowerCase(),
        key: this.apiKey,
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data: DirectionsResponse = await response.json();

      fs.writeFileSync(
        path.join(__dirname, "google-directions-route.mock.json"),
        JSON.stringify(data, null, 2)
      );
      if (data.status !== "OK") {
        console.error(
          "Google Directions API error:",
          data.status,
          data.error_message
        );
        return null;
      }

      if (data.routes.length === 0) {
        console.error("No routes found");
        return null;
      }

      const route = data.routes[0];
      const leg = route.legs[0]; // For simple origin-destination routes

      // Extract route points for POI searching
      const routePoints = this.extractRoutePoints(route, 10);

      const result: RouteResult = {
        distance: leg.distance.text,
        duration: leg.duration.text,
        start_address: leg.start_address,
        end_address: leg.end_address,
        polyline: route.overview_polyline.points,
        legs: route.legs.map((leg) => ({
          distance: leg.distance.text,
          duration: leg.duration.text,
          start_address: leg.start_address,
          end_address: leg.end_address,
          start_location: leg.start_location,
          end_location: leg.end_location,
        })),
        route_points: routePoints,
      };

      return result;
    } catch (error) {
      console.error("Error calculating route:", error);
      return null;
    }
  }

  /**
   * Extract evenly spaced points along the route for POI searching
   */
  private extractRoutePoints(
    route: DirectionsRoute,
    numPoints: number = 10
  ): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [];

    // Simple approach: extract points from legs
    for (const leg of route.legs) {
      points.push(leg.start_location);

      // Add intermediate points from steps
      const stepInterval = Math.max(
        1,
        Math.floor(leg.steps.length / (numPoints / route.legs.length))
      );
      for (let i = 0; i < leg.steps.length; i += stepInterval) {
        const step = leg.steps[i];
        points.push(step.start_location);
      }

      points.push(leg.end_location);
    }

    // Remove duplicates and limit to numPoints
    const uniquePoints = points.filter(
      (point, index, arr) =>
        index === 0 ||
        Math.abs(point.lat - arr[index - 1].lat) > 0.01 ||
        Math.abs(point.lng - arr[index - 1].lng) > 0.01
    );

    // Evenly distribute points if we have too many
    if (uniquePoints.length > numPoints) {
      const interval = uniquePoints.length / numPoints;
      const selectedPoints: { lat: number; lng: number }[] = [];
      for (let i = 0; i < numPoints; i++) {
        const index = Math.floor(i * interval);
        selectedPoints.push(uniquePoints[index]);
      }
      return selectedPoints;
    }

    return uniquePoints;
  }

  /**
   * Calculate if a point is within a certain distance/time from the route
   */
  async isWithinDetourLimit(
    routePolyline: string,
    point: { lat: number; lng: number },
    maxDetourMinutes: number = 60
  ): Promise<boolean> {
    try {
      // For now, use simple distance calculation
      // In production, you'd want to use the Distance Matrix API

      // This is a simplified check - in reality you'd want to:
      // 1. Find the closest point on the route to the POI
      // 2. Calculate actual driving time to the POI and back to the route
      // 3. Compare against maxDetourMinutes

      return true; // Placeholder - implement proper logic based on requirements
    } catch (error) {
      console.error("Error checking detour limit:", error);
      return false;
    }
  }

  /**
   * Calculate estimated travel time between two points
   */
  async calculateTravelTime(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ duration: string; distance: string } | null> {
    try {
      const params = new URLSearchParams({
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: "driving",
        key: this.apiKey,
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data: DirectionsResponse = await response.json();

      fs.writeFileSync(
        path.join(__dirname, "google-directions-travel-time.mock.json"),
        JSON.stringify(data, null, 2)
      );
      if (data.status === "OK" && data.routes.length > 0) {
        const leg = data.routes[0].legs[0];
        return {
          duration: leg.duration.text,
          distance: leg.distance.text,
        };
      }

      return null;
    } catch (error) {
      console.error("Error calculating travel time:", error);
      return null;
    }
  }
}
