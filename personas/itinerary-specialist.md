# Itinerary Specialist - RouteWise Frontend

Comprehensive context for working on the itinerary planning page and related components.

## Overview

The itinerary page (`/itinerary`) is the core trip planning interface where users organize their saved POIs into daily schedules. It's a complex multi-component system handling drag-and-drop, state management, map visualization, and localStorage persistence.

## Component Architecture

### 1. Main Component: `itinerary.tsx`
- **Purpose**: Main orchestrator for itinerary planning
- **State Management**: Days, active day, assigned places, trip title, map toggle
- **Key Features**:
  - Multi-day trip organization
  - Drag-and-drop place assignment
  - Auto-generated trip titles based on cities
  - localStorage persistence for drafts
  - Authentication-gated save functionality

### 2. Sidebar: `DailyItinerarySidebar.tsx`
- **Purpose**: Day-specific place management
- **Key Features**:
  - Displays scheduled places for selected day
  - Time scheduling for each place
  - Drag-and-drop reordering
  - Place removal functionality
  - Map toggle button

### 3. Places Grid: `TripPlacesGrid.tsx`
- **Purpose**: Displays unassigned places available for scheduling
- **Key Features**:
  - Grid layout of available places
  - Drag-and-drop source for assignment
  - Drop zone for unscheduling places
  - Independent map visualization
  - Separate localStorage state

### 4. Interactive Map: `InteractiveMap.tsx`
- **Purpose**: Visual representation of places with Google Maps
- **Key Features**:
  - Custom owl-themed markers
  - POI clustering and info windows
  - Add to trip functionality
  - Responsive zoom controls

## Data Flow & State Management

### Core State Structure
```typescript
// Main itinerary state
const [activeDay, setActiveDay] = useState(0);
const [assignedPlaceIds, setAssignedPlaceIds] = useState<Set<string | number>>();
const [days, setDays] = useState<DayData[]>([initial_day]);
const [tripTitle, setTripTitle] = useState("");
const [showMap, setShowMap] = useState(boolean); // localStorage: "itinerary.showMap"
```

### Type System
```typescript
// Core types from types/itinerary.ts
interface ItineraryPlace extends Poi {
  dayIndex?: number;
  scheduledTime?: string; // "HH:MM" 24-hour format
  dayOrder?: number;
  notes?: string;
}

interface DayData {
  date: Date;
  title?: string;
  places: ItineraryPlace[];
  mileage?: number;
  driveTime?: string;
}
```

### State Persistence
- **Draft Storage**: `localStorage.itineraryData` (JSON serialized)
- **Map Toggle**: `localStorage.itinerary.showMap` (boolean)
- **TripPlacesGrid Map**: `localStorage.tripPlaces.showMap` (separate state)

## Known Issues & Technical Debt

### 1. Critical Bug: Map Toggle Not Working
**Location**: `itinerary.tsx:227`
```typescript
// BROKEN
onToggleMap={setShowMap}

// SHOULD BE
onToggleMap={() => setShowMap(!showMap)}
```
**Root Cause**: `setShowMap` expects boolean, but gets called without parameters (undefined)

### 2. localStorage Inconsistency
- `itinerary.tsx` uses key: `"itinerary.showMap"`
- `TripPlacesGrid.tsx` uses key: `"tripPlaces.showMap"`
- Results in different toggle states across components

### 3. Missing localStorage Persistence
`itinerary.tsx` loads `showMap` from localStorage but doesn't save changes back.

### 4. Incomplete Save Functionality
Save button has empty onClick handler: `onClick={() => {}}` (line 179)

## Key Integration Points

### Authentication Context
```typescript
const { isAuthenticated } = useAuth();
// Affects save functionality and UI messaging
```

### Trip Places Hook
```typescript
const { tripPlaces } = useTripPlaces();
// Source data for itinerary planning
```

### Navigation
- Entry from `/route-results` page
- Back navigation preserves route results state

## UI/UX Patterns

### Drag & Drop System
- **Source**: `TripPlacesGrid` cards
- **Target**: `DailyItinerarySidebar` drop zone
- **Data Transfer**: JSON serialized `ItineraryPlace`
- **Visual Feedback**: Opacity changes, drag-over highlighting

### Tab Navigation
- Day-based tabs with dynamic generation
- Active day state drives content switching
- Add new day functionality

### Responsive Design
- Sidebar + main content layout
- Map toggle between grid and map views
- Mobile considerations for drag-and-drop

## Development Guidelines

### State Updates
- Use immutable patterns for day array updates
- Maintain `assignedPlaceIds` Set in sync with day places
- Preserve scheduling metadata during transfers

### Error Handling
- Graceful fallbacks for missing trip data
- localStorage parsing with try/catch
- Map initialization error states

### Performance Considerations
- Memoize expensive computations (unassigned places)
- Efficient drag state management
- Minimize re-renders during drag operations

## Design System Guidelines

### RouteWise Design System Tokens
The itinerary page follows RouteWise's comprehensive design system with standardized tokens:

**Core Components Used**:
- `Button` - All interactive actions (save, back, add day, toggle)
- `Card` - Place cards, day containers, main layout sections  
- `Badge` - Category tags, status indicators
- `Input` - Trip title, time scheduling with proper token usage
- `Tabs` - Day navigation system
- `ScrollArea` - Scrollable content areas
- `Tooltip` - Help text and action descriptions

### Design System Token Reference

**Background Tokens**:
- `bg-bg` - Main page background
- `bg-surface` - Card and panel backgrounds
- `bg-surface-alt` - Alternate surface color for contrast
- `bg-primary` - Primary brand color for actions
- `bg-primary/90` - Primary hover state (90% opacity)
- `bg-primary/10` - Primary tinted backgrounds

**Text Tokens**:
- `text-fg` - Primary text color (replaces `text-gray-900`)
- `text-muted-fg` - Secondary text (replaces `text-gray-500`, `text-gray-600`)
- `text-primary` - Primary brand text color
- `text-primary-fg` - Text on primary backgrounds (white)

**Border & Ring Tokens**:
- `border-border` - Standard border color
- `ring-ring` - Focus ring color
- `ring-offset-bg` - Focus ring offset color

**Required Interactive Patterns**:
```tsx
// Input fields MUST use this pattern
<Input className="bg-surface text-fg border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg hover:bg-surface/95 active:bg-surface/90" />

// Buttons MUST use consistent primary styling  
<Button className="bg-primary text-primary-fg hover:bg-primary/90">Save Trip</Button>

// Cards and surfaces MUST use proper tokens
<Card className="bg-surface border border-border hover:bg-surface/95">

// Text links MUST follow this pattern
<a className="text-primary hover:opacity-90">Link Text</a>
```

### Design Patterns to Follow

**Card Layouts**:
```tsx
// REQUIRED: Use design system tokens for all card components
<Card className="bg-surface border border-border hover:bg-surface/95 group cursor-move">
  <CardContent className="p-3">
    <h3 className="text-fg font-semibold">Place Name</h3>
    <p className="text-muted-fg text-sm">Place details</p>
  </CardContent>
</Card>
```

**Button Hierarchy** (ALL buttons must use these exact patterns):
```tsx
// Primary actions - Save, Create, Add to Trip
<Button className="bg-primary text-primary-fg hover:bg-primary/90">Save Trip</Button>

// Secondary actions - Back, Cancel
<Button variant="outline" className="border-border text-fg hover:bg-surface/95">Back</Button>

// Ghost actions - Map toggle, minimal interactions  
<Button variant="ghost" className="text-fg hover:bg-surface/95">Toggle Map</Button>

// Destructive actions - Delete, Remove
<Button variant="destructive" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</Button>
```

**Standardized Interactive States**:
```tsx
// Surfaces (cards, panels, dropzones)
className="bg-surface hover:bg-surface/95 active:bg-surface/90"

// Text links
className="text-primary hover:opacity-90"  

// Focus rings (REQUIRED on ALL interactive elements)
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
```

**Spacing & Layout**:
- Use Tailwind spacing scale consistently (`p-3`, `p-4`, `p-6`)
- Consistent gaps in flex/grid layouts (`gap-2`, `gap-3`, `gap-4`)
- Responsive breakpoints following Tailwind conventions

**Typography Scale**:
- `text-2xl font-bold` - Page titles
- `text-xl font-semibold` - Section headers  
- `text-base` - Body text
- `text-sm` - Supporting text
- `text-xs` - Meta information, timestamps

### Animation & Transitions
- `transition-all duration-200` - Standard interactive elements
- `animate-spin` - Loading states
- `opacity-0 group-hover:opacity-100` - Reveal on hover
- Drag visual feedback with opacity and scale transforms

## Common Development Tasks

### Adding New Features
1. Update type definitions in `types/itinerary.ts`
2. Extend state management in main component
3. Update localStorage schema if needed
4. Add UI components with proper prop threading
5. Follow shadcn/ui patterns and consistent color scheme

### Testing Checklist
- [ ] Drag and drop between components
- [ ] Map toggle functionality
- [ ] localStorage persistence
- [ ] Multi-day operations
- [ ] Authentication boundary behavior
- [ ] Mobile responsiveness
- [ ] Design consistency across components
- [ ] Color scheme adherence
- [ ] shadcn/ui component proper usage

## Quick Fixes Needed
1. Fix map toggle callback: `onToggleMap={() => setShowMap(!showMap)}`
2. Add useEffect for localStorage persistence of showMap
3. Implement save functionality
4. Standardize localStorage keys across components
5. **CRITICAL: Update ALL components to use design system tokens**:
   - Replace ALL hardcoded colors (`bg-white`, `text-gray-900`, `text-slate-500`, etc.)
   - Use required interactive patterns for inputs, buttons, cards
   - Apply standardized focus rings to ALL interactive elements
   - Use `bg-surface hover:bg-surface/95 active:bg-surface/90` for surfaces
   - Use `text-primary hover:opacity-90` for text links
   - Ensure primary buttons use `bg-primary text-primary-fg hover:bg-primary/90`
6. **Update existing itinerary components**:
   - `itinerary.tsx` - Apply design tokens to main page
   - `DailyItinerarySidebar.tsx` - Update cards and dropzones 
   - `TripPlacesGrid.tsx` - Update place cards and interactions
   - `interactive-map.tsx` - Replace hardcoded colors with tokens
7. Ensure all new components follow mandatory design system patterns

## File Locations
- Main: `client/src/pages/itinerary.tsx`
- Sidebar: `client/src/components/DailyItinerarySidebar.tsx`
- Grid: `client/src/components/TripPlacesGrid.tsx`
- Map: `client/src/components/interactive-map.tsx`
- Types: `client/src/types/itinerary.ts`
- Utils: `client/src/utils/itinerary.ts`
