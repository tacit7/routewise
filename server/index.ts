// Load environment variables FIRST, before any other imports
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

// Manual environment loading to ensure it works
const envFiles = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '.env')
];

console.log('🔍 Loading environment variables manually...');
envFiles.forEach(envFile => {
  if (existsSync(envFile)) {
    console.log(`📁 Found .env file: ${envFile}`);
    
    try {
      // Load with dotenv
      const result = config({ path: envFile, override: false });
      if (result.error) {
        console.log(`⚠️ Dotenv error:`, result.error.message);
      } else {
        console.log(`✅ Dotenv loaded successfully from: ${envFile}`);
      }
      
      // Also manually parse to ensure we get the values
      const envContent = readFileSync(envFile, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=');
          
          // Only set if not already set (don't override)
          if (!process.env[key]) {
            process.env[key] = value;
          }
          
          // Log Google-related vars (without showing values)
          if (key.includes('GOOGLE_')) {
            console.log(`  ✅ ${key}: ${value ? 'SET' : 'EMPTY'}`);
          }
        }
      });
      
    } catch (error) {
      console.log(`❌ Error loading ${envFile}:`, error.message);
    }
  } else {
    console.log(`⚠️ .env file not found: ${envFile}`);
  }
});

// Verify final environment state
console.log('🔍 Final Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('- GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('- GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
if (process.env.GOOGLE_CLIENT_ID) {
  console.log('- GOOGLE_CLIENT_ID length:', process.env.GOOGLE_CLIENT_ID.length);
}
if (process.env.GOOGLE_CLIENT_SECRET) {
  console.log('- GOOGLE_CLIENT_SECRET length:', process.env.GOOGLE_CLIENT_SECRET.length);
}

// Now import other modules
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth-routes";
import { setupVite, serveStatic, log } from "./vite";
import { devApiCacheMiddleware } from "./dev-api-cache";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Add development API caching middleware (especially useful when MSW is disabled)
app.use(devApiCacheMiddleware);


app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register authentication routes
  registerAuthRoutes(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port 3001 for development, or from environment variable in production
  // this serves both the API and the client.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
