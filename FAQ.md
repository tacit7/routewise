
## Session: August 11, 2025 - TanStack Query Caching Debug & Vite Proxy Issue

### TanStack Query Hiding Network Requests Due to Caching
**Question:** Why are API requests not appearing in browser Network tab, and requests going to wrong port (3002 instead of 4001)?
**Error/Issue:** API requests for `/api/places/autocomplete` not visible in Network tab, appearing to hit frontend port 3002 instead of backend port 4001 via Vite proxy
**Context:** TanStack Query aggressive caching (30-minute staleTime) masking actual network requests, making proxy debugging impossible
**Solution:** Temporarily disable TanStack Query caching to force fresh network requests and verify Vite proxy configuration
**Code:**
```typescript
// Before: Aggressive caching hiding network requests
return useQuery({
  queryKey: ['cities', normalizedQuery, limit, countries],
  queryFn: async () => { /* API call */ },
  staleTime: 1000 * 60 * 30, // 30 minutes - prevents network requests
  gcTime: 1000 * 60 * 60 * 2, // 2 hours garbage collection
});

// After: Debugging mode with disabled caching
return useQuery({
  queryKey: ['cities', normalizedQuery, limit, countries], 
  queryFn: async () => { /* API call */ },
  staleTime: 0, // DEBUGGING: Always fetch fresh (disable cache)
  gcTime: 0, // DEBUGGING: Don't cache responses
});
```
**Additional Debugging Steps:**
1. **Install TanStack Query DevTools** for cache inspection:
   ```bash
   npm install @tanstack/react-query-devtools
   ```
2. **Enhanced Vite Proxy Logging** for request tracing:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:4001',
       changeOrigin: true,
       configure: (proxy, _options) => {
         proxy.on('proxyReq', (proxyReq, req, _res) => {
           console.log('🔄 Proxying request:', req.method, req.url, '→', proxyReq.path);
         });
         proxy.on('proxyRes', (proxyRes, req, _res) => {
           console.log('✅ Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
         });
       },
     }
   }
   ```
**Date:** August 11, 2025
**Project:** [[Route-Wise Frontend]]
**Status:** Solved

#tanstack-query #vite #proxy #caching #debugging #network-requests
**Related:** [[TanStack Query Optimization]] [[Vite Configuration]]
---

## Session: August 6, 2025 - Dashboard API Consolidation Implementation

### Dashboard API Consolidation Implementation
**Question:** How to implement consolidated `/api/dashboard` endpoint to replace multiple individual API calls on dashboard page?
**Error/Issue:** Dashboard making 3-4 separate API calls causing slow loading (~450ms total)
**Context:** Implementing dashboard API integration per DASHBOARD_API_INTEGRATION.md specification to improve performance by ~44%
**Solution:** Created consolidated endpoint with parallel data fetching, React Query hook, and updated dashboard component
**Code:**
```typescript
// server/routes.ts - Consolidated endpoint
app.get("/api/dashboard", 
  AuthMiddleware.authenticate,
  async (req, res) => {
    const userId = (req as any).user?.id;
    const [userTrips, suggestedTrips, interestCategories, userInterests] = await Promise.all([
      tripService.getUserTrips(userId, 5),
      suggestedTripsService.getSuggestedTripsWithRateLimit(userId, 4),
      interestsService.getInterestCategories(),
      interestsService.getUserInterests(userId)
    ]);
    // Return structured dashboard data...
  }
);

// client/src/hooks/use-dashboard-data.ts
export function useDashboardData() {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async () => {
      const response = await authenticatedApiCall<{success: true; data: DashboardData}>('/api/dashboard');
      return response.data;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```
**Date:** August 6, 2025
**Project:** [[Route-Wise Frontend]]
**Status:** Solved

#api #performance #react-query #authentication
**Related:** [[Dashboard Component Migration]]
---

### Vite Proxy ECONNREFUSED Error Resolution
**Question:** How to fix "http proxy error: /api/pois AggregateError [ECONNREFUSED]" in Vite development?
**Error/Issue:** `[vite] http proxy error: /api/pois AggregateError [ECONNREFUSED]: at internalConnectMultiple (node:net:1117:18)`
**Context:** Frontend Vite proxy trying to forward API requests but backend server not running
**Solution:** Backend server must be running on port 4001 for Vite proxy configuration to work. Cache clearing resolved unexpected API responses.
**Code:**
```javascript
// vite.config.ts - Proxy configuration
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4001',
      changeOrigin: true,
      secure: false,
    },
  },
}

// Start backend server
npm run dev  // Starts server on port 4001
```
**Date:** August 6, 2025
**Project:** [[Route-Wise Frontend]]
**Status:** Solved

#vite #proxy #backend #connection
**Related:** [[Backend Server Configuration]]
---

### Dashboard Component Migration from Individual Hooks
**Question:** How to update dashboard.tsx to use consolidated API instead of multiple individual hooks?
**Error/Issue:** Dashboard still using `useTrips`, `useSuggestedTrips`, `useUserInterests` causing multiple API calls
**Context:** Migrating dashboard page to use new consolidated `/api/dashboard` endpoint for performance
**Solution:** Replaced individual hooks with single `useDashboardData` hook and extracted data from consolidated response
**Code:**
```typescript
// Before: Multiple individual hooks
const { trips: suggestedTrips, isLoading: isLoadingSuggested } = useSuggestedTrips(4);
const { enabledInterestNames, isLoading: isLoadingInterests } = useUserInterests();
const { trips: userTrips, loading: isLoadingUserTrips } = useTrips();

// After: Single consolidated hook
const { data: dashboardData, isLoading, error } = useDashboardData();
const userTrips = dashboardData?.trips.user_trips || [];
const suggestedTrips = dashboardData?.trips.suggested_trips || [];
const enabledInterestNames = dashboardData?.suggested_interests || [];
```
**Date:** August 6, 2025
**Project:** [[Route-Wise Frontend]]
**Status:** Solved

#react #hooks #migration #performance
**Related:** [[Dashboard API Consolidation]]
---

### Authentication vs Mock Data API Response Conflicts
**Question:** Why is dashboard API returning unexpected mock data instead of authentication errors?
**Error/Issue:** Dashboard endpoint returning different response format with `"user":null` instead of expected 401 error
**Context:** Testing consolidated dashboard API endpoint but getting cached/mock responses
**Solution:** Clearing cache resolved the issue - was serving old cached responses instead of new authenticated endpoint
**Code:**
```typescript
// Expected authenticated endpoint behavior
app.get("/api/dashboard", AuthMiddleware.authenticate, async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  // ... authenticated logic
});
```
**Date:** August 6, 2025
**Project:** [[Route-Wise Frontend]]
**Status:** Solved

#authentication #cache #api #debugging
**Related:** [[Dashboard API Consolidation]]
---

### First-Time User Hook Dependencies in Dashboard
**Question:** How to handle `useFirstTimeUser` hook making individual API calls that we want to consolidate?
**Error/Issue:** `useFirstTimeUser` hook calling `useUserInterests` causing 404 errors for `/api/users/16/interests`
**Context:** Dashboard using `useFirstTimeUser` hook but it imports individual hooks we're trying to replace
**Solution:** Removed `useFirstTimeUser` from dashboard imports and implemented simplified first-time user logic based on consolidated dashboard data
**Code:**
```typescript
// Removed problematic hook dependency
// import { useFirstTimeUser } from "@/hooks/use-first-time-user";

// Simple first-time user logic based on dashboard data
const hasInterestsConfigured = enabledInterestNames.length > 0;
const shouldShowFirstTimeExperience = !hasInterestsConfigured && !isLoading;
```
**Date:** August 6, 2025
**Project:** [[Route-Wise Frontend]]
**Status:** Solved - Need to implement dashboard-specific first-time user logic for new users

#hooks #dependencies #first-time-user #dashboard
**Related:** [[Dashboard Component Migration]]
---

## Session: August 5, 2025 - OAuth Debugging & MCP Sequential Thinking

### Phoenix Log File Binary/Unreadable Issue
**Question:** "why is the phoenix.log a binary why cant i read it"
**Error/Issue:** Phoenix log file appearing as binary data instead of readable text
**Context:** Trying to debug Google OAuth integration issues by reading server logs
**Solution:** Fixed logger configuration by adding logger_file_backend dependency and proper format configuration with line breaks in dev.exs
**Code:**
```elixir
# In mix.exs - add dependency
{:logger_file_backend, "~> 0.0.13"}

# In config/dev.exs - configure file logging
config :logger, backends: [:console, {LoggerFileBackend, :info_log}]

config :logger, :info_log,
  path: "phoenix.log",
  level: :info,
  format: "$time [$level] $message
",
  metadata: [:request_id]
```
**Date:** August 5, 2025
**Project:** [[RouteWise Phoenix Backend]]
**Status:** Solved

#phoenix #logging #debugging #logger-file-backend #development
**Related:** [[Phoenix Configuration]] [[Development Tools]]
---

### Google OAuth Frontend URL Resolution Fix
**Question:** User getting 404 when clicking "Sign up with Google" despite correct backend configuration
**Error/Issue:** Google OAuth flow not initiating properly, frontend button not navigating to correct backend URL
**Context:** Frontend using relative URL for OAuth initiation, causing incorrect resolution to frontend port instead of backend port
**Solution:** Changed frontend Google sign-in button to use absolute URL pointing to Phoenix backend
**Code:**
```javascript
// Before (incorrect - resolves to frontend port)
window.location.href = '/api/auth/google';

// After (correct - absolute URL to backend)  
window.location.href = 'http://localhost:4001/api/auth/google';
```
**Date:** August 5, 2025
**Project:** [[RouteWise Phoenix Backend]]
**Status:** Solved

#frontend #oauth #google #url-resolution #react #typescript
**Related:** [[Google OAuth]] [[Frontend Backend Communication]]
---

### Sequential Thinking MCP for Complex Debugging
**Question:** "Do you have access to the MCB servers sequential thinking?"
**Context:** User asking about available MCP servers for systematic debugging of complex OAuth flow issues
**Solution:** Confirmed access to Sequential Thinking MCP server and used it to systematically analyze the OAuth redirect problem. The MCP correctly identified that relative URLs in cross-port setups can resolve to wrong origins.
**Code:**
```javascript
// MCP Sequential Thinking helped identify the root cause:
// Relative URL '/api/auth/google' was resolving to:
// ❌ http://localhost:3001/api/auth/google (frontend)
// Instead of:
// ✅ http://localhost:4001/api/auth/google (backend)
```
**Date:** August 5, 2025
**Project:** [[RouteWise Phoenix Backend]]
**Status:** Solved

#mcp #sequential-thinking #debugging #problem-solving #oauth #url-resolution
**Related:** [[MCP Servers]] [[Debugging Strategies]] [[Complex Problem Solving]]
---

### Phoenix Development Workflow - Hot Reloading vs Manual Compilation
**Question:** "do i have to compile and the run to make changes appear in the app"
**Context:** Understanding Phoenix development workflow and when server restart is required
**Solution:** Phoenix has built-in hot code reloading for most changes. Manual compilation not needed for controllers, views, templates, routes. Server restart only required for configuration changes, dependencies, schema changes, and environment variables.
**Code:**
```bash
# Changes that hot reload automatically:
# - Controllers, contexts, views
# - Templates and routes  
# - Most Elixir code

# Changes requiring server restart:
# - config/dev.exs, config/runtime.exs
# - mix.exs dependency changes
# - Environment variables
# - Database migrations (need: mix ecto.migrate)
```
**Date:** August 5, 2025
**Project:** [[RouteWise Phoenix Backend]]
**Status:** Solved

#phoenix #development #hot-reloading #workflow #configuration
**Related:** [[Phoenix Development]] [[Development Workflow]]
---

### Frontend OAuth Success/Error Route Implementation
**Question:** Implied need for frontend routes to handle OAuth completion
**Context:** Phoenix backend redirecting to /auth/success and /auth/error but frontend missing these routes
**Solution:** Created AuthSuccess and AuthError page components and added routes to App.tsx to handle OAuth flow completion
**Code:**
```typescript
// Added routes in App.tsx
import AuthSuccess from "@/pages/auth-success";
import AuthError from "@/pages/auth-error";

// In router:
<Route path="/auth/success" component={AuthSuccess} />
<Route path="/auth/error" component={AuthError} />

// AuthSuccess component handles:
// - Success message display
// - User authentication refresh
// - Automatic redirect to dashboard
```
**Date:** August 5, 2025
**Project:** [[RouteWise Phoenix Backend]]
**Status:** Solved

#frontend #oauth #react #routing #authentication #success-handling
**Related:** [[OAuth Flow]] [[Frontend Routing]] [[Authentication]]
---
