# RouteWise - Road Trip Planning Application

## Overview

RouteWise is a full-stack web application designed to help users plan memorable road trips by discovering amazing stops along their routes. The application combines route planning with curated point-of-interest (POI) recommendations, featuring a modern React frontend with a Node.js/Express backend.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Development Storage**: In-memory storage for development/demo purposes

### Key Components

1. **Route Planning System**
   - Form-based input for start and destination cities
   - Google Maps integration for route generation
   - Real-time route planning with external API integration

2. **Point of Interest (POI) Management**
   - Curated database of attractions, restaurants, parks, and scenic spots
   - Category-based organization (restaurant, park, attraction, scenic, market, historic)
   - Rating and review count display
   - Image gallery integration with Unsplash

3. **User Interface Components**
   - Responsive design optimized for desktop and mobile
   - Component library based on Radix UI primitives
   - Toast notifications for user feedback
   - Loading states and error handling

## Data Flow

1. **Route Planning Flow**:
   - User inputs start and destination cities
   - Form validation using Zod schemas
   - Google Maps URL generation and external navigation
   - Success/error feedback via toast notifications

2. **POI Discovery Flow**:
   - POIs fetched from backend API on page load
   - Data cached using React Query for performance
   - Category-based filtering and display
   - Image lazy loading for optimal performance

3. **Data Storage**:
   - Development: In-memory storage with sample data
   - Production: PostgreSQL database with Drizzle ORM
   - Shared TypeScript schemas for type safety

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React, Wouter, TanStack Query
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Form Management**: React Hook Form, Zod
- **Icons**: Lucide React, FontAwesome
- **Date Handling**: date-fns

### Backend Dependencies
- **Server**: Express.js, tsx for development
- **Database**: Drizzle ORM, @neondatabase/serverless
- **Validation**: Zod schemas shared between frontend/backend
- **Session Management**: connect-pg-simple for session storage

### Third-Party Integrations
- **Google Maps**: Route planning and navigation
- **Unsplash**: High-quality images for POI display
- **Neon Database**: Serverless PostgreSQL hosting
- **FontAwesome**: Icon library for category indicators

## Deployment Strategy

### Development Environment
- **Local Development**: npm run dev with hot module replacement
- **Port Configuration**: Frontend on port 5000, proxied through Vite
- **Database**: Local PostgreSQL or Neon Database connection
- **Asset Serving**: Vite handles static assets and HMR

### Production Deployment
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Deployment Target**: Replit Autoscale with Node.js 20
- **Database Migrations**: Drizzle Kit for schema management
- **Static Assets**: Served from dist/public directory

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment detection (development/production)
- **Session Management**: PostgreSQL-backed sessions in production

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 15, 2025: Route results page with Google API integration
  - Added dedicated route results page with route visualization
  - Implemented Google Places API integration for authentic place data
  - Enhanced POI cards with real addresses, ratings, photos, and business hours
  - Added graceful fallback handling for API permission limitations
  - System fetches 60+ authentic places from Google Places API
  - Identified and addressed Maps Embed API permission requirements
  - Comprehensive "Things to Do" section with category filters and statistics

## Changelog

- June 15, 2025. Initial setup with sample data
- June 15, 2025. Google Places API integration with real place data