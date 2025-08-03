import { 
  users, 
  pois, 
  interestCategories,
  userInterests,
  type User, 
  type InsertUser, 
  type Poi, 
  type InsertPoi,
  type InterestCategory,
  type InsertInterestCategory,
  type UserInterest,
  type InsertUserInterest,
  type UpdateUserInterest
} from "@shared/schema";
import { PostgreSQLStorage } from "./storage-postgresql";
import { log } from "./logger";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  linkGoogleAccount(userId: number, googleId: string): Promise<void>;
  getAllPois(): Promise<Poi[]>;
  getPoiById(id: number): Promise<Poi | undefined>;
  createPoi(poi: InsertPoi): Promise<Poi>;
  
  // Interest categories
  getAllInterestCategories(): Promise<InterestCategory[]>;
  getInterestCategoryById(id: number): Promise<InterestCategory | undefined>;
  getInterestCategoryByName(name: string): Promise<InterestCategory | undefined>;
  createInterestCategory(category: InsertInterestCategory): Promise<InterestCategory>;
  
  // User interests  
  getUserInterests(userId: number): Promise<(UserInterest & { category: InterestCategory })[]>;
  getUserInterestsByCategory(userId: number, categoryIds: number[]): Promise<UserInterest[]>;
  setUserInterests(userId: number, interests: InsertUserInterest[]): Promise<UserInterest[]>;
  updateUserInterest(userId: number, categoryId: number, updates: UpdateUserInterest): Promise<UserInterest | undefined>;
  deleteUserInterest(userId: number, categoryId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pois: Map<number, Poi>;
  private interestCategories: Map<number, InterestCategory>;
  private userInterests: Map<string, UserInterest>; // key: `${userId}-${categoryId}`
  private currentUserId: number;
  private currentPoiId: number;
  private currentCategoryId: number;
  private currentUserInterestId: number;

  constructor() {
    this.users = new Map();
    this.pois = new Map();
    this.interestCategories = new Map();
    this.userInterests = new Map();
    this.currentUserId = 1;
    this.currentPoiId = 1;
    this.currentCategoryId = 1;
    this.currentUserInterestId = 1;
    
    // Initialize with sample data
    this.initializePois();
    this.initializeInterestCategories();
  }

  private async initializePois() {
    // This will be populated with real Google Places data
    // The actual fetching happens in the routes when needed
  }

  private async initializeInterestCategories() {
    // Initialize default interest categories matching POI types
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

    for (const categoryData of defaultCategories) {
      const id = this.currentCategoryId++;
      const now = new Date();
      const category: InterestCategory = {
        id,
        ...categoryData,
        createdAt: now
      };
      this.interestCategories.set(id, category);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }

  async linkGoogleAccount(userId: number, googleId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.googleId = googleId;
      this.users.set(userId, user);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || null,
      googleId: insertUser.googleId || null,
      fullName: insertUser.fullName || null,
      avatar: insertUser.avatar || null,
      provider: insertUser.provider || 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllPois(): Promise<Poi[]> {
    return Array.from(this.pois.values());
  }

  async getPoiById(id: number): Promise<Poi | undefined> {
    return this.pois.get(id);
  }

  async createPoi(insertPoi: InsertPoi): Promise<Poi> {
    const id = this.currentPoiId++;
    const poi: Poi = { 
      ...insertPoi, 
      id,
      placeId: insertPoi.placeId || null,
      address: insertPoi.address || null,
      priceLevel: insertPoi.priceLevel || null,
      isOpen: insertPoi.isOpen || null,
    };
    this.pois.set(id, poi);
    return poi;
  }

  // Interest Categories Methods
  async getAllInterestCategories(): Promise<InterestCategory[]> {
    return Array.from(this.interestCategories.values()).filter(cat => cat.isActive);
  }

  async getInterestCategoryById(id: number): Promise<InterestCategory | undefined> {
    return this.interestCategories.get(id);
  }

  async getInterestCategoryByName(name: string): Promise<InterestCategory | undefined> {
    return Array.from(this.interestCategories.values()).find(cat => cat.name === name);
  }

  async createInterestCategory(insertCategory: InsertInterestCategory): Promise<InterestCategory> {
    const id = this.currentCategoryId++;
    const now = new Date();
    const category: InterestCategory = {
      id,
      ...insertCategory,
      description: insertCategory.description ?? null,
      iconName: insertCategory.iconName ?? null,
      isActive: insertCategory.isActive ?? true,
      createdAt: now
    };
    this.interestCategories.set(id, category);
    return category;
  }

  // User Interests Methods
  async getUserInterests(userId: number): Promise<(UserInterest & { category: InterestCategory })[]> {
    const userInterestsList = Array.from(this.userInterests.values())
      .filter(ui => ui.userId === userId);
    
    return userInterestsList.map(ui => {
      const category = this.interestCategories.get(ui.categoryId);
      if (!category) {
        throw new Error(`Category ${ui.categoryId} not found for user interest ${ui.id}`);
      }
      return { ...ui, category };
    });
  }

  async getUserInterestsByCategory(userId: number, categoryIds: number[]): Promise<UserInterest[]> {
    return Array.from(this.userInterests.values())
      .filter(ui => ui.userId === userId && categoryIds.includes(ui.categoryId));
  }

  async setUserInterests(userId: number, interests: InsertUserInterest[]): Promise<UserInterest[]> {
    // Clear existing interests for this user
    const existingKeys = Array.from(this.userInterests.keys())
      .filter(key => key.startsWith(`${userId}-`));
    for (const key of existingKeys) {
      this.userInterests.delete(key);
    }

    // Add new interests
    const createdInterests: UserInterest[] = [];
    const now = new Date();
    
    for (const interest of interests) {
      const id = this.currentUserInterestId++;
      const userInterest: UserInterest = {
        id,
        userId,
        categoryId: interest.categoryId,
        isEnabled: interest.isEnabled ?? true,
        priority: interest.priority ?? 1,
        createdAt: now,
        updatedAt: now
      };
      
      const key = `${userId}-${interest.categoryId}`;
      this.userInterests.set(key, userInterest);
      createdInterests.push(userInterest);
    }

    return createdInterests;
  }

  async updateUserInterest(userId: number, categoryId: number, updates: UpdateUserInterest): Promise<UserInterest | undefined> {
    const key = `${userId}-${categoryId}`;
    const existing = this.userInterests.get(key);
    
    if (!existing) {
      return undefined;
    }

    const updated: UserInterest = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.userInterests.set(key, updated);
    return updated;
  }

  async deleteUserInterest(userId: number, categoryId: number): Promise<boolean> {
    const key = `${userId}-${categoryId}`;
    return this.userInterests.delete(key);
  }

  /**
   * Get database instance for legacy compatibility - not applicable for MemStorage
   */
  getDb() {
    return null;
  }
}

/**
 * Initialize storage with PostgreSQL as primary and MemStorage as fallback
 * @param databaseUrl - Validated database URL from environment
 */
function initializeStorage(databaseUrl?: string): IStorage {
  // Try PostgreSQL first if DATABASE_URL is configured
  if (databaseUrl) {
    try {
      log.info('Attempting PostgreSQL storage initialization');
      const pgStorage = new PostgreSQLStorage(databaseUrl);
      log.info('PostgreSQL storage instance created successfully');
      return pgStorage;
    } catch (error) {
      log.error('Failed to create PostgreSQL storage instance, falling back to memory storage', error);
    }
  } else {
    log.warn('DATABASE_URL not configured, using in-memory storage (not recommended for production)');
  }
  
  // Fallback to memory storage
  log.info('Using in-memory storage');
  return new MemStorage();
}

/**
 * Storage instance - will be initialized with validated environment
 * Use initializeStorageWithEnv() to properly set up storage
 */
let storageInstance: IStorage | null = null;

export function initializeStorageWithEnv(databaseUrl?: string): IStorage {
  if (!storageInstance) {
    storageInstance = initializeStorage(databaseUrl);
    
    // Set db instance for legacy compatibility
    if ('getDb' in storageInstance) {
      db = (storageInstance as any).getDb();
    }
  }
  return storageInstance;
}

export function getStorage(): IStorage {
  if (!storageInstance) {
    throw new Error('Storage not initialized. Call initializeStorageWithEnv() first.');
  }
  return storageInstance;
}

// Legacy export removed - use initializeStorageWithEnv() and getStorage() instead

// Export db for legacy trip-service.ts - should be refactored
export let db: any = null;

// Function to set db instance after PostgreSQL storage is initialized
export function setDbInstance(dbInstance: any) {
  db = dbInstance;
}
