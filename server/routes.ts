import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all POIs
  app.get("/api/pois", async (req, res) => {
    try {
      const pois = await storage.getAllPois();
      res.json(pois);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch POIs" });
    }
  });

  // Get POI by ID
  app.get("/api/pois/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid POI ID" });
      }

      const poi = await storage.getPoiById(id);
      if (!poi) {
        return res.status(404).json({ message: "POI not found" });
      }

      res.json(poi);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch POI" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
