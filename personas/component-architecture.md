# Component Architecture & Patterns

## Core Component Hierarchy

```
App
├── Router (Wouter)
├── TanStack Query Provider
└── Pages
    ├── RouteResults → PlacesView (showRouting=true)
    └── ExploreResults → PlacesView (showRouting=false)
```

## PlacesView (Master Layout Component)

**Location**: `client/src/components/places-view.tsx`

### Component Responsibility
- **Layout orchestration** for both route and explore modes
- **Responsive behavior** management (mobile vs desktop)
- **State management** for POI interactions and scheduling
- **Event coordination** between map and sidebar

### Key Props Interface
```typescript
interface PlacesViewProps {
  // Core data
  startLocation: string;
  endLocation?: string;
  pois: (POI | Poi)[];
  isLoading: boolean;
  
  // Mode configuration
  showRouting?: boolean; // Route vs Explore mode
  
  // Event handlers (map interaction)
  onPoiClick: (poi: POI | Poi) => void;
  onPoiSelect: (poiId: number, selected: boolean) => void;
  onPoiHover: (poi: POI | Poi | null) => void;
  
  // Parent-managed state
  selectedPoiIds: number[];
  hoveredPoi: POI | Poi | null;
}
```

### Layout Logic
```typescript
// Mobile: Simple conditional rendering
{isMobile ? (
  isMapVisible ? <FullScreenMap /> : <FullScreenPOIList />
) : (
  // Desktop: ResizablePanelGroup
  <ResizablePanelGroup>
    <ResizablePanel>POI Sidebar</ResizablePanel>
    <ResizableHandle />
    <ResizablePanel>Interactive Map</ResizablePanel>
  </ResizablePanelGroup>
)}
```

### State Management Patterns
```typescript
// Time scheduling
const [scheduledTimes, setScheduledTimes] = useState<Map<number, string>>(new Map());

// Mobile responsiveness  
const [isMobile, setIsMobile] = useState(false);
const [isMapVisible, setIsMapVisible] = useState(false);

// Mobile-first logic
if (showRouting) {
  setIsMapVisible(true); // Route mode: always show map
} else {
  setIsMapVisible(!mobile); // Explore mode: list-first on mobile
}
```

## InteractiveMap Component

**Location**: `client/src/components/interactive-map.tsx`

### Key Features
- **POI-based centering**: Uses actual POI coordinates, no API calls
- **Custom owl markers**: SVG-based themed markers with category colors
- **Fallback strategy**: Regular markers if AdvancedMarkerElement unavailable
- **Interactive info windows**: Click-to-show POI details with "Add to Trip"

### Marker Creation Pattern
```typescript
// Check API availability, fallback gracefully
if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
  marker = new google.maps.marker.AdvancedMarkerElement({
    position: { lat, lng },
    content: customOwlMarkerElement,
    map: mapInstanceRef.current,
  });
} else {
  // Fallback to regular markers
  marker = new google.maps.Marker({
    position: { lat, lng },
    icon: svgToDataUrl(owlMarkerSVG),
    map: mapInstanceRef.current,
  });
}
```

### Coordinate Handling
```typescript
// Handle both coordinate formats
const lat = poi.lat || poi.latitude;
const lng = poi.lng || poi.longitude;

// Skip invalid coordinates
const hasCoords = (poi.lat && poi.lng) || (poi.latitude && poi.longitude);
if (!hasCoords) {
  console.warn('POI missing coordinates:', poi.name);
  return;
}
```

## PoiCard Component

**Location**: `client/src/components/poi-card.tsx`

### Variants & Usage
- **`compact`**: Sidebar display, minimal info
- **`grid`**: Desktop grid layout, medium info  
- **`default`**: Full card with all details

### Time Scheduling Integration
```typescript
interface PoiCardProps {
  poi: Poi;
  variant?: 'default' | 'grid' | 'compact';
  showTimeScheduler?: boolean;
  onTimeChange?: (poiId: number, newTime: string) => void;
}

// Usage in PlacesView
<PoiCard 
  poi={{...poi, scheduledTime: scheduledTimes.get(poi.id)}} 
  variant={isGridLayout ? "grid" : "compact"}
  showTimeScheduler={true}
  onTimeChange={handleTimeChange}
/>
```

## CategoryFilter Component

**Location**: `client/src/components/category-filter.tsx`

### Two-Phase Design
1. **Compact Mode**: Circular category icons in header
2. **Expanded Mode**: Modal with hierarchical categories

### Hover Effect Pattern (JavaScript-based)
```typescript
// Tailwind hover classes didn't work, use event handlers
onMouseEnter={(e) => {
  if (selectedCategory !== id) {
    e.currentTarget.style.backgroundColor = 'var(--primary-50)';
    e.currentTarget.style.color = 'var(--primary)';
  }
}}
```

## TimeScheduler Component

**Location**: `client/src/components/time-scheduler.tsx`

### Reusable Time Input
```typescript
interface TimeSchedulerProps {
  scheduledTime?: string;    // "HH:MM" format
  onTimeChange: (newTime: string) => void;
  size?: "sm" | "md" | "lg";
}

// Styled with RouteWise theme
<div className="time-pill inline-flex items-center">
  <Clock className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
  <input
    type="time"
    value={scheduledTime || '09:00'}
    onChange={(e) => onTimeChange(e.target.value)}
    className="bg-transparent border-none"
  />
</div>
```

## Data Flow Patterns

### POI Data Pipeline
```
Phoenix Backend → TanStack Query → PlacesView → {
  ├── InteractiveMap (for marker display)
  ├── PoiCard (for list display)
  └── CategoryFilter (for filtering)
}
```

### Event Flow
```
User Interaction → PlacesView Event Handler → State Update → {
  ├── Map marker updates (hover highlighting)
  ├── Card highlighting (hover effects)
  └── Time scheduling (local state)
}
```

### Theme System
CSS custom properties ensure consistent theming:
```css
.category-button {
  background-color: var(--primary-50);  /* Hover background */
  color: var(--primary);                /* Hover text */
  border-color: var(--primary-100);     /* Subtle borders */
}
```

## Performance Optimization Patterns

### API Call Reduction
- **No route calculation**: Use POI coordinates directly
- **No city verification**: Trust backend data
- **Minimal marker updates**: Only update on state change

### Mobile Optimization
- **Touch-friendly targets**: Minimum 44px buttons
- **Conditional rendering**: Don't render both map and list on mobile
- **Efficient scrolling**: Native overflow instead of complex ScrollArea

### Memory Management
- **Cleanup markers**: Remove old markers when POIs change
- **Event listener cleanup**: Proper useEffect cleanup
- **State optimization**: Use Map for O(1) time lookups