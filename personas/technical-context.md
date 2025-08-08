# Technical Context & Architecture

## Core Technologies & Dependencies

### Frontend Stack
```json
{
  "framework": "React 18 + TypeScript",
  "bundler": "Vite",
  "styling": "Tailwind CSS + shadcn/ui",
  "routing": "Wouter",
  "state": "TanStack Query",
  "forms": "React Hook Form + Zod",
  "maps": "Google Maps API"
}
```

### Key Components Architecture

#### PlacesView (Core Layout Component)
- **Location**: `client/src/components/places-view.tsx`
- **Purpose**: Unified layout for both route and explore modes
- **Key Props**:
  - `showRouting: boolean` - Determines route vs explore mode
  - `pois: (POI | Poi)[]` - Array of Points of Interest
  - `onPoiHover/Click/Select` - Event handlers for map interaction

#### InteractiveMap (Map Component)
- **Location**: `client/src/components/interactive-map.tsx`
- **Features**: 
  - Custom owl-themed SVG markers
  - POI-based centering (no route calculations)
  - Fallback to regular markers if AdvancedMarkerElement unavailable
- **Recent Changes**: Removed Google API calls for routing/geocoding

#### PoiCard (POI Display Component)
- **Location**: `client/src/components/poi-card.tsx`
- **Variants**: `compact`, `grid`, `default`
- **New Features**: Time scheduling integration via TimeScheduler

### State Management Patterns

#### POI Data Flow
1. **Route Results**: Phoenix `/api/route-results` → TanStack Query → PlacesView
2. **Explore Results**: `useExploreResults` hook → PlacesView  
3. **Time Scheduling**: Local state in PlacesView with Map<poiId, timeString>

#### Theme System
Uses CSS custom properties defined in `client/src/index.css`:
```css
:root {
  --primary: hsl(160 84% 36%);      /* RouteWise green */
  --primary-50: hsl(160 60% 96%);   /* Hover backgrounds */
  --text: hsl(215 18% 18%);         /* Primary text */
  --text-muted: hsl(215 12% 42%);   /* Secondary text */
}
```

## Data Types & Interfaces

### POI Type Definition
```typescript
interface Poi {
  id: number;
  placeId: string;
  name: string;
  address: string;
  rating: string;
  category: string;
  lat: number;          // or latitude
  lng: number;          // or longitude
  scheduledTime?: string; // "HH:MM" format
}
```

### Component Prop Patterns
- **Event Handlers**: `onPoiClick: (poi: POI | Poi) => void`
- **State Props**: `selectedPoiIds: number[]`, `hoveredPoi: POI | Poi | null`
- **Time Scheduling**: `onTimeChange: (poiId: number, newTime: string) => void`

## Performance & Optimization

### API Usage Strategy
- **Minimal Google Maps API calls**: Only basic map display + markers
- **POI coordinate usage**: Direct lat/lng from backend, no geocoding
- **Caching**: TanStack Query handles server state caching
- **Route calculation**: Removed to reduce API costs

### Mobile-First Approach
- **Explore Mode**: POI list first on mobile, map optional
- **Route Mode**: Always show map on all devices
- **Touch Targets**: Minimum 44px touch targets for mobile
- **Responsive Grid**: Dynamic columns based on sidebar width

## Development Workflow

### Key Commands (from CLAUDE.md)
- `npm run dev` - Development server on port 3001
- `npm run build` - Production build
- `npm run check` - TypeScript checking

### Code Style Preferences
- **Pragmatic & Direct**: No unnecessary verbosity
- **Evidence-based**: Measure before optimizing
- **Mobile-first**: Design for mobile, enhance for desktop
- **Type Safety**: Comprehensive TypeScript usage