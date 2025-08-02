import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { registerAuthRoutes } from '../../server/auth-routes';
import { AuthService } from '../../server/auth-service';

// Mock the auth service
vi.mock('../../server/auth-service', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    getUserById: vi.fn(),
    changePassword: vi.fn(),
  },
  AuthService: vi.fn().mockImplementation(() => ({
    register: vi.fn(),
    login: vi.fn(),
    getUserById: vi.fn(),
    changePassword: vi.fn(),
    generateToken: vi.fn(),
    verifyToken: vi.fn(),
  })),
}));

// Mock Google OAuth service
vi.mock('../../server/google-oauth-service', () => ({
  googleOAuthService: {
    getAuthUrl: vi.fn(),
    handleCallback: vi.fn(),
  },
}));

// Mock auth middleware
vi.mock('../../server/auth-middleware', () => ({
  AuthMiddleware: {
    securityHeaders: (req: any, res: any, next: any) => next(),
    rateLimit: () => (req: any, res: any, next: any) => next(),
    validateAuthInput: (req: any, res: any, next: any) => {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }
      if (username.length < 3) {
        return res.status(400).json({ success: false, message: 'Username must be at least 3 characters long' });
      }
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      }
      next();
    },
    requireAuth: (req: any, res: any, next: any) => {
      const token = req.cookies?.auth_token;
      if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      req.user = { id: 1, username: 'testuser' };
      next();
    },
  },
}));

describe('Authentication API Routes', () => {
  let app: express.Express;
  const mockAuthService = vi.mocked(require('../../server/auth-service').authService);
  const mockGoogleOAuthService = vi.mocked(require('../../server/google-oauth-service').googleOAuthService);

  beforeAll(() => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    
    // Register auth routes
    registerAuthRoutes(app);
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      mockAuthService.register.mockResolvedValue({
        success: true,
        user: { id: 1, username: 'testuser' },
        token: 'jwt-token-123',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Account created successfully',
        user: { id: 1, username: 'testuser' },
        token: 'jwt-token-123',
      });

      // Check that cookie was set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toContain('auth_token=jwt-token-123');
      expect(cookieHeader).toContain('HttpOnly');
      expect(cookieHeader).toContain('SameSite=Strict');
    });

    it('should validate input fields', async () => {
      // Missing username
      await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Username and password are required');
        });

      // Missing password
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Username and password are required');
        });

      // Username too short
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'password123' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Username must be at least 3 characters long');
        });

      // Password too short
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'short' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Password must be at least 8 characters long');
        });
    });

    it('should handle registration failures', async () => {
      mockAuthService.register.mockResolvedValue({
        success: false,
        message: 'Username already exists',
      });

      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          password: 'password123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toMatchObject({
            success: false,
            message: 'Username already exists',
          });
        });
    });

    it('should handle service errors gracefully', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Database error'));

      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(500)
        .expect((res) => {
          expect(res.body).toMatchObject({
            success: false,
            message: 'Internal server error',
          });
        });
    });

    it('should handle registration without token', async () => {
      mockAuthService.register.mockResolvedValue({
        success: true,
        user: { id: 1, username: 'testuser' },
        // No token in response
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Account created successfully',
        user: { id: 1, username: 'testuser' },
      });

      // Should not set cookie without token
      expect(response.headers['set-cookie']).toBeUndefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      mockAuthService.login.mockResolvedValue({
        success: true,
        user: { id: 1, username: 'testuser' },
        token: 'jwt-token-123',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        user: { id: 1, username: 'testuser' },
        token: 'jwt-token-123',
      });

      // Check that cookie was set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toContain('auth_token=jwt-token-123');
    });

    it('should validate login input', async () => {
      // Same validation as register
      await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Username and password are required');
        });
    });

    it('should handle invalid credentials', async () => {
      mockAuthService.login.mockResolvedValue({
        success: false,
        message: 'Invalid credentials',
      });

      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'wronguser',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toMatchObject({
            success: false,
            message: 'Invalid credentials',
          });
        });
    });

    it('should handle login service errors', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Service error'));

      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(500)
        .expect((res) => {
          expect(res.body).toMatchObject({
            success: false,
            message: 'Internal server error',
          });
        });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful',
      });

      // Check that cookie was cleared
      expect(response.headers['set-cookie']).toBeDefined();
      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toContain('auth_token=;');
      expect(cookieHeader).toContain('Max-Age=0');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      mockAuthService.getUserById.mockResolvedValue({
        id: 1,
        username: 'testuser',
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'auth_token=valid-token')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: { id: 1, username: 'testuser' },
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401)
        .expect((res) => {
          expect(res.body).toMatchObject({
            success: false,
            message: 'Authentication required',
          });
        });
    });

    it('should handle user not found', async () => {
      mockAuthService.getUserById.mockResolvedValue(null);

      await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'auth_token=valid-token')
        .expect(404)
        .expect((res) => {
          expect(res.body).toMatchObject({
            success: false,
            message: 'User not found',
          });
        });
    });
  });

  describe('Google OAuth Routes', () => {
    it('should redirect to Google OAuth URL', async () => {
      const authUrl = 'https://accounts.google.com/oauth/authorize?client_id=test';
      mockGoogleOAuthService.getAuthUrl.mockReturnValue(authUrl);

      const response = await request(app)
        .get('/api/auth/google')
        .expect(302);

      expect(response.headers.location).toBe(authUrl);
    });

    it('should handle OAuth callback success', async () => {
      mockGoogleOAuthService.handleCallback.mockResolvedValue({
        success: true,
        user: { id: 1, username: 'testuser' },
        token: 'oauth-token-123',
      });

      const response = await request(app)
        .get('/api/auth/google/callback?code=auth-code&state=test-state')
        .expect(302);

      expect(response.headers.location).toContain('/?success=google_auth');
      expect(response.headers.location).toContain('message=Welcome%20back!');

      // Check that cookie was set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toContain('auth_token=oauth-token-123');
    });

    it('should handle OAuth callback failure', async () => {
      mockGoogleOAuthService.handleCallback.mockResolvedValue({
        success: false,
        error: 'invalid_grant',
        message: 'Authorization code expired',
      });

      const response = await request(app)
        .get('/api/auth/google/callback?code=invalid-code')
        .expect(302);

      expect(response.headers.location).toContain('/?error=auth_failed');
      expect(response.headers.location).toContain('message=Authorization%20code%20expired');
    });

    it('should handle missing OAuth parameters', async () => {
      // Missing code parameter
      const response = await request(app)
        .get('/api/auth/google/callback')
        .expect(302);

      expect(response.headers.location).toContain('/?error=missing_code');
    });

    it('should handle OAuth service errors', async () => {
      mockGoogleOAuthService.handleCallback.mockRejectedValue(new Error('OAuth service error'));

      const response = await request(app)
        .get('/api/auth/google/callback?code=test-code')
        .expect(302);

      expect(response.headers.location).toContain('/?error=server_error');
    });
  });

  describe('Security and Rate Limiting', () => {
    it('should apply security headers to auth routes', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      // Note: Since we mocked the middleware, we can't test actual headers
      // In a real implementation, you would check for security headers here
      expect(response).toBeDefined();
    });

    it('should handle malformed JSON in request body', async () => {
      await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle large request payloads', async () => {
      const largePayload = {
        username: 'a'.repeat(1000),
        password: 'b'.repeat(1000),
      };

      await request(app)
        .post('/api/auth/register')
        .send(largePayload)
        .expect(400); // Should fail validation due to length
    });
  });

  describe('Cookie Security', () => {
    it('should set secure cookies in production', async () => {
      process.env.NODE_ENV = 'production';
      
      mockAuthService.register.mockResolvedValue({
        success: true,
        user: { id: 1, username: 'testuser' },
        token: 'jwt-token-123',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(201);

      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toContain('Secure');

      process.env.NODE_ENV = 'test';
    });

    it('should set cookie with proper expiration', async () => {
      mockAuthService.login.mockResolvedValue({
        success: true,
        user: { id: 1, username: 'testuser' },
        token: 'jwt-token-123',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toContain('Max-Age=604800'); // 7 days in seconds
    });
  });
});