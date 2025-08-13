# OAuth Setup Guide

Complete guide for setting up Google OAuth authentication in the RouteWise application.

## Overview

RouteWise uses server-side OAuth with Phoenix/Elixir backend and React frontend. The authentication flow uses JWT tokens stored in HTTP-only cookies for security.

## Google Console Configuration

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Select **Web application** as the application type

### 2. Configure Authorized Origins

Add these URLs to **Authorized JavaScript origins**:

```
http://localhost:3001
http://127.0.0.1:3001
```

**Note**: Only include ports you actually use. Remove unused ports (3002, 3003, etc.) to avoid confusion.

### 3. Configure Redirect URIs

Add this URL to **Authorized redirect URIs**:

```
http://localhost:3001/auth/google/callback
```

**Important**: The redirect URI must point to your **backend** (Phoenix) callback endpoint, not the frontend.

### 4. Environment Variables

Copy your Client ID and Client Secret and add them to your `.env` file:

```bash
# .env (in project root)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Phoenix Backend Setup

### 1. Dependencies

Add these dependencies to `mix.exs`:

```elixir
defp deps do
  [
    # ... other deps
    {:ueberauth, "~> 0.10"},
    {:ueberauth_google, "~> 0.12"},
    {:guardian, "~> 2.3"}
  ]
end
```

### 2. Configuration

Add to `config/config.exs`:

```elixir
# Ueberauth configuration
config :ueberauth, Ueberauth,
  providers: [
    google: {Ueberauth.Strategy.Google, [
      default_scope: "email profile",
      prompt: "consent"
    ]}
  ]

config :ueberauth, Ueberauth.Strategy.Google.OAuth,
  client_id: System.get_env("GOOGLE_CLIENT_ID"),
  client_secret: System.get_env("GOOGLE_CLIENT_SECRET")

# Guardian JWT configuration
config :phoenix_backend, RouteWiseApi.Guardian,
  issuer: "route_wise_api",
  secret_key: "your_very_long_secret_key_here"
```

### 3. Router Configuration

Add OAuth routes to `router.ex`:

```elixir
# Google OAuth routes (handles ueberauth)
scope "/auth", RouteWiseApiWeb do
  pipe_through :oauth
  get "/google", AuthController, :request
  get "/google/callback", AuthController, :callback
end
```

**Critical**: Do NOT add `/success` or `/error` routes in Phoenix - these should be handled by the frontend.

### 4. OAuth Pipeline

Add an OAuth pipeline to `router.ex`:

```elixir
pipeline :oauth do
  plug :accepts, ["html"]
  plug :fetch_session
  plug :put_secure_browser_headers
  plug Ueberauth
end
```

### 5. AuthController Implementation

Key functions in `auth_controller.ex`:

```elixir
def request(conn, _params) do
  # Initiates OAuth flow - handled by Ueberauth plug
  conn
end

def callback(conn, _params) do
  case conn.assigns[:ueberauth_auth] do
    %Ueberauth.Auth{} = auth ->
      # Create user from Google data
      case Accounts.find_or_create_user_from_google(google_user_info) do
        {:ok, user} ->
          # Generate JWT token
          case Guardian.encode_and_sign(user) do
            {:ok, token, _claims} ->
              # Set HTTP-only cookie and redirect to frontend
              conn
              |> put_resp_cookie("auth_token", token, [
                http_only: true,
                secure: conn.scheme == :https,
                same_site: "Lax",
                max_age: 7 * 24 * 60 * 60
              ])
              |> redirect(external: "#{frontend_url()}/auth/success?token=#{token}")
          end
      end
  end
end

defp frontend_url do
  "http://localhost:3001"
end
```

## Frontend Setup

### 1. Vite Proxy Configuration

Configure `vite.config.ts` to proxy only OAuth initiation to Phoenix:

```typescript
export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/auth/google': {  // Only proxy OAuth initiation, not success/error
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
```

**Critical**: Only proxy `/auth/google` routes to Phoenix. Do NOT proxy all `/auth` routes.

### 2. React Router Configuration

Add OAuth routes to `App.tsx`:

```tsx
<Switch>
  {/* ... other routes */}
  <Route path="/auth/success" component={AuthSuccess} />
  <Route path="/auth/error" component={AuthError} />
</Switch>
```

### 3. OAuth Success Component

Create `pages/auth-success.tsx`:

```tsx
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/components/auth-context';

export default function AuthSuccess() {
  const [, navigate] = useLocation();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      // Refresh auth context (cookie is already set by backend)
      await checkAuth();
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    };

    handleOAuthSuccess();
  }, [checkAuth, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
        <p className="text-gray-600">
          Successfully signed in with Google. Redirecting...
        </p>
      </div>
    </div>
  );
}
```

### 4. Sign-In Button Implementation

In your navigation component:

```tsx
const handleSignIn = () => {
  window.location.href = '/auth/google';  // This gets proxied to Phoenix
};

<Button onClick={handleSignIn}>
  Sign In with Google
</Button>
```

## Running the Application

### 1. Start Phoenix Backend

**Critical**: Use `dotenv` to load environment variables:

```bash
cd phoenix-backend
dotenv mix phx.server
```

### 2. Start React Frontend

```bash
cd frontend
npm run dev
```

## Authentication Flow

1. **User clicks "Sign In"** → Browser navigates to `/auth/google`
2. **Vite proxy forwards** → Phoenix backend at `localhost:4001/auth/google`
3. **Phoenix initiates OAuth** → Redirects to Google OAuth consent screen
4. **User authorizes** → Google redirects to `localhost:4001/auth/google/callback`
5. **Phoenix processes callback** → Creates user, generates JWT, sets HTTP-only cookie
6. **Phoenix redirects to frontend** → `localhost:3001/auth/success?token=xyz`
7. **Frontend handles success** → `AuthSuccess` component loads, refreshes auth context
8. **Frontend redirects** → User goes to dashboard, fully authenticated

## Troubleshooting Session: OAuth Routing Issues

During development, we encountered a complex routing issue where OAuth success redirects were hitting the Phoenix backend instead of the React frontend. Here's what happened and how we solved it:

### The Problem

**Symptoms:**
- OAuth flow worked correctly through Google authentication
- User creation and JWT token generation succeeded in Phoenix
- Phoenix attempted to redirect to `localhost:3001/auth/success`
- Instead of reaching the React frontend, requests hit Phoenix backend
- Phoenix returned `Phoenix.Router.NoRouteError at GET /auth/success`

**Initial Investigation:**
1. Confirmed Google Console was configured correctly
2. Verified Phoenix OAuth implementation was working
3. Found OAuth success/error were properly logged in Phoenix
4. Confirmed frontend was running on port 3001

### Root Cause Analysis

We discovered **two separate issues** causing the routing problems:

#### Issue 1: Conflicting Phoenix Routes

Phoenix router had fallback routes that were intercepting frontend redirects:

```elixir
# PROBLEMATIC - These routes intercepted frontend requests
scope "/auth", RouteWiseApiWeb do
  pipe_through :oauth
  get "/google", AuthController, :request
  get "/google/callback", AuthController, :callback
  get "/success", AuthController, :oauth_success_fallback  # ← PROBLEM
  get "/error", AuthController, :oauth_error_fallback      # ← PROBLEM
end
```

#### Issue 2: Overly Broad Vite Proxy Configuration

Vite was proxying **all** `/auth` requests to Phoenix:

```typescript
// PROBLEMATIC - Proxied ALL /auth requests to Phoenix
proxy: {
  '/auth': {
    target: 'http://localhost:4001',
    changeOrigin: true,
  }
}
```

This meant `/auth/success` requests were being forwarded to Phoenix instead of being handled by the React router.

### The Solution

#### Step 1: Remove Conflicting Phoenix Routes

Removed the fallback routes from Phoenix router:

```elixir
# FIXED - Only OAuth initiation routes
scope "/auth", RouteWiseApiWeb do
  pipe_through :oauth
  get "/google", AuthController, :request
  get "/google/callback", AuthController, :callback
  # Removed /success and /error routes - frontend handles these
end
```

#### Step 2: Fix Vite Proxy Configuration

Changed proxy to only forward OAuth initiation to Phoenix:

```typescript
// FIXED - Only proxy OAuth initiation, not success/error
proxy: {
  '/api': {
    target: 'http://localhost:4001',
    changeOrigin: true,
  },
  '/auth/google': {  // Specific path instead of broad /auth
    target: 'http://localhost:4001',
    changeOrigin: true,
    secure: false,
  }
}
```

### Key Lessons Learned

1. **Proxy Specificity Matters**: Broad proxy rules can unintentionally capture frontend routes
2. **Route Ownership**: Be explicit about which routes belong to backend vs frontend
3. **Environment Dependencies**: Phoenix must be started with `dotenv` to load OAuth credentials
4. **Debug Logging**: Comprehensive logging in Phoenix helped identify where the flow was breaking
5. **Network Investigation**: Tools like `lsof -i :3001` helped understand port conflicts

### Debugging Techniques Used

1. **Phoenix Debug Logging**: Added comprehensive logs to OAuth controller functions
2. **Network Analysis**: Checked which process was listening on port 3001
3. **Route Inspection**: Manually tested frontend routes vs backend routes
4. **Proxy Analysis**: Examined Vite proxy logs to see request forwarding
5. **Browser Network Tab**: Monitored actual HTTP requests during OAuth flow

### Final Verification

After fixes, the OAuth flow worked perfectly:
- ✅ `/auth/google` → Phoenix (OAuth initiation)
- ✅ `/auth/google/callback` → Phoenix (OAuth processing)  
- ✅ `/auth/success` → React frontend (success handling)
- ✅ `/auth/error` → React frontend (error handling)

The key insight was that both the Phoenix backend AND the Vite proxy needed to be configured to respect the frontend's ownership of success/error routes.

## Common Issues

### 1. "Google Maps API key not configured"

**Cause**: Phoenix backend not started with environment variables
**Solution**: Use `dotenv mix phx.server` instead of `mix phx.server`

### 2. OAuth redirect hits Phoenix instead of frontend

**Causes**:
- Conflicting routes in Phoenix router
- Overly broad Vite proxy configuration

**Solutions**:
- Remove `/success` and `/error` routes from Phoenix
- Use specific proxy path (`/auth/google`) instead of broad (`/auth`)
- Restart Vite dev server after proxy changes

### 3. "Invalid redirect URI" from Google

**Cause**: Mismatch between Google Console configuration and actual callback URL
**Solution**: Ensure redirect URI in Google Console matches your Phoenix callback endpoint

### 4. JWT token not working

**Causes**:
- Guardian not properly configured
- Cookie settings incompatible with browser
- Frontend not including cookies in requests

**Solutions**:
- Verify Guardian secret key configuration
- Use `same_site: "Lax"` for local development
- Ensure API requests include credentials

## Security Considerations

1. **HTTP-only Cookies**: Prevents XSS attacks on tokens
2. **Secure Flag**: Enable in production with HTTPS
3. **SameSite Protection**: Use "Lax" for development, "Strict" for production
4. **Token Expiration**: Set reasonable max_age for cookies
5. **Environment Variables**: Never commit OAuth secrets to version control
6. **CORS Configuration**: Ensure proper CORS settings for frontend-backend communication

## Production Deployment

When deploying to production:

1. **Update Google Console**: Add production domains to authorized origins/redirects
2. **Environment Variables**: Configure production OAuth credentials
3. **HTTPS**: Enable secure flag on cookies
4. **Domain Configuration**: Update `frontend_url()` function in Phoenix
5. **Proxy Configuration**: Update Vite build configuration for production API endpoints