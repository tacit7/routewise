# Common Issues & Troubleshooting Guide

## Map-Related Issues

### Map Pins Not Rendering
**Symptoms**: Map loads but no POI markers visible

**Root Causes & Solutions**:
1. **AdvancedMarkerElement Not Available**
   ```typescript
   // Check availability and fallback
   if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
     // Use advanced markers
   } else {
     console.warn('AdvancedMarkerElement not available, using regular Marker');
     // Fallback to regular markers
   }
   ```

2. **Invalid Coordinates**
   ```typescript
   // Validate coordinates before marker creation
   const hasCoords = (poi.lat && poi.lng) || (poi.latitude && poi.longitude);
   if (!hasCoords) {
     console.warn('POI missing coordinates:', poi.name, poi);
     return;
   }
   ```

3. **Map Not Fully Initialized**
   ```typescript
   // Wait for map readiness
   if (!mapInstanceRef.current) {
     console.warn('Map instance not ready for markers');
     return;
   }
   ```

**Debug Console Logs to Check**:
- "Creating POI markers: X POIs"
- "Advanced marker available: true/false"
- "Creating marker for [POI NAME] at: {lat: X, lng: Y}"

### Circular Dependency Errors
**Error**: "Cannot access 'calculateCenterFromPois' before initialization"

**Solution**: Reorder useCallback functions:
```typescript
// Correct order:
const calculateCenterFromPois = useCallback(...);
const centerMapOnPois = useCallback(...);  // Uses calculateCenterFromPois
const initializeMap = useCallback(...);    // Uses both above functions
```

## Layout & Responsiveness Issues

### POI Cards Getting Truncated
**Symptoms**: Cards cut off, not showing full content

**Root Cause**: ScrollArea component interference

**Solution**: Replace with native overflow scrolling
```typescript
// ❌ Problem
<ScrollArea className="flex-1">
  <div className="p-2 space-y-2">
    {pois.map(...)}
  </div>
</ScrollArea>

// ✅ Solution  
<div className="flex-1 overflow-y-auto">
  <div className="p-2 space-y-2">
    {pois.map(...)}
  </div>
</div>
```

### Non-Responsive POI Interactions
**Symptoms**: Hover/click events not working on POI cards

**Causes & Solutions**:
1. **Event Handler Missing**
   ```typescript
   // Ensure proper event delegation
   <div
     onMouseEnter={() => onPoiHover(poi)}
     onMouseLeave={() => onPoiHover(null)}
   >
     <PoiCard poi={poi} />
   </div>
   ```

2. **CSS Pointer Events Blocked**
   ```css
   /* Check for CSS that might block interactions */
   .some-container {
     pointer-events: none; /* This blocks all interactions */
   }
   ```

### Mobile Layout Breaking
**Symptoms**: Mobile view showing both map and list, or wrong layout

**Debug Steps**:
```typescript
// Check mobile detection
console.log('Mobile state:', { isMobile, isMapVisible, showRouting });

// Verify conditional rendering
{isMobile ? (
  // Should be either/or, not both
  isMapVisible ? <MapView /> : <ListView />
) : (
  // Desktop should show both
  <ResizablePanelGroup>...</ResizablePanelGroup>
)}
```

## Theme & Styling Issues

### Hover Effects Not Working
**Problem**: Tailwind hover classes like `hover:bg-primary/10` not applying

**Root Cause**: CSS custom property compatibility issues

**Solution**: Use JavaScript event handlers
```typescript
// ❌ Doesn't work reliably
className="hover:bg-primary/10 hover:text-primary"

// ✅ Works consistently  
onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = 'var(--primary-50)';
  e.currentTarget.style.color = 'var(--primary)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.backgroundColor = 'transparent';
  e.currentTarget.style.color = 'var(--text-muted)';
}}
```

### Theme Colors Not Applied
**Check CSS Custom Properties**:
```css
/* Verify these are defined in index.css */
:root {
  --primary: hsl(160 84% 36%);
  --primary-50: hsl(160 60% 96%);
  --text: hsl(215 18% 18%);
  --text-muted: hsl(215 12% 42%);
}
```

## Performance Issues

### High Google Maps API Usage
**Solution**: Minimize API calls
```typescript
// ✅ Use POI coordinates directly
const center = calculateCenterFromPois(pois);

// ❌ Don't geocode city names
const geocoder = new google.maps.Geocoder(); // Avoid this

// ❌ Don't calculate routes for exploration
directionsService.route(request); // Only for route mode
```

### Slow POI List Rendering
**Optimization**: Use proper keys and avoid unnecessary re-renders
```typescript
// ✅ Stable keys
key={poi.placeId || poi.id}

// ✅ Memoized filtering
const filteredPois = useMemo(() => 
  pois.filter(poi => categoryMatch && cityMatch)
, [pois, selectedCategory, selectedCity]);
```

## Development Workflow Issues

### TypeScript Errors
**Common Issues**:
1. **Missing type imports**
   ```typescript
   import type { POI } from "@/types/api";
   import type { Poi } from "@/types/schema";
   ```

2. **Prop interface mismatches**
   ```typescript
   // Ensure component props match interface
   interface PoiCardProps {
     onTimeChange?: (poiId: number, newTime: string) => void;
   }
   ```

### Build/Runtime Errors
**Check These First**:
1. **Import paths** - Use `@/` alias correctly
2. **Component exports** - Ensure default exports where expected
3. **Hook usage** - Only call hooks at component top level
4. **Effect dependencies** - Include all used variables in dependency arrays

## Debugging Strategies

### Console Logging Strategy
```typescript
// POI data debugging
console.log('POI sample:', pois[0]);
console.log('Coordinates available:', { 
  lat: pois[0]?.lat, 
  lng: pois[0]?.lng,
  latitude: pois[0]?.latitude,
  longitude: pois[0]?.longitude 
});

// Layout debugging
console.log('Layout state:', { isMobile, isMapVisible, showRouting });

// Event debugging
console.log('POI hover:', poi.name);
```

### Network Tab Checks
- **API calls**: Verify `/api/route-results` returns expected data
- **Google Maps**: Check maps API key is loading correctly
- **Bundle size**: Monitor for unnecessary dependencies

### React DevTools
- **Component props**: Verify props are passed correctly
- **State updates**: Track state changes in PlacesView
- **Re-render frequency**: Identify unnecessary re-renders