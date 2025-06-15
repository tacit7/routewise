import { users, pois, type User, type InsertUser, type Poi, type InsertPoi } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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

  private initializePois() {
    const samplePois: InsertPoi[] = [
      {
        name: "Mountain View Diner",
        description: "Famous for their homemade pie and scenic mountain views. A perfect stop to stretch your legs and enjoy comfort food.",
        category: "restaurant",
        rating: "4.8",
        reviewCount: 324,
        timeFromStart: "2.5 hours in",
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      },
      {
        name: "Cascade Falls State Park",
        description: "Stunning 200-foot waterfall with easy hiking trails. The perfect spot for nature photography and a refreshing break.",
        category: "park",
        rating: "4.9",
        reviewCount: 892,
        timeFromStart: "4 hours in",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      },
      {
        name: "World's Largest Boot",
        description: "A quirky 40-foot tall boot sculpture that's become an Instagram sensation. Quick photo stop with a gift shop.",
        category: "attraction",
        rating: "4.2",
        reviewCount: 156,
        timeFromStart: "6 hours in",
        imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      },
      {
        name: "Eagle's Peak Overlook",
        description: "Breathtaking 360-degree views of the valley below. Best visited during sunset for spectacular photo opportunities.",
        category: "scenic",
        rating: "4.7",
        reviewCount: 543,
        timeFromStart: "7.5 hours in",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      },
      {
        name: "Riverside Farmers Market",
        description: "Fresh local produce, artisanal crafts, and street food. Open Saturdays with live music and family-friendly atmosphere.",
        category: "market",
        rating: "4.6",
        reviewCount: 278,
        timeFromStart: "3.5 hours in",
        imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      },
      {
        name: "Old West Ghost Town",
        description: "Preserved 1800s mining town with guided tours, authentic buildings, and interactive exhibits. Step back in time.",
        category: "historic",
        rating: "4.4",
        reviewCount: 412,
        timeFromStart: "5.5 hours in",
        imageUrl: "https://images.unsplash.com/photo-1515824738708-54e5d150c9bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      }
    ];

    samplePois.forEach(poi => {
      const id = this.currentPoiId++;
      const newPoi: Poi = { ...poi, id };
      this.pois.set(id, newPoi);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
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
    const poi: Poi = { ...insertPoi, id };
    this.pois.set(id, poi);
    return poi;
  }
}

export const storage = new MemStorage();
