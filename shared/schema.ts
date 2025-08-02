import { pgTable, text, serial, integer, boolean, decimal, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  googleId: text("google_id").unique(),
  fullName: text("full_name"),
  avatar: text("avatar"),
  provider: text("provider").default("local"), // 'local', 'google', etc.
  createdAt: text("created_at").default("now()"),
  updatedAt: text("updated_at").default("now()"),
});

export const pois = pgTable("pois", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // restaurant, park, attraction, scenic, market, historic
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  reviewCount: integer("review_count").notNull(),
  timeFromStart: text("time_from_start").notNull(), // e.g., "2.5 hours in"
  imageUrl: text("image_url").notNull(),
  placeId: text("place_id"),
  address: text("address"),
  priceLevel: integer("price_level"),
  isOpen: boolean("is_open"),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  startCity: text("start_city").notNull(),
  endCity: text("end_city").notNull(),
  checkpoints: json("checkpoints").$type<string[]>().default([]), // JSON array of checkpoint cities
  routeData: json("route_data").$type<{
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
  }>(),
  poisData: json("pois_data").$type<Array<{
    id: number;
    name: string;
    description: string;
    category: string;
    rating: string;
    reviewCount: number;
    timeFromStart: string;
    imageUrl: string;
    placeId: string | null;
    address: string | null;
    priceLevel: number | null;
    isOpen: boolean | null;
  }>>().default([]),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  googleId: true,
  fullName: true,
  avatar: true,
  provider: true,
});

export const insertPoiSchema = createInsertSchema(pois).omit({
  id: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTripSchema = createInsertSchema(trips).omit({
  id: true,
  userId: true,
  createdAt: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPoi = z.infer<typeof insertPoiSchema>;
export type Poi = typeof pois.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type UpdateTrip = z.infer<typeof updateTripSchema>;
export type Trip = typeof trips.$inferSelect;
