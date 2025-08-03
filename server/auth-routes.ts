import type { Express, Request, Response } from "express";
import { getAuthService } from "./auth-service";
import { getGoogleOAuthService } from "./google-oauth-service";
import { AuthMiddleware, type AuthenticatedRequest } from "./auth-middleware";
import { log } from "./logger";
import { authRateLimit } from "./simple-rate-limit";

export function registerAuthRoutes(app: Express): void {
  // Apply security headers to all auth routes
  app.use("/api/auth/*", AuthMiddleware.securityHeaders);

  // Apply rate limiting to auth endpoints
  app.use("/api/auth/login", authRateLimit);
  app.use("/api/auth/register", authRateLimit);

  /**
   * POST /api/auth/register
   * Register a new user account
   */
  app.post(
    "/api/auth/register",
    AuthMiddleware.validateAuthInput,
    async (req: Request, res: Response) => {
      try {
        const { username, password } = req.body;

        const authService = getAuthService();
        const result = await authService.register({ username, password });

        if (!result.success) {
          return res.status(400).json(result);
        }

        // Set secure cookie with token
        if (result.token) {
          res.cookie("auth_token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
        }

        res.status(201).json({
          success: true,
          message: "Account created successfully",
          user: result.user,
          token: result.token,
        });
      } catch (error) {
        log.error('Registration endpoint error', error);
        res.status(500).json({
          success: false,
          message: "Registration failed",
        });
      }
    }
  );

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  app.post(
    "/api/auth/login",
    AuthMiddleware.validateAuthInput,
    async (req: Request, res: Response) => {
      try {
        const { username, password } = req.body;

        const authService = getAuthService();
        const result = await authService.login({ username, password });

        if (!result.success) {
          return res.status(401).json(result);
        }

        // Set secure cookie with token
        if (result.token) {
          res.cookie("auth_token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
        }

        res.json({
          success: true,
          message: "Login successful",
          user: result.user,
          token: result.token,
        });
      } catch (error) {
        log.error('Login endpoint error', error);
        res.status(500).json({
          success: false,
          message: "Login failed",
        });
      }
    }
  );

  /**
   * POST /api/auth/logout
   * Clear authentication token
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    try {
      // Clear the auth cookie
      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      log.error('Logout endpoint error', error);
      res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user information
   */
  app.get(
    "/api/auth/me",
    AuthMiddleware.authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        res.json({
          success: true,
          user: req.user,
        });
      } catch (error) {
        log.error('Get user endpoint error', error);
        res.status(500).json({
          success: false,
          message: "Failed to get user information",
        });
      }
    }
  );

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  app.post(
    "/api/auth/change-password",
    AuthMiddleware.authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            message: "Current password and new password are required",
          });
        }

        const authService = getAuthService();
        const result = await authService.changePassword(
          req.user.id,
          currentPassword,
          newPassword
        );

        if (!result.success) {
          return res.status(400).json(result);
        }

        res.json(result);
      } catch (error) {
        log.error('Change password endpoint error', error);
        res.status(500).json({
          success: false,
          message: "Password change failed",
        });
      }
    }
  );

  /**
   * GET /api/auth/google
   * Redirect to Google OAuth
   */
  app.get("/api/auth/google", (req: Request, res: Response) => {
    log.info('Google OAuth endpoint hit - checking configuration');
    try {
      const googleOAuthService = getGoogleOAuthService();
      if (!googleOAuthService.isConfigured()) {
        return res.status(503).json({
          success: false,
          message: "Google OAuth is not configured",
        });
      }

      const authUrl = googleOAuthService.getAuthorizationUrl();
      log.info('Redirecting to Google OAuth', { authUrl });
      res.redirect(authUrl);
    } catch (error) {
      log.error('Google OAuth redirect error', error);
      res.status(500).json({
        success: false,
        message: "Failed to initiate Google authentication",
      });
    }
  });

  /**
   * GET /api/auth/google/callback
   * Handle Google OAuth callback
   */
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        log.error('Google OAuth error', error);
        return res.redirect("/?error=oauth_error");
      }

      if (!code || typeof code !== "string") {
        return res.redirect("/?error=missing_code");
      }

      if (!state || typeof state !== "string") {
        return res.redirect("/?error=missing_state");
      }

      const googleOAuthService = getGoogleOAuthService();
      const result = await googleOAuthService.handleCallback(code, state);

      if (!result.success) {
        log.error('Google OAuth callback failed', { message: result.message });
        return res.redirect(
          `/?error=auth_failed&message=${encodeURIComponent(
            result.message || "Authentication failed"
          )}`
        );
      }

      // Set secure cookie with token
      if (result.token) {
        res.cookie("auth_token", result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      // Redirect to home page with success message
      const welcomeMessage = result.isNewUser
        ? `Welcome to RouteWise, ${result.user?.username}!`
        : `Welcome back, ${result.user?.username}!`;

      res.redirect(
        `/?success=google_auth&message=${encodeURIComponent(welcomeMessage)}`
      );
    } catch (error) {
      log.error('Google OAuth callback error', error);
      res.redirect("/?error=server_error");
    }
  });

  /**
   * POST /api/auth/configure-oauth
   * Manually configure OAuth for development (development only)
   */
  app.post("/api/auth/configure-oauth", (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ message: "Not found" });
    }

    try {
      const { clientId, clientSecret, redirectUri } = req.body;

      if (!clientId || !clientSecret) {
        return res.status(400).json({
          success: false,
          message: "Client ID and Client Secret are required",
        });
      }

      // Manually set environment variables
      process.env.GOOGLE_CLIENT_ID = clientId;
      process.env.GOOGLE_CLIENT_SECRET = clientSecret;
      process.env.GOOGLE_REDIRECT_URI =
        redirectUri || "http://localhost:3001/api/auth/google/callback";

      log.info('OAuth manually configured', {
        clientIdLength: clientId.length,
        clientSecretLength: clientSecret.length
      });

      res.json({
        success: true,
        message: "OAuth configured successfully",
        configured: getGoogleOAuthService().isConfigured(),
      });
    } catch (error) {
      log.error('OAuth configuration error', error);
      res.status(500).json({
        success: false,
        message: "Failed to configure OAuth",
      });
    }
  });

  /**
   * GET /api/auth/debug
   * Debug endpoint to check OAuth configuration (development only)
   */
  app.get("/api/auth/debug", (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ message: "Not found" });
    }

    // Force a fresh check by creating a new service instance
    const freshCheck = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    };

    res.json({
      nodeEnv: process.env.NODE_ENV,
      googleClientIdSet: !!process.env.GOOGLE_CLIENT_ID,
      googleClientSecretSet: !!process.env.GOOGLE_CLIENT_SECRET,
      googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
      oauthConfigured: getGoogleOAuthService().isConfigured(),
      freshCheck: {
        clientIdLength: freshCheck.clientId.length,
        clientSecretLength: freshCheck.clientSecret.length,
        freshConfigured: freshCheck.configured
      },
      envVars: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
          ? "SET (length: " + process.env.GOOGLE_CLIENT_ID.length + ")"
          : "NOT SET",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
          ? "SET (length: " + process.env.GOOGLE_CLIENT_SECRET.length + ")"
          : "NOT SET",
      },
    });
  });

  /**
   * POST /api/auth/verify-token
   * Verify if a token is valid (useful for frontend token validation)
   */
  app.post("/api/auth/verify-token", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token is required",
        });
      }

      const authService = getAuthService();
      const user = await authService.getUserFromToken(token);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      res.json({
        success: true,
        message: "Token is valid",
        user,
      });
    } catch (error) {
      log.error('Token verification endpoint error', error);
      res.status(500).json({
        success: false,
        message: "Token verification failed",
      });
    }
  });
}
