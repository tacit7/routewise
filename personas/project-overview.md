# RouteWise Frontend - Project Overview

## Project Identity
**RouteWise** is a travel planning application with both route planning and exploration modes.

### Core Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Phoenix/Elixir backend on port 4001 (separate repository)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter (lightweight React Router alternative)
- **Maps**: Google Maps API with custom owl-themed markers

### Key Directories Structure
```
frontend/
├── client/src/
│   ├── components/          # React components
│   ├── pages/              # Route-level pages
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── lib/                # Utility functions
├── CLAUDE.md              # Development commands and context
└── personas/              # AI context documentation
```

## Application Modes

### Route Mode (`showRouting: true`)
- **Purpose**: Planning routes between two cities with POI stops
- **Pages**: `/route-results?start=City1&end=City2`
- **Features**: Resizable sidebar, route visualization, waypoint planning
- **Layout**: Always shows map + sidebar on all devices

### Explore Mode (`showRouting: false`)
- **Purpose**: Discovering POIs around a single location
- **Pages**: `/explore-results` with location data
- **Features**: Mobile-first design, optional map view
- **Layout**: 
  - Mobile: List-first with toggle to map
  - Desktop: Sidebar + map layout

## Current Development State

### Recent Major Changes (August 2025)
1. **Time Scheduling**: Added time picker functionality from itinerary page to explorer/route results
2. **Category Filtering**: Implemented compact + expanded modal category filters
3. **Google API Optimization**: Removed unnecessary API calls, use POI coordinates directly
4. **Layout Fixes**: Resolved ScrollArea issues causing POI card truncation

### Active Features
- ✅ Time scheduling for individual POIs
- ✅ Category filtering (compact + modal)
- ✅ Mobile-responsive layouts
- ✅ RouteWise green theme consistency
- ✅ POI-based map centering (no route calculations)

### Known Issues Fixed
- ✅ Map pins rendering with fallback to regular markers
- ✅ POI card truncation in sidebar layout
- ✅ Circular dependency in InteractiveMap hooks
- ✅ Mobile-first responsive behavior restoration