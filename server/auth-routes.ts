import type { Express, Request, Response } from 'express';
import { authService } from './auth-service';
import { googleOAuthService } from './google-oauth-service';
import { AuthMiddleware, type AuthenticatedRequest } from './auth-middleware';

export function registerAuthRoutes(app: Express): void {
  // Apply security headers to all auth routes
  app.use('/api/auth/*', AuthMiddleware.securityHeaders);
  
  // Apply rate limiting to auth endpoints
  const authRateLimit = AuthMiddleware.rateLimit();
  app.use('/api/auth/login', authRateLimit);
  app.use('/api/auth/register', authRateLimit);

  /**
   * POST /api/auth/register
   * Register a new user account
   */
  app.post('/api/auth/register', 
    AuthMiddleware.validateAuthInput,
    async (req: Request, res: Response) => {
      try {
        const { username, password } = req.body;
        
        const result = await authService.register({ username, password });
        
        if (!result.success) {
          return res.status(400).json(result);
        }

        // Set secure cookie with token
        if (result.token) {
          res.cookie('auth_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
        }

        res.status(201).json({
          success: true,
          message: 'Account created successfully',
          user: result.user,
          token: result.token
        });
      } catch (error) {
        console.error('Registration endpoint error:', error);
        res.status(500).json({
          success: false,
          message: 'Registration failed'
        });
      }
    }
  );

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  app.post('/api/auth/login',
    AuthMiddleware.validateAuthInput,
    async (req: Request, res: Response) => {
      try {
        const { username, password } = req.body;
        
        const result = await authService.login({ username, password });
        
        if (!result.success) {
          return res.status(401).json(result);
        }

        // Set secure cookie with token
        if (result.token) {
          res.cookie('auth_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
        }

        res.json({
          success: true,
          message: 'Login successful',
          user: result.user,
          token: result.token
        });
      } catch (error) {
        console.error('Login endpoint error:', error);
        res.status(500).json({
          success: false,
          message: 'Login failed'
        });
      }
    }
  );

  /**
   * POST /api/auth/logout
   * Clear authentication token
   */
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    try {
      // Clear the auth cookie
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user information
   */
  app.get('/api/auth/me',
    AuthMiddleware.authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        res.json({
          success: true,
          user: req.user
        });
      } catch (error) {
        console.error('Get user endpoint error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get user information'
        });
      }
    }
  );

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  app.post('/api/auth/change-password',
    AuthMiddleware.authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            message: 'Current password and new password are required'
          });
        }

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
        console.error('Change password endpoint error:', error);
        res.status(500).json({
          success: false,
          message: 'Password change failed'
        });
      }
    }
  );

  /**
   * GET /api/auth/google
   * Redirect to Google OAuth
   */
  app.get('/api/auth/google', (req: Request, res: Response) => {
    try {
      if (!googleOAuthService.isConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Google OAuth is not configured'
        });
      }

      const authUrl = googleOAuthService.getAuthorizationUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error('Google OAuth redirect error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Google authentication'
      });
    }
  });

  /**
   * GET /api/auth/google/callback
   * Handle Google OAuth callback
   */
  app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        console.error('Google OAuth error:', error);
        return res.redirect('/?error=oauth_error');
      }

      if (!code || typeof code !== 'string') {
        return res.redirect('/?error=missing_code');
      }

      if (!state || typeof state !== 'string') {
        return res.redirect('/?error=missing_state');
      }

      const result = await googleOAuthService.handleCallback(code, state);

      if (!result.success) {
        console.error('Google OAuth callback failed:', result.message);
        return res.redirect(`/?error=auth_failed&message=${encodeURIComponent(result.message || 'Authentication failed')}`);
      }

      // Set secure cookie with token
      if (result.token) {
        res.cookie('auth_token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      // Redirect to home page with success message
      const welcomeMessage = result.isNewUser 
        ? `Welcome to RouteWise, ${result.user?.username}!` 
        : `Welcome back, ${result.user?.username}!`;
      
      res.redirect(`/?success=google_auth&message=${encodeURIComponent(welcomeMessage)}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/?error=server_error');
    }
  });

  /**
   * POST /api/auth/verify-token
   * Verify if a token is valid (useful for frontend token validation)
   */
  app.post('/api/auth/verify-token', async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const user = await authService.getUserFromToken(token);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      res.json({
        success: true,
        message: 'Token is valid',
        user
      });
    } catch (error) {
      console.error('Token verification endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  });
}
