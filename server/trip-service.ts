import { db } from "./storage";
import { trips, users } from "@shared/schema";
import type { InsertTrip, UpdateTrip, Trip } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export class TripService {
  // Create a new trip
  async createTrip(tripData: InsertTrip): Promise<Trip> {
    const result = await db.insert(trips).values({
      ...tripData,
      updatedAt: new Date()
    }).returning();
    
    return result[0];
  }

  // Get trip by ID
  async getTripById(id: number, userId?: number): Promise<Trip | null> {
    const conditions = [eq(trips.id, id)];
    
    // If userId is provided, only return if trip belongs to user or is public
    if (userId !== undefined) {
      conditions.push(
        and(
          eq(trips.userId, userId)
        ) as any
      );
    }
    
    const result = await db.select().from(trips).where(and(...conditions));
    return result[0] || null;
  }

  // Get public trip by ID (no auth required)
  async getPublicTripById(id: number): Promise<Trip | null> {
    const result = await db.select()
      .from(trips)
      .where(and(eq(trips.id, id), eq(trips.isPublic, true)));
    
    return result[0] || null;
  }

  // Get all trips for a user
  async getUserTrips(userId: number, limit: number = 50): Promise<Trip[]> {
    const result = await db.select()
      .from(trips)
      .where(eq(trips.userId, userId))
      .orderBy(desc(trips.updatedAt))
      .limit(limit);
    
    return result;
  }

  // Get recent public trips
  async getPublicTrips(limit: number = 20): Promise<Trip[]> {
    const result = await db.select()
      .from(trips)
      .where(eq(trips.isPublic, true))
      .orderBy(desc(trips.createdAt))
      .limit(limit);
    
    return result;
  }

  // Update trip
  async updateTrip(id: number, userId: number, updateData: UpdateTrip): Promise<Trip | null> {
    const result = await db.update(trips)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(eq(trips.id, id), eq(trips.userId, userId)))
      .returning();
    
    return result[0] || null;
  }

  // Delete trip
  async deleteTrip(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(trips)
      .where(and(eq(trips.id, id), eq(trips.userId, userId)))
      .returning();
    
    return result.length > 0;
  }

  // Search trips by title or cities
  async searchTrips(query: string, userId?: number, limit: number = 20): Promise<Trip[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    
    // Base query for public trips
    let baseQuery = db.select().from(trips).where(eq(trips.isPublic, true));
    
    // If userId provided, also include their private trips
    if (userId !== undefined) {
      baseQuery = db.select().from(trips).where(
        and(
          eq(trips.userId, userId)
        ) as any
      );
    }
    
    // Add text search (simplified - would need full-text search for production)
    const result = await baseQuery
      .orderBy(desc(trips.updatedAt))
      .limit(limit);
    
    // Filter by search terms (in-memory for now)
    return result.filter(trip => 
      trip.title.toLowerCase().includes(query.toLowerCase()) ||
      trip.startCity.toLowerCase().includes(query.toLowerCase()) ||
      trip.endCity.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Generate trip title based on route
  generateTripTitle(startCity: string, endCity: string, checkpoints: string[] = []): string {
    if (checkpoints.length === 0) {
      return `${startCity} to ${endCity}`;
    } else if (checkpoints.length === 1) {
      return `${startCity} to ${endCity} via ${checkpoints[0]}`;
    } else {
      return `${startCity} to ${endCity} via ${checkpoints.length} stops`;
    }
  }

  // Create trip from route data
  async createTripFromRoute(
    userId: number | null,
    startCity: string,
    endCity: string,
    checkpoints: string[],
    routeData: any,
    poisData: any[],
    isPublic: boolean = false
  ): Promise<Trip | null> {
    // If no user ID, can only create public trips
    if (userId === null && !isPublic) {
      return null;
    }

    const title = this.generateTripTitle(startCity, endCity, checkpoints);
    
    const tripData: InsertTrip = {
      userId,
      title,
      startCity,
      endCity,
      checkpoints,
      routeData,
      poisData,
      isPublic
    };

    return await this.createTrip(tripData);
  }
}

export const tripService = new TripService();