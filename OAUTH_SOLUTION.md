# OAuth Authentication Solution - Complete Guide

## Overview

This document provides the **complete, definitive solution** for Google OAuth authentication in RouteWise. This problem has been solved multiple times, and this guide exists to prevent recurring issues by documenting every detail of the working implementation.

## 🚨 Critical Problem Statement

**Issue**: OAuth authentication fails with 404 or 401 errors when user clicks Sign Up button.

**Root Causes Identified**:
1. Route conflicts in Phoenix backend (duplicate routes in different pipelines)
2. Vite proxy configuration missing `/auth` routes
3. Frontend API config pointing to wrong endpoints
4. Authentication routes in wrong Phoenix pipeline (`:authenticated` vs `:auth_browser`)

## ✅ Complete Working Solution

### 1. Phoenix Backend Configuration

#### Router Configuration (`/phoenix-backend/lib/phoenix_backend_web/router.ex`)

**CRITICAL**: Only ONE OAuth route should exist, and it MUST be in the `:auth_browser` pipeline:

```elixir
# CORRECT PIPELINE - Use this one
pipeline :auth_browser do
  plug :accepts, ["html"]
  plug :fetch_session
  plug :protect_from_forgery
  plug :put_secure_browser_headers
  plug Ueberauth
end

# OAuth routes - MUST be in auth_browser pipeline
scope "/auth", RouteWiseApiWeb do
  pipe_through :auth_browser
  get "/:provider", AuthController, :request
  get "/:provider/callback", AuthController, :google_callback
end
```

**❌ REMOVE THIS** - Do NOT have duplicate routes like:
```elixir
# DELETE - This causes conflicts
scope "/api", RouteWiseApiWeb do
  pipe_through :authenticated
  get "/auth/google", AuthController, :google_auth  # ← DELETE THIS LINE
end
```

### 2. Frontend Configuration

#### Vite Proxy Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
      // CRITICAL: Auth proxy is required
      '/auth': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // ... rest of config
});
```

#### API Configuration (`client/src/lib/api-config.ts`)

```typescript
export const API_ENDPOINTS = {
  // CORRECT - Use /auth/google (no /api prefix)
  GOOGLE_AUTH: '/auth/google',
  
  // Other endpoints use /api prefix
  AUTH_ME: '/api/auth/me',
  LOGOUT: '/api/auth/logout',
} as const;
```

#### Home Page Sign Up Button (`client/src/pages/home.tsx`)

```tsx
// CORRECT implementation
<Button 
  onClick={() => {
    window.location.href = '/auth/google';
  }}
  className="..."
>
  Sign Up
</Button>
```

**❌ WRONG**: Don't navigate to `/register` route that doesn't exist:
```tsx
// DELETE - This doesn't work
<Button onClick={() => navigate('/register')}>
```

### 3. Authentication Flow Verification

#### Complete Flow Steps:

1. **User clicks Sign Up** → `window.location.href = '/auth/google'`
2. **Vite proxy forwards** → `localhost:3001/auth/google` → `localhost:4001/auth/google`
3. **Phoenix router matches** → `:auth_browser` pipeline → `AuthController.request`
4. **Ueberauth redirects** → Google OAuth consent screen
5. **User authorizes** → Google redirects to callback
6. **Phoenix handles callback** → Creates/updates user, generates JWT
7. **Redirect to frontend** → `localhost:3001/?success=google_auth`
8. **AuthContext updates** → User logged in

### 4. Environment Requirements

#### Phoenix Backend (`config/dev.exs` or environment variables):
```elixir
config :ueberauth, Ueberauth.Strategy.Google.OAuth,
  client_id: System.get_env("GOOGLE_CLIENT_ID"),
  client_secret: System.get_env("GOOGLE_CLIENT_SECRET")
```

#### Required Environment Variables:
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

### 5. Debugging Commands

#### Check Phoenix Server Status:
```bash
# In phoenix-backend directory
mix phx.server
# Should show server running on port 4001
```

#### Check Frontend Development Server:
```bash
# In frontend directory
npm run dev
# Should show Vite server on port 3001 with proxy config
```

#### Test OAuth Flow:
1. Navigate to `http://localhost:3001`
2. Click "Sign Up" button
3. Should redirect to Google OAuth (not show 404)
4. After authorization, should return to app with success message

### 6. Network Tab Debugging

#### Expected Network Requests:
1. `GET http://localhost:3001/auth/google` → Status 302 (redirect)
2. `GET https://accounts.google.com/oauth/authorize?...` → Google OAuth page
3. `GET http://localhost:3001/auth/google/callback?code=...` → Status 302 (redirect)
4. `GET http://localhost:3001/?success=google_auth` → Status 200

#### Common Error Patterns:
- **404 on `/auth/google`** → Vite proxy not configured or Phoenix not running
- **401 on OAuth initiation** → Routes in wrong pipeline (should be `:auth_browser`)
- **500 on callback** → Missing Google credentials or callback handler issue

### 7. File Locations Summary

| Component | File Path | Key Content |
|-----------|-----------|-------------|
| Phoenix Router | `phoenix-backend/lib/phoenix_backend_web/router.ex` | OAuth routes in `:auth_browser` pipeline |
| Vite Config | `frontend/vite.config.ts` | `/auth` proxy configuration |
| API Config | `frontend/client/src/lib/api-config.ts` | `GOOGLE_AUTH: '/auth/google'` |
| Home Page | `frontend/client/src/pages/home.tsx` | Sign Up button implementation |
| Auth Context | `frontend/client/src/components/auth-context.tsx` | OAuth success handling |

### 8. Troubleshooting Checklist

Before making any changes, verify:

- [ ] Phoenix server running on port 4001
- [ ] Frontend server running on port 3001
- [ ] Only ONE OAuth route exists in Phoenix router (in `:auth_browser` pipeline)
- [ ] Vite proxy includes both `/api` and `/auth` routes
- [ ] API config uses `/auth/google` (no `/api` prefix)
- [ ] Google OAuth credentials configured in Phoenix
- [ ] Sign Up button uses `window.location.href = '/auth/google'`

### 9. Version Information

This solution was tested and confirmed working with:
- Phoenix/Elixir backend on port 4001
- React + Vite frontend on port 3001
- Ueberauth + Google OAuth strategy
- Google Cloud Console OAuth 2.0 credentials

### 10. Emergency Fix Commands

If OAuth breaks again, run these commands in order:

```bash
# 1. Check Phoenix router for conflicts
grep -n "auth.*google" phoenix-backend/lib/phoenix_backend_web/router.ex

# 2. Check Vite proxy config
grep -A 10 "proxy" frontend/vite.config.ts

# 3. Check API config
grep "GOOGLE_AUTH" frontend/client/src/lib/api-config.ts

# 4. Test the flow
curl -I http://localhost:3001/auth/google
```

## 🔒 Final Notes

**DO NOT**:
- Add duplicate OAuth routes in different Phoenix pipelines
- Use `/api/auth/google` endpoint (use `/auth/google`)
- Navigate to `/register` route (use OAuth flow)
- Skip the Vite `/auth` proxy configuration

**ALWAYS**:
- Keep OAuth routes in `:auth_browser` pipeline only
- Include both `/api` and `/auth` in Vite proxy
- Use `window.location.href = '/auth/google'` for OAuth initiation
- Test the complete flow after any routing changes

This solution has been tested multiple times and works consistently when all components are configured correctly.