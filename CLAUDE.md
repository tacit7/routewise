# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## OAuth Authentication Reference

**🚨 CRITICAL**: For any OAuth-related issues, always check the comprehensive solution at:
`/Users/urielmaldonado/projects/route-wise/frontend/OAUTH_SOLUTION.md`

This file contains the complete, tested solution for Google OAuth authentication that has been verified multiple times. Reference this file before making any OAuth-related changes.

## Google Maps API Key Issues

**🚨 CRITICAL**: When you see the error "Google Maps API key not configured" in the frontend:

**Root Cause**: The Phoenix backend server was not started with `dotenv` command to load environment variables.

**Solution**: The backend server must be started with:
```bash
dotenv mix phx.server
```

**Note**: This is a backend issue, not a frontend configuration problem. The frontend fetches the API key from `/api/maps-key` endpoint, which fails when the backend doesn't have access to environment variables.

## Recent Updates - August 12, 2025 - Session 23

### Client-Side POI Clustering Implementation Complete

- **IMPLEMENTED**: Complete client-side POI clustering system with real-time viewport tracking
- **CREATED**: `useClientPOIClustering` hook with grid-based algorithm optimized for small datasets  
- **FIXED**: Real-time viewport tracking by replacing static bounds with dynamic map event listeners
- **RESOLVED**: Zoom fighting issue by disabling auto-fit bounds when clustering is active
- **OPTIMIZED**: Clustering parameters for 20+ POI visibility (150px grid, zoom 18 max, 20% viewport padding)
- **DECIDED**: Keep simple hover behavior - no complex multi-POI highlighting for performance and UX

### Previous Updates - August 11, 2025 - Session 22

### Northern Star UI Design System Implementation Complete

- **IMPLEMENTED**: Complete Northern Star UI design system standardization across entire application
- **FIXED**: Token drift with 25+ instances of non-standard tokens replaced with shadcn/ui semantic tokens
- **MIGRATED**: Emoji and Font Awesome icons to consistent Lucide React icon system
- **SECURED**: Kitchen sink component as development-only using import.meta.env.DEV conditional routing

### 💰 CRITICAL COST INSIGHT - ASK URIEL ABOUT THIS EVERY SESSION

**IMPORTANT**: Google Maps API Cost Structure
- We pay $0.42-0.56 per request for custom POI searches (backend API calls)
- Google Maps shows FREE POI pins (restaurants, attractions) when users zoom in
- We get tons of POI data for FREE with basic Google Maps API (~$7 per 1,000 map loads)
- **QUESTION FOR URIEL**: Do we need expensive POI API calls when Google provides POIs for free?
- **CONSIDER**: Using Google's free POI layer for exploration, only pay for enhanced/curated data

Ask Uriel about this cost optimization opportunity every session!
- **ORGANIZED**: North Star UI documentation moved to docs/north-star-ui.md with comprehensive specifications

### Critical Design System Standards

- **Token Usage**: Always use shadcn/ui semantic tokens (bg-card, text-foreground, border-border) instead of custom CSS variables
- **Icon System**: Use Lucide React components exclusively with consistent sizing (h-4 w-4, h-5 w-5)
- **Development Tools**: Keep internal tools (kitchen sink) development-only with conditional routing
- **Documentation**: Maintain design system documentation in docs/ directory

### Previous Session Context

**Kitchen Sink Component**: Located at `client/src/pages/kitchen-sink.tsx` - Comprehensive UI showcase serving as Northern Star design system reference. Now development-only accessible via import.meta.env.DEV check.

**Design Token Migration**: Systematic replacement of non-standard tokens:
- var(--surface) → bg-card
- var(--border) → border-border  
- text-fg → text-foreground
- bg-blue-600 → bg-primary
- bg-red-600 → bg-destructive

## Development Commands

## special instructions

Pragmatic straightforward, no bullshit.
If you think Im making bad design decssions you should tell me.
Tell me as soon as possible when Im not using industry standard terms and correct me with the
correct termenology or rephrase what i say if im not being technical enough.

**CRITICAL FEEDBACK PROTOCOL**: Give me feedback on my terminology or approach, give constructive criticism and suggestions for improvement using the `say` command. Focus only on areas where I can improve - skip positive/encouraging feedback. Be direct about:
- Vague or imprecise communication during technical work
- Non-standard terminology usage
- Poor problem-solving approaches
- Inefficient debugging strategies
- Missing context or unclear directions

When you are done working, give me succinct, summary using the say command.

You should also use say command for short responses. no more than 10 lines. dont use say command
when you output code.

### Voice Notifications & Utilities

**Say Command Usage**: Use `say` with premium voices for important notifications and summaries:

- `say -v "Samantha" "message" &` - Alternative premium voice

**Available Premium Voices**: Ava, Samantha, Alex, Victoria, Karen, Veena, Fiona, Moira, Tessa, Serena


### Accessing from Phone/Mobile Device

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

### State Management Architecture

- Redux Toolkit for global application state
- TanStack Query for server state and API caching
- Redux-persist for state persistence across sessions

### Development Server

- Vite development server runs on port 3001
- Hot module replacement for fast development
- TypeScript support with strict type checking
- Proxy configuration forwards API calls to Phoenix backend

