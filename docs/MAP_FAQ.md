# Map Integration FAQ

Common issues and solutions for Google Maps integration with @vis.gl/react-google-maps.

## Custom Markers

### Optimal Marker Sizing

**Recommended Sizes**:
- Normal state: 48px width × 58px height (48 × 48 × 1.2 aspect ratio)
- Selected/Hovered state: 56px width × 67px height (56 × 56 × 1.2 aspect ratio)
- Minimum readable size: 40px
- Maximum before cluttering: 64px

**Implementation**:
```tsx
const size = isSelected || isHovered ? 56 : 48;
return `<svg width="${size}" height="${size * 1.2}" viewBox="0 0 100 120">`;
```

### AdvancedMarker Custom Content Not Displaying

**Problem**: Custom markers created with DOM elements using `document.createElement()` don't appear on the map when passed to the `content` prop of `AdvancedMarker`.

**Symptoms**:
- Default Google pins show instead of custom markers
- Debug logs show SVG generation and DOM element creation working correctly
- No errors in console, but custom content doesn't render

**Root Cause**: 
`AdvancedMarker` from @vis.gl/react-google-maps expects React components as children, not DOM elements via the `content` prop.

**Solution**:
Convert DOM-based marker creation to React components:

```tsx
// ❌ Wrong - DOM element approach
const markerElement = useMemo(() => {
  const div = document.createElement('div');
  div.innerHTML = svgString;
  return div;
}, [svgString]);

return (
  <AdvancedMarker content={markerElement}>
);

// ✅ Correct - React component approach  
const MarkerContent = useMemo(() => {
  const MarkerDiv = () => (
    <div
      style={{
        cursor: 'pointer',
        opacity: isHovered ? 1.0 : 0.85,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
  return MarkerDiv;
}, [svgString, isHovered]);

return (
  <AdvancedMarker>
    <MarkerContent />
  </AdvancedMarker>
);
```

**Key Points**:
- Use `dangerouslySetInnerHTML` to render SVG strings in React components
- Pass React components as children to `AdvancedMarker`, not via `content` prop
- Maintain styling and interaction state through React props, not DOM manipulation

## Route Rendering

### Route Polylines

**Status**: Pending implementation
- Need to add driving directions polyline between start/end cities
- Use Google Directions API integration
- Render polyline overlays on map

## Performance

### Marker Clustering

**Status**: Available via Phoenix backend hook
- See `PHOENIX_POI_CLUSTERING_HOOK.md` for implementation details
- Reduces DOM complexity for large POI datasets
- Improves map rendering performance

## Marker Evolution History

### Approach 1: Custom SVG Owl Markers (Removed)
- **Issue**: Complex 80+ line SVG with custom theming
- **Performance**: Heavy DOM manipulation, over-engineered
- **Problem**: AdvancedMarker `content` prop expects React components, not DOM elements

### Approach 2: Lucide React Icons (Replaced)  
- **Implementation**: White icons on colored circular backgrounds
- **Benefits**: Semantic icons, easier to maintain
- **Drawback**: Still custom styling complexity

### Approach 3: Google Default Pin (Current)
- **Implementation**: Uses `Pin` component from @vis.gl/react-google-maps
- **Benefits**: Best performance, familiar UX, zero custom styling
- **Features**: Category colors, hover scaling, native Google rendering

## Debugging

### POI Data Issues

**No POIs Displaying**:
1. **Check Console Logs**:
   ```
   🔍 Fetching route results with params
   📊 Route Results API response status  
   ✅ Route Results data received
   ```

2. **Check Network Tab**: Look for `/api/route-results?start=X&end=Y` calls

3. **Inspect Response**: Use `debugger;` in route-results.tsx line 47

4. **Common Issues**:
   - Phoenix backend not running on port 4001
   - Invalid start/end city names in URL params
   - Empty POI array in backend response
   - Coordinate validation failures

### Marker Rendering Pipeline

Use emoji-based console logging to trace marker creation:

```tsx
console.log('🎯 POI Marker Rendering:', { name: poi.name, coords, category: poi.category });
console.log('🎨 Google Pin Color:', { category: poi.category, color });
console.log('🗺️ Rendering AdvancedMarker with Pin:', { position: coords, title: poi.name });
```

### TanStack Query Caching Issues

If seeing stale/cached data:
```tsx
// In queryClient.ts for development
staleTime: 0,
refetchOnWindowFocus: true,
refetchOnMount: 'always',
```

## API Integration

### Google Maps API Key

- Fetched from Phoenix backend via `/api/maps-key` endpoint
- Handled automatically by `InteractiveMap` component
- Falls back to error state if key unavailable

### POI Data Format

Expected POI structure:
```tsx
interface Poi {
  id: number;
  name: string;
  lat?: number;
  lng?: number;
  latitude?: number;  // Fallback coordinate format
  longitude?: number; // Fallback coordinate format  
  category: string;
  placeId?: string;
  // ... other properties
}
```

Coordinate resolution priority: `lat/lng` → `latitude/longitude` → safe default (center of US).

## Branch Management Issues

### Refactor Branch Merge Problems (August 12, 2025)

**Issue**: After merging refactor branch into main, map zoom controls became unresponsive and compilation errors appeared.

**Root Cause**: Refactor branch contained problematic code patterns:
1. **Aggressive cache busting** in TanStack Query:
   ```tsx
   staleTime: 0,
   gcTime: 0, 
   refetchOnMount: "always",
   refetchOnWindowFocus: true
   ```

2. **Rapid-fire event listeners** causing zoom fighting:
   ```tsx
   map.addListener('bounds_changed', updateViewport), // Fires every frame
   map.addListener('zoom_changed', updateViewport),
   map.addListener('dragend', updateViewport)
   ```

3. **JSX syntax errors** preventing compilation:
   ```tsx
   class="text-sm font-medium"  // ❌ HTML syntax
   className="text-sm font-medium" // ✅ JSX syntax
   ```

**Why No Merge Conflicts**: Both branches developed similar clustering implementations independently, so Git saw them as "compatible" changes despite performance issues.

**Solutions Applied**:
- **Debounced viewport updates** (300ms) with `setTimeout`
- **Switched to `idle` event** instead of rapid-fire events
- **Fixed JSX syntax errors** (`class=` → `className=`)
- **Proper dependency arrays** in useEffect hooks
- **Only track viewport when clustering enabled**

**Prevention**: Test refactor branches thoroughly before merging, especially performance-sensitive features like map interactions.