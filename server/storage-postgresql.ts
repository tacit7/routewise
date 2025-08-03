import { 
  users, 
  pois, 
  interestCategories,
  userInterests,
  trips,
  type User, 
  type InsertUser, 
  type Poi, 
  type InsertPoi,
  type InterestCategory,
  type InsertInterestCategory,
  type UserInterest,
  type InsertUserInterest,
  type UpdateUserInterest,
  type Trip,
  type InsertTrip,
  type UpdateTrip
} from "@shared/schema";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and, inArray, desc, like, or, sql } from "drizzle-orm";
import postgres from "postgres";
import { log } from "./logger";
import type { IStorage } from "./storage";

/**
 * Enhanced PostgreSQL storage implementation with connection pooling,
 * proper error handling, and performance optimizations
 */
export class PostgreSQLStorage implements IStorage {
  private db: PostgresJsDatabase;
  private client: postgres.Sql;
  private isConnected: boolean = false;
  private connectionRetries: number = 0;
  private readonly maxRetries: number = 5;
  private readonly retryDelay: number = 2000; // 2 seconds

  constructor(connectionString?: string) {
    const dbUrl = connectionString || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL is required for PostgreSQL storage');
    }

    // Configure connection with pooling and timeouts
    this.client = postgres(dbUrl, {
      max: 10, // Maximum number of connections in pool
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout in seconds
      prepare: false, // Disable prepared statements for compatibility
      onnotice: () => {}, // Disable notice logging
      transform: {
        undefined: null // Transform undefined to null for database
      }
    });

    this.db = drizzle(this.client);
    this.initializeConnection();
  }

  /**
   * Initialize database connection with retry logic
   */
  private async initializeConnection(): Promise<void> {
    try {
      // Test connection
      await this.client`SELECT 1`;
      this.isConnected = true;
      this.connectionRetries = 0;
      
      log.info('PostgreSQL connection established successfully');
      
      // Initialize default data if needed
      await this.initializeDefaultData();
      
    } catch (error) {
      this.isConnected = false;
      this.connectionRetries++;
      
      log.error('PostgreSQL connection failed', error, {
        attempt: this.connectionRetries,
        maxRetries: this.maxRetries
      });

      if (this.connectionRetries < this.maxRetries) {
        log.info(`Retrying PostgreSQL connection in ${this.retryDelay}ms...`);
        setTimeout(() => this.initializeConnection(), this.retryDelay);
      } else {
        throw new Error(`Failed to connect to PostgreSQL after ${this.maxRetries} attempts`);
      }
    }
  }

  /**
   * Initialize default interest categories if they don't exist
   */
  private async initializeDefaultData(): Promise<void> {
    try {
      const existingCategories = await this.db.select().from(interestCategories).limit(1);
      
      if (existingCategories.length === 0) {
        log.info('Initializing default interest categories');
        
        const defaultCategories = [
          { 
            name: 'restaurants', 
            displayName: 'Restaurants', 
            description: 'Dining establishments and food venues',
            iconName: 'utensils',
            isActive: true 
          },
          { 
            name: 'attractions', 
            displayName: 'Tourist Attractions', 
            description: 'Must-see attractions and points of interest',
            iconName: 'camera',
            isActive: true 
          },
          { 
            name: 'parks', 
            displayName: 'Parks & Nature', 
            description: 'Parks, gardens, and natural areas',
            iconName: 'tree',
            isActive: true 
          },
          { 
            name: 'scenic_spots', 
            displayName: 'Scenic Spots', 
            description: 'Beautiful views and scenic locations',
            iconName: 'mountain',
            isActive: true 
          },
          { 
            name: 'historic_sites', 
            displayName: 'Historic Sites', 
            description: 'Historical landmarks and cultural sites',
            iconName: 'landmark',
            isActive: true 
          },
          { 
            name: 'markets', 
            displayName: 'Markets & Shopping', 
            description: 'Shopping areas, markets, and stores',
            iconName: 'shopping-bag',
            isActive: true 
          },
          { 
            name: 'outdoor_activities', 
            displayName: 'Outdoor Activities', 
            description: 'Outdoor recreation and adventure spots',
            iconName: 'hiking',
            isActive: true 
          },
          { 
            name: 'cultural_sites', 
            displayName: 'Cultural Sites', 
            description: 'Museums, galleries, and cultural venues',
            iconName: 'palette',
            isActive: true 
          },
          { 
            name: 'shopping', 
            displayName: 'Shopping Centers', 
            description: 'Malls, retail centers, and shopping districts',
            iconName: 'store',
            isActive: true 
          },
          { 
            name: 'nightlife', 
            displayName: 'Nightlife & Entertainment', 
            description: 'Bars, clubs, and entertainment venues',
            iconName: 'music',
            isActive: true 
          }
        ];

        await this.db.insert(interestCategories).values(defaultCategories);
        log.info(`Initialized ${defaultCategories.length} default interest categories`);
      }
    } catch (error) {
      log.error('Failed to initialize default data', error);
      throw error;
    }
  }

  /**
   * Health check for database connectivity
   */
  async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.client`SELECT 1`;
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Execute database operation with error handling and logging
   */
  private async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<T>,
    meta?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      if (!this.isConnected) {
        throw new Error('Database connection not available');
      }

      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      log.database(operation, undefined, duration, meta);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(`Database operation failed: ${operation}`, error, { 
        operation, 
        duration, 
        ...meta 
      });
      throw error;
    }
  }

  // ===== USER MANAGEMENT =====

  async getUser(id: number): Promise<User | undefined> {
    return this.executeQuery('getUser', async () => {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      return result[0];
    }, { userId: id });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.executeQuery('getUserByUsername', async () => {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username.toLowerCase()))
        .limit(1);
      
      return result[0];
    }, { username });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.executeQuery('getUserByEmail', async () => {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      
      return result[0];
    }, { email });
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return this.executeQuery('getUserByGoogleId', async () => {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.googleId, googleId))
        .limit(1);
      
      return result[0];
    }, { googleId });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return this.executeQuery('createUser', async () => {
      const result = await this.db
        .insert(users)
        .values({
          ...insertUser,
          username: insertUser.username.toLowerCase(),
          email: insertUser.email?.toLowerCase(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .returning();
      
      return result[0];
    }, { username: insertUser.username });
  }

  async linkGoogleAccount(userId: number, googleId: string): Promise<void> {
    await this.executeQuery('linkGoogleAccount', async () => {
      await this.db
        .update(users)
        .set({ 
          googleId, 
          updatedAt: new Date().toISOString() 
        })
        .where(eq(users.id, userId));
    }, { userId, googleId });
  }

  // ===== POI MANAGEMENT =====

  async getAllPois(): Promise<Poi[]> {
    return this.executeQuery('getAllPois', async () => {
      return await this.db
        .select()
        .from(pois)
        .orderBy(desc(pois.rating));
    });
  }

  async getPoiById(id: number): Promise<Poi | undefined> {
    return this.executeQuery('getPoiById', async () => {
      const result = await this.db
        .select()
        .from(pois)
        .where(eq(pois.id, id))
        .limit(1);
      
      return result[0];
    }, { poiId: id });
  }

  async createPoi(insertPoi: InsertPoi): Promise<Poi> {
    return this.executeQuery('createPoi', async () => {
      const result = await this.db
        .insert(pois)
        .values(insertPoi)
        .returning();
      
      return result[0];
    }, { name: insertPoi.name });
  }

  async createManyPois(insertPois: InsertPoi[]): Promise<Poi[]> {
    return this.executeQuery('createManyPois', async () => {
      if (insertPois.length === 0) return [];
      
      return await this.db
        .insert(pois)
        .values(insertPois)
        .returning();
    }, { count: insertPois.length });
  }

  // ===== INTEREST CATEGORIES =====

  async getAllInterestCategories(): Promise<InterestCategory[]> {
    return this.executeQuery('getAllInterestCategories', async () => {
      return await this.db
        .select()
        .from(interestCategories)
        .where(eq(interestCategories.isActive, true))
        .orderBy(interestCategories.displayName);
    });
  }

  async getInterestCategoryById(id: number): Promise<InterestCategory | undefined> {
    return this.executeQuery('getInterestCategoryById', async () => {
      const result = await this.db
        .select()
        .from(interestCategories)
        .where(eq(interestCategories.id, id))
        .limit(1);
      
      return result[0];
    }, { categoryId: id });
  }

  async getInterestCategoryByName(name: string): Promise<InterestCategory | undefined> {
    return this.executeQuery('getInterestCategoryByName', async () => {
      const result = await this.db
        .select()
        .from(interestCategories)
        .where(eq(interestCategories.name, name))
        .limit(1);
      
      return result[0];
    }, { categoryName: name });
  }

  async createInterestCategory(insertCategory: InsertInterestCategory): Promise<InterestCategory> {
    return this.executeQuery('createInterestCategory', async () => {
      const result = await this.db
        .insert(interestCategories)
        .values({
          ...insertCategory,
          createdAt: new Date()
        })
        .returning();
      
      return result[0];
    }, { name: insertCategory.name });
  }

  // ===== USER INTERESTS =====

  async getUserInterests(userId: number): Promise<(UserInterest & { category: InterestCategory })[]> {
    return this.executeQuery('getUserInterests', async () => {
      return await this.db
        .select({
          id: userInterests.id,
          userId: userInterests.userId,
          categoryId: userInterests.categoryId,
          isEnabled: userInterests.isEnabled,
          priority: userInterests.priority,
          createdAt: userInterests.createdAt,
          updatedAt: userInterests.updatedAt,
          category: interestCategories
        })
        .from(userInterests)
        .innerJoin(interestCategories, eq(userInterests.categoryId, interestCategories.id))
        .where(eq(userInterests.userId, userId))
        .orderBy(userInterests.priority, interestCategories.displayName);
    }, { userId });
  }

  async getUserInterestsByCategory(userId: number, categoryIds: number[]): Promise<UserInterest[]> {
    return this.executeQuery('getUserInterestsByCategory', async () => {
      if (categoryIds.length === 0) return [];
      
      return await this.db
        .select()
        .from(userInterests)
        .where(
          and(
            eq(userInterests.userId, userId),
            inArray(userInterests.categoryId, categoryIds)
          )
        );
    }, { userId, categoryCount: categoryIds.length });
  }

  async setUserInterests(userId: number, interests: InsertUserInterest[]): Promise<UserInterest[]> {
    return this.executeQuery('setUserInterests', async () => {
      // Use transaction to ensure atomicity
      return await this.db.transaction(async (tx) => {
        // Delete existing interests
        await tx
          .delete(userInterests)
          .where(eq(userInterests.userId, userId));

        // Insert new interests
        if (interests.length > 0) {
          const now = new Date();
          const interestsWithTimestamps = interests.map(interest => ({
            ...interest,
            createdAt: now,
            updatedAt: now
          }));

          return await tx
            .insert(userInterests)
            .values(interestsWithTimestamps)
            .returning();
        }

        return [];
      });
    }, { userId, interestCount: interests.length });
  }

  async updateUserInterest(userId: number, categoryId: number, updates: UpdateUserInterest): Promise<UserInterest | undefined> {
    return this.executeQuery('updateUserInterest', async () => {
      const result = await this.db
        .update(userInterests)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userInterests.userId, userId),
            eq(userInterests.categoryId, categoryId)
          )
        )
        .returning();
      
      return result[0];
    }, { userId, categoryId });
  }

  async deleteUserInterest(userId: number, categoryId: number): Promise<boolean> {
    return this.executeQuery('deleteUserInterest', async () => {
      const result = await this.db
        .delete(userInterests)
        .where(
          and(
            eq(userInterests.userId, userId),
            eq(userInterests.categoryId, categoryId)
          )
        )
        .returning();
      
      return result.length > 0;
    }, { userId, categoryId });
  }

  // ===== PERFORMANCE OPTIMIZATIONS =====

  /**
   * Close database connection gracefully
   */
  async close(): Promise<void> {
    try {
      await this.client.end();
      this.isConnected = false;
      log.info('PostgreSQL connection closed');
    } catch (error) {
      log.error('Error closing PostgreSQL connection', error);
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      isConnected: this.isConnected,
      connectionRetries: this.connectionRetries,
      maxRetries: this.maxRetries
    };
  }

  /**
   * Get database instance for legacy compatibility
   */
  getDb() {
    return this.db;
  }
}