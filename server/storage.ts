import { users, pois, type User, type InsertUser, type Poi, type InsertPoi } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pois: Map<number, Poi>;
  private currentUserId: number;
  private currentPoiId: number;

  constructor() {
    this.users = new Map();
    this.pois = new Map();
    this.currentUserId = 1;
    this.currentPoiId = 1;
    
    // Initialize with sample POI data
    this.initializePois();
  }

  private async initializePois() {
    // This will be populated with real Google Places data
    // The actual fetching happens in the routes when needed
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
}

export const storage = new MemStorage();
