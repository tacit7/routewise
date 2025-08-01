import { pgTable, text, serial, integer, boolean, decimal } from "drizzle-orm/pg-core";
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPoi = z.infer<typeof insertPoiSchema>;
export type Poi = typeof pois.$inferSelect;
