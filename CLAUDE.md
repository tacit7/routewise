# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

## special instructions

You are Pragmatic straightforward, no bullshit. Match my tone. Tell it like it is. No sugar-coating.No pseudo-questions.Full sentences, real clarity. Sound smart, grounded, direct like you're actually helping. If you think Im making bad design decssions you should tell me.
whenever you wanna start or stop the server, please ask to user first to do it themselves.
Same goes for small Commands
and file edits

### Core Development

- `npm run dev` - Start development server with hot reload on port 3001
- `npm run dev:no-msw` - Start development server with MSW (Mock Service Worker) disabled
- `npm run build` - Build for production (client + server bundle)
- `npm run start` - Run production build on port 3001
- `npm run check` - TypeScript type checking

### Database Operations

- `npm run db:push` - Push database schema changes using Drizzle ORM

### Testing

- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report

### MSW (Mock Service Worker)

- `npm run msw:init` - Initialize MSW for API mocking
- MSW can be disabled with `MSW_DISABLED=true` environment variable
- Mock responses stored in `client/src/mocks/` and `server/` directories

## Architecture Overview

### Project Structure

This is a full-stack TypeScript application with a monorepo structure:

- **`client/`** - React frontend (Vite + React 18)
- **`server/`** - Express.js backend with TypeScript
- **`shared/`** - Shared types and database schema (Drizzle ORM)

### Technology Stack

**Frontend:**

- React 18 with TypeScript and ES modules
- Vite for development and builds
- Wouter for client-side routing (lightweight React Router alternative)
- TanStack Query for server state management
- Tailwind CSS + shadcn/ui components
- React Hook Form + Zod validation

**Backend:**

- Express.js with TypeScript ES modules
- PostgreSQL with Drizzle ORM (supports Neon Database)
- In-memory storage fallback for development
- JWT authentication with Google OAuth support
- Google Places API integration

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

### API Services

- `server/google-places.ts` - Google Places API with caching
- `server/google-directions.ts` - Google Directions API
- `server/nominatim-service.ts` - Open-source geocoding service
- `server/routes.ts` - Main API routes including consolidated `/api/dashboard` endpoint

### Frontend Core

- `client/src/App.tsx` - Main app with providers (Query, Auth, Toast)
- `client/src/pages/home.tsx` - Landing page with route planning
- `client/src/pages/route-results.tsx` - Route display with POI integration

## Important Notes

### Google OAuth Setup

- OAuth service singleton must be restarted after environment changes
- Uses dynamic environment variable reading to handle initialization timing
- Redirect URI must match Google Cloud Console configuration

### MSW Integration

- Mock Service Worker can be toggled for development/testing
- Mock responses stored in multiple locations for different services
- Automatic fallback when real APIs unavailable

### Database Schema

- Users table supports both local and OAuth authentication
- POIs table for points of interest with Google Places integration
- Trips table for saving complete routes with JSON data

### Development Server

- Runs on port 3001 in development
- Vite dev server proxy integrated with Express backend
- Hot reload for both client and server code

### Dashboard API Performance Optimization

- Consolidated `/api/dashboard` endpoint replaces multiple individual API calls
- Parallel data fetching using Promise.all() for optimal performance
- Single React Query hook (`useDashboardData`) replaces multiple individual hooks
- Authentication-aware caching with 5-minute stale time
- ~44% performance improvement (450ms → 250ms load time)
- Property mapping: `start_city/end_city` in API response vs. `startLocation/endLocation` in components
