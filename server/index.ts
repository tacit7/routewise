// Load environment variables FIRST, before any other imports
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Load environment files in order of precedence
const envFiles = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '.env')
];

// Load environment files (dotenv handles the parsing)
envFiles.forEach(envFile => {
  if (existsSync(envFile)) {
    config({ path: envFile, override: false });
  }
});

// Import environment validation after dotenv is loaded
import { initializeEnvironment, type ValidatedEnv } from './env-validation';

// Initialize and validate environment early
const env = initializeEnvironment();

// Now import other modules
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth-routes";
import { setupVite, serveStatic, log } from "./vite";
import { devApiCacheMiddleware } from "./dev-api-cache";
import { log as logger, requestLogger, errorLogger } from "./logger";
import { securityHeaders } from "./validation-middleware";
import { getRateLimiter } from "./simple-rate-limit";
import { initializeStorageWithEnv } from "./storage";
import { initializeAuthService } from "./auth-service";
import { initializeGoogleOAuthService } from "./google-oauth-service";

const app = express();

// Trust proxy headers (fixes IPv6 rate limiting issues)
app.set('trust proxy', true);

// Security middleware (must be first)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: process.env.NODE_ENV === 'development' 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com"] 
        : ["'self'", "https://maps.googleapis.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com", "ws://localhost:*", "wss://localhost:*"]
    },
  },
  crossOriginEmbedderPolicy: false // Allow external resources like Google Maps
}));
app.use(securityHeaders());

// Rate limiting (apply early, before other middleware)
app.use(getRateLimiter('general'));

// Request logging
app.use(requestLogger());

// Standard Express middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
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
  // Initialize services with validated environment
  initializeStorageWithEnv(env.DATABASE_URL);
  initializeAuthService(env.JWT_SECRET, env.JWT_EXPIRES_IN);
  initializeGoogleOAuthService(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
  
  // Register authentication routes
  registerAuthRoutes(app);
  
  const server = await registerRoutes(app);

  // Error handling middleware (must be last)
  app.use(errorLogger());
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? (status === 500 ? "Internal Server Error" : err.message)
      : err.message || "Internal Server Error";

    // Log the error
    logger.error('Request error', err, {
      method: req.method,
      url: req.originalUrl,
      statusCode: status,
      userId: (req as any).user?.id,
      ip: req.ip
    });

    res.status(status).json({ 
      success: false,
      message,
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  // Serve the app on the validated port first
  const port = env.PORT;
  server.listen(port, '127.0.0.1', () => {
    logger.info(`🚀 Server listening on http://127.0.0.1:${port}`, {
      environment: env.NODE_ENV,
      port: port,
      hasDatabase: !!env.DATABASE_URL,
      hasGoogleOAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
    });
  });

  // Handle server errors
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use`);
      process.exit(1);
    } else {
      logger.error('Server error:', error);
      process.exit(1);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
})();
