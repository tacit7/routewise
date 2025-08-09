/**
 * FedCM-compliant Google Authentication Service
 * Uses modern Credential Management API with FedCM support
 */

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          prompt: (callback?: (notification: PromptMomentNotification) => void) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
          disableAutoSelect: () => void;
          storeCredential: (credential: { id: string; password: string }) => void;
          cancel: () => void;
          onGoogleLibraryLoad: () => void;
          revoke: (hint: string, callback: (done: RevocationResponse) => void) => void;
        };
      };
    };
  }

  // FedCM support for Credential Management API
  interface CredentialRequestOptions {
    identity?: {
      providers: IdentityProvider[];
    };
  }

  interface IdentityProvider {
    configURL: string;
    clientId: string;
  }

  interface IdentityCredential extends Credential {
    token: string;
  }
}

interface GoogleInitConfig {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string;
  locale?: string;
}

interface CredentialResponse {
  credential: string; // JWT ID token
  select_by?: string;
}

interface PromptMomentNotification {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
  getMomentType: () => string;
}

interface RevocationResponse {
  successful: boolean;
  error?: string;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
}

class GoogleAuthService {
  private initialized = false;
  private clientId: string;
  private currentUser: GoogleUser | null = null;
  private idToken: string | null = null;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (!this.clientId) {
      console.warn('Google Client ID not found. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.');
    }
    this.loadStoredAuth();
  }

  /**
   * Initialize Google Identity Services
   */
  async initialize(): Promise<void> {
    if (!this.clientId) {
      throw new Error('Google Client ID is required. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.');
    }

    return new Promise((resolve, reject) => {
      // Wait for Google library to load
      const checkGoogleLibrary = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: this.clientId,
              callback: this.handleCredentialResponse.bind(this),
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            this.initialized = true;
            resolve();
          } catch (error) {
            console.error('Google Identity Services initialization failed:', error);
            reject(error);
          }
        } else {
          // Retry in 100ms
          setTimeout(checkGoogleLibrary, 100);
        }
      };
      checkGoogleLibrary();
    });
  }

  /**
   * Handle Google credential response
   */
  private handleCredentialResponse(response: CredentialResponse): void {
    try {
      const userData = this.parseJWT(response.credential);
      this.currentUser = {
        id: userData.sub,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        email_verified: userData.email_verified,
        given_name: userData.given_name,
        family_name: userData.family_name,
      };
      this.idToken = response.credential;
      this.storeAuth();
      
      // Dispatch custom event for auth state change
      window.dispatchEvent(new CustomEvent('googleAuthStateChanged', { 
        detail: { user: this.currentUser, token: this.idToken } 
      }));
    } catch (error) {
      console.error('Failed to handle credential response:', error);
      this.signOut();
    }
  }

  /**
   * Parse JWT token to extract user data
   */
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Modern FedCM-compliant sign in
   */
  async signIn(): Promise<GoogleUser> {
    // Try FedCM first (future-proof)
    if (this.isFedCMSupported()) {
      try {
        return await this.signInWithFedCM();
      } catch (error) {
        console.log('FedCM failed, falling back to Google Identity Services:', error);
      }
    }

    // Fallback to Google Identity Services
    return this.signInWithGIS();
  }

  /**
   * Check if FedCM is supported
   */
  private isFedCMSupported(): boolean {
    return 'credentials' in navigator && 'get' in navigator.credentials;
  }

  /**
   * Sign in using FedCM (Federated Credential Management)
   */
  private async signInWithFedCM(): Promise<GoogleUser> {
    try {
      const credential = await navigator.credentials.get({
        identity: {
          providers: [{
            configURL: 'https://accounts.google.com/gsi/fedcm.json',
            clientId: this.clientId,
          }]
        }
      } as CredentialRequestOptions) as IdentityCredential;

      if (credential && credential.token) {
        // Parse the ID token
        const userData = this.parseJWT(credential.token);
        const user: GoogleUser = {
          id: userData.sub,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          email_verified: userData.email_verified,
          given_name: userData.given_name,
          family_name: userData.family_name,
        };

        this.currentUser = user;
        this.idToken = credential.token;
        this.storeAuth();

        // Dispatch auth state change
        window.dispatchEvent(new CustomEvent('googleAuthStateChanged', { 
          detail: { user: this.currentUser, token: this.idToken } 
        }));

        return user;
      } else {
        throw new Error('No credential received from FedCM');
      }
    } catch (error) {
      console.error('FedCM sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Fallback: Sign in with Google Identity Services
   */
  private async signInWithGIS(): Promise<GoogleUser> {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      // Set up one-time listener for auth state change
      const handleAuthChange = (event: CustomEvent) => {
        window.removeEventListener('googleAuthStateChanged', handleAuthChange as EventListener);
        if (event.detail.user) {
          resolve(event.detail.user);
        } else {
          reject(new Error('Google sign-in failed'));
        }
      };
      window.addEventListener('googleAuthStateChanged', handleAuthChange as EventListener);

      // Trigger Google One Tap or sign-in prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: could implement popup flow here if needed
          window.removeEventListener('googleAuthStateChanged', handleAuthChange as EventListener);
          reject(new Error('Google sign-in was cancelled or not displayed'));
        }
      });
    });
  }

  /**
   * Sign out user
   */
  signOut(): void {
    if (this.currentUser && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    this.currentUser = null;
    this.idToken = null;
    this.clearStoredAuth();
    
    // Dispatch auth state change
    window.dispatchEvent(new CustomEvent('googleAuthStateChanged', { 
      detail: { user: null, token: null } 
    }));
  }

  /**
   * Get current user
   */
  getCurrentUser(): GoogleUser | null {
    return this.currentUser;
  }

  /**
   * Get current ID token
   */
  getIdToken(): string | null {
    return this.idToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.idToken !== null && !this.isTokenExpired();
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.idToken) return true;
    
    try {
      const payload = this.parseJWT(this.idToken);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Store auth data in localStorage
   */
  private storeAuth(): void {
    if (this.currentUser && this.idToken) {
      localStorage.setItem('google_user', JSON.stringify(this.currentUser));
      localStorage.setItem('google_token', this.idToken);
    }
  }

  /**
   * Load stored auth data
   */
  private loadStoredAuth(): void {
    try {
      const storedUser = localStorage.getItem('google_user');
      const storedToken = localStorage.getItem('google_token');
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.idToken = storedToken;
        
        // Check if token is expired
        if (this.isTokenExpired()) {
          this.signOut();
        }
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Clear stored auth data
   */
  private clearStoredAuth(): void {
    localStorage.removeItem('google_user');
    localStorage.removeItem('google_token');
  }

  /**
   * Render Google Sign-In button
   */
  renderButton(element: HTMLElement, options: Partial<GoogleButtonConfig> = {}): void {
    if (!this.initialized) {
      this.initialize().then(() => {
        this.renderButton(element, options);
      });
      return;
    }

    const defaultOptions: GoogleButtonConfig = {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: '100%',
    };

    window.google.accounts.id.renderButton(element, { ...defaultOptions, ...options });
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuthService();
export type { GoogleUser };