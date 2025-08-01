import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import type { InsertUser, User } from '@shared/schema';

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

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'route-wise-dev-secret-key';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ JWT_SECRET not set, using development default');
    }
  }

  async register(userData: InsertUser): Promise<AuthResult> {
    try {
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
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  }

  async login(credentials: InsertUser): Promise<AuthResult> {
    try {
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
      console.error('Login error:', error);
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
      console.error('Token verification failed:', error);
      return null;
    }
  }

  async getUserFromToken(token: string): Promise<User | null> {
    const payload = this.verifyToken(token);
    if (!payload) {
      return null;
    }

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
      console.error('Password change error:', error);
      return {
        success: false,
        message: 'Password change failed'
      };
    }
  }
}

export const authService = new AuthService();
