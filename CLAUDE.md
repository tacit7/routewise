# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

## special instructions

You are Pragmatic straightforward, no bullshit. Match my tone. Tell it like it is. No sugar-coating.No pseudo-questions.Full sentences, real clarity. Sound smart, grounded, direct like you're actually helping. If you think Im making bad design decssions you should tell me.
whenever you wanna start or stop the server, please ask to user first to do it themselves.
Same goes for small Commands
and file edits

### Core Development

- `npm run dev` - Start Vite development server on port 3001
- `npm run build` - Build for production using Vite
- `npm run start` - Run production build using Vite preview
- `npm run check` - TypeScript type checking

### Testing

- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:performance` - Run performance tests

## Recent Updates - August 7, 2025 - Session 21

### MSW Complete Removal
- **REMOVED**: MSW (Mock Service Worker) completely removed from project
- **Reason**: Migrated to Phoenix backend, MSW no longer needed
- **Deleted**: All mock files, MSW dependencies, Vite configuration
- **Replaced**: Mock data with inline DEFAULT_INTEREST_CATEGORIES in types/interests.ts

### Phoenix Backend Integration Complete
- **Endpoint**: `/api/route-results` working correctly with 15 POIs
- **City Autocomplete**: Fixed to use `/api/places/autocomplete` with `input` parameter
- **API Key**: Google Maps API key configuration resolved by backend team

### Critical Fixes Applied
- **TypeScript Runtime Errors**: Added optional chaining to prevent "Cannot read properties of undefined"
- **Variable Naming Conflicts**: Resolved scope conflicts in route-results query function
- **React Query Caching**: Disabled for development debugging (needs re-enabling for prod)
- **404 Import Errors**: Fixed all references to deleted MSW files

## Previous Updates - January 2, 2025

### City Autocomplete Enhancements
- **Downshift Migration**: Migrated from shadcn/ui Command/Popover to downshift v9.0.10 for better accessibility
- **API Optimization**: Switched from Google Places API to custom `/api/places/city-autocomplete` endpoint
- **Browser Caching**: Implemented TanStack Query caching with 30-minute stale time and popular cities prefetching
- **Performance**: ~80% reduction in API calls through intelligent caching and background prefetching

### Key Files Updated
- `client/src/hooks/use-city-autocomplete.ts` - NEW: TanStack Query caching hook
- `client/src/hooks/use-places-autocomplete.ts` - Updated to use cached version  
- `client/src/components/place-autocomplete.tsx` - Migrated to downshift v9 with semantic HTML
- `client/src/App.tsx` - Added popular cities prefetching on startup

## Architecture Overview

### Project Structure

This is a React frontend application that connects to a Phoenix backend:

- **`client/`** - React frontend (Vite + React 18)
- **Backend**: Phoenix backend running on port 4001 (separate repository)
- **Types**: Local type definitions in `client/src/types/schema.ts`

### Technology Stack

**Frontend:**

- React 18 with TypeScript and ES modules
- Vite for development and builds
- Wouter for client-side routing (lightweight React Router alternative)
- TanStack Query for server state management
- Tailwind CSS + shadcn/ui components
- React Hook Form + Zod validation

**Backend (Phoenix):**

- Phoenix/Elixir backend on port 4001
- PostgreSQL database
- JWT authentication
- Google Places API integration
- RESTful API endpoints

### Key Architecture Patterns

**Authentication System:**

- JWT-based authentication with HTTP-only cookies
- Google OAuth integration with manual environment loading
- AuthContext React provider for client-side state
- AuthMiddleware for server-side route protection
- Separate auth-routes.ts for all authentication endpoints

**Data Layer:**

- Drizzle ORM schema in `shared/schema.ts`
- Storage abstraction in `server/storage.ts` (supports both PostgreSQL and in-memory)
- Type-safe database operations with shared TypeScript types

**API Integration:**

- Google Places API service with caching and fallback to mock data
- Google Directions API for route planning
- Nominatim service for geocoding (no API key required)
- Development API caching system in `dev-api-cache.ts`
- Consolidated dashboard API endpoint for performance optimization

**Environment Handling:**

- Complex environment variable loading in `server/index.ts`
- Manual .env file parsing to ensure OAuth credentials are loaded correctly
- Support for multiple .env file locations

## Development Workflow

### Environment Setup

1. OAuth services (Google) require server restart after credential changes
2. Environment variables are loaded manually on server startup
3. MSW can be enabled/disabled via environment variable for testing

### Database Development

- Uses PostgreSQL in production with Drizzle ORM
- Falls back to in-memory storage when DATABASE_URL not configured
- Schema changes pushed via `npm run db:push`

### API Development

- Real Google APIs used when API keys configured
- Automatic fallback to mock data when APIs unavailable
- Development cache system reduces API calls during development

### Authentication Development

- Google OAuth requires specific redirect URI configuration
- Local development uses `http://localhost:3001/api/auth/google/callback`
- AuthContext automatically handles OAuth success/error URL parameters

## Key Files and Services

### Core Server Files

- `server/index.ts` - Main server entry with environment loading
- `server/routes.ts` - Core API routes for places, trips, routing
- `server/auth-routes.ts` - Authentication endpoints
- `server/storage.ts` - Database abstraction layer

### Authentication Components

- `server/auth-service.ts` - JWT token management and user operations
- `server/google-oauth-service.ts` - Google OAuth integration
- `client/src/components/auth-context.tsx` - Client authentication state

### State Management

- Redux Toolkit with redux-persist for global state
- TanStack Query for server state and caching
- Local storage integration for trip planning

### Frontend Core

- `client/src/App.tsx` - Main app with Redux and TanStack Query providers
- `client/src/pages/home.tsx` - Landing page with route planning
- `client/src/pages/route-results.tsx` - Route display with POI integration
- `client/src/types/schema.ts` - TypeScript type definitions

## Important Notes

### Phoenix Backend Integration

- Phoenix backend must be running on port 4001 for API endpoints
- Vite proxy configuration handles API forwarding automatically
- All authentication and data operations handled by Phoenix

### MSW Integration

- Mock Service Worker provides fallback when Phoenix unavailable
- Mock responses stored in `client/src/mocks/handlers.ts`
- Toggle with `MSW_DISABLED` environment variable

### State Management Architecture

- Redux Toolkit for global application state
- TanStack Query for server state and API caching
- Redux-persist for state persistence across sessions

### Development Server

- Vite development server runs on port 3001
- Hot module replacement for fast development
- TypeScript support with strict type checking
- Proxy configuration forwards API calls to Phoenix backend

## Migration Notes - January 8, 2025

### Express to Phoenix Migration
- **Removed**: Express.js backend, server directory, shared schema directory
- **Added**: Local type definitions in `client/src/types/schema.ts`
- **Updated**: Vite configuration to proxy API calls to Phoenix on port 4001
- **Migrated**: All API calls now go through Phoenix backend
- **State Management**: Implemented Redux Toolkit with redux-persist for global state
