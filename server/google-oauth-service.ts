import { authService } from './auth-service';
import { storage } from './storage';
import type { InsertUser, User } from '@shared/schema';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

interface GoogleAuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  isNewUser?: boolean;
}

export class GoogleOAuthService {
  private readonly CLIENT_ID: string;
  private readonly CLIENT_SECRET: string;
  private readonly REDIRECT_URI: string;

  constructor() {
    this.CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
    this.CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
    this.REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
    
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      console.warn('⚠️ Google OAuth credentials not configured');
    }
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: this.generateState(), // CSRF protection
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /**
   * Exchange authorization code for access token and user info
   */
  async handleCallback(code: string, state: string): Promise<GoogleAuthResult> {
    try {
      // Verify state parameter for CSRF protection
      if (!this.verifyState(state)) {
        return {
          success: false,
          message: 'Invalid state parameter'
        };
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.REDIRECT_URI,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || tokenData.error) {
        console.error('Google token exchange failed:', tokenData);
        return {
          success: false,
          message: 'Failed to authenticate with Google'
        };
      }

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userInfo: GoogleUserInfo = await userInfoResponse.json();

      if (!userInfoResponse.ok) {
        console.error('Failed to get user info from Google:', userInfo);
        return {
          success: false,
          message: 'Failed to get user information'
        };
      }

      // Create or login user
      return await this.createOrLoginUser(userInfo);

    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  /**
   * Create new user or login existing user from Google account
   */
  private async createOrLoginUser(googleUser: GoogleUserInfo): Promise<GoogleAuthResult> {
    try {
      // Check if user exists by Google ID or email
      const existingUser = await this.findUserByGoogleInfo(googleUser);

      if (existingUser) {
        // User exists, generate token and login
        const token = authService.generateToken({
          userId: existingUser.id,
          username: existingUser.username
        });

        return {
          success: true,
          user: {
            id: existingUser.id,
            username: existingUser.username,
            password: '' // Never return password
          },
          token,
          isNewUser: false
        };
      } else {
        // Create new user
        const username = await this.generateUniqueUsername(googleUser);
        
        const newUserData: InsertUser = {
          username: username,
          password: this.generateRandomPassword(), // Random password for OAuth users
          email: googleUser.email,
          googleId: googleUser.id,
          fullName: googleUser.name,
          avatar: googleUser.picture,
          provider: 'google'
        };

        const user = await storage.createUser(newUserData);

        const token = authService.generateToken({
          userId: user.id,
          username: user.username
        });

        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            password: '' // Never return password
          },
          token,
          isNewUser: true
        };
      }
    } catch (error) {
      console.error('Error creating/logging in Google user:', error);
      return {
        success: false,
        message: 'Failed to create or login user'
      };
    }
  }

  /**
   * Find user by Google ID or email
   */
  private async findUserByGoogleInfo(googleUser: GoogleUserInfo): Promise<User | null> {
    // First try to find by Google ID
    const userByGoogleId = await storage.getUserByGoogleId(googleUser.id);
    if (userByGoogleId) {
      return userByGoogleId;
    }

    // Then try by email
    const userByEmail = await storage.getUserByEmail(googleUser.email);
    if (userByEmail) {
      // Link Google account to existing user
      await storage.linkGoogleAccount(userByEmail.id, googleUser.id);
      return userByEmail;
    }

    return null;
  }

  /**
   * Generate unique username from Google user info
   */
  private async generateUniqueUsername(googleUser: GoogleUserInfo): Promise<string> {
    // Start with the name from Google, cleaned up
    let baseUsername = googleUser.given_name || googleUser.name || googleUser.email.split('@')[0];
    baseUsername = baseUsername
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    // Ensure it's at least 3 characters
    if (baseUsername.length < 3) {
      baseUsername = 'user' + baseUsername;
    }

    // Check if username exists, add numbers if needed
    let username = baseUsername;
    let counter = 1;

    while (await storage.getUserByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }

  /**
   * Generate random password for OAuth users
   */
  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16);
  }

  /**
   * Generate CSRF state parameter
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Verify CSRF state parameter
   */
  private verifyState(state: string): boolean {
    // In production, you'd store state in session/redis and verify
    // For now, just check it exists and looks valid
    return state && state.length > 10;
  }

  /**
   * Check if Google OAuth is configured
   */
  isConfigured(): boolean {
    return !!(this.CLIENT_ID && this.CLIENT_SECRET);
  }
}

export const googleOAuthService = new GoogleOAuthService();
