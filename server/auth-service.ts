import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getStorage } from './storage';
import type { InsertUser, User } from '@shared/schema';
import { log } from './logger';

interface AuthTokenPayload {
  userId: number;
  username: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly SALT_ROUNDS = 12;

  constructor(jwtSecret: string, jwtExpiresIn: string = '7d') {
    // JWT_SECRET is already validated by environment validation
    this.JWT_SECRET = jwtSecret;
    this.JWT_EXPIRES_IN = jwtExpiresIn;
    
    log.info('AuthService initialized with secure JWT configuration', {
      jwtSecretLength: jwtSecret.length,
      jwtExpiresIn: jwtExpiresIn
    });
  }

  async register(userData: InsertUser): Promise<AuthResult> {
    try {
      const storage = getStorage();
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return {
          success: false,
          message: 'Username already exists'
        };
      }

      // Validate input
      if (!userData.username || userData.username.trim().length < 3) {
        return {
          success: false,
          message: 'Username must be at least 3 characters long'
        };
      }

      if (!userData.password || userData.password.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

      // Create user
      const user = await storage.createUser({
        username: userData.username.trim().toLowerCase(),
        password: hashedPassword
      });

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        username: user.username
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          password: '' // Never return password hash
        },
        token
      };
    } catch (error) {
      log.error('Registration error', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  }

  async login(credentials: InsertUser): Promise<AuthResult> {
    try {
      const storage = getStorage();
      
      // Find user
      const user = await storage.getUserByUsername(credentials.username.trim().toLowerCase());
      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(credentials.password, user.password);
      if (!passwordValid) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        username: user.username
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          password: '' // Never return password hash
        },
        token
      };
    } catch (error) {
      log.error('Login error', error);
      return {
        success: false,
        message: 'Login failed'
      };
    }
  }

  public generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'route-wise',
      audience: 'route-wise-users'
    });
  }

  verifyToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'route-wise',
        audience: 'route-wise-users'
      }) as AuthTokenPayload;
      
      return decoded;
    } catch (error) {
      log.error('Token verification failed', error);
      return null;
    }
  }

  async getUserFromToken(token: string): Promise<User | null> {
    const payload = this.verifyToken(token);
    if (!payload) {
      return null;
    }

    const storage = getStorage();
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      password: '' // Never return password hash
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const storage = getStorage();
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify current password
      const passwordValid = await bcrypt.compare(currentPassword, user.password);
      if (!passwordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Validate new password
      if (!newPassword || newPassword.length < 8) {
        return {
          success: false,
          message: 'New password must be at least 8 characters long'
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update user (note: this would need actual database update in real implementation)
      // For now, we'll update the in-memory storage
      user.password = hashedPassword;

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      log.error('Password change error', error);
      return {
        success: false,
        message: 'Password change failed'
      };
    }
  }
}

// AuthService instance will be initialized with validated environment
let authServiceInstance: AuthService | null = null;

export function initializeAuthService(jwtSecret: string, jwtExpiresIn: string): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(jwtSecret, jwtExpiresIn);
  }
  return authServiceInstance;
}

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    throw new Error('AuthService not initialized. Call initializeAuthService() first.');
  }
  return authServiceInstance;
}
