# Interactive Map Flow Documentation

## Overview

The Interactive Map component is the core visual element for displaying routes, points of interest (POIs), and handling user interactions in RouteWise. This document covers the complete flow, architecture, and troubleshooting guide.

## 🏗️ Architecture Overview

### Component Structure
```mermaid
graph TB
    subgraph "Route Results Page"
        RR[route-results.tsx]
    end
    
    subgraph "Interactive Map Component"
        IM[interactive-map.tsx]
        IM --> GM[Google Maps API]
        IM --> POI[POI Markers]
        IM --> RT[Route Display]
    end
    
    subgraph "Backend Services"
        API[Phoenix Backend]
        API --> MK[/api/maps-key]
        API --> POIS[/api/pois]
    end
    
    subgraph "External Services"
        GOOGLE[Google Maps Platform]
        GOOGLE --> MAPS[Maps JavaScript API]
        GOOGLE --> PLACES[Places API]  
        GOOGLE --> DIRS[Directions API]
    end
    
    RR --> IM
    IM --> API
    GM --> GOOGLE
    
    classDef component fill:#e1f5fe
    classDef service fill:#f3e5f5
    classDef external fill:#fff3e0
    
    class RR,IM component
    class API,MK,POIS service
    class GOOGLE,MAPS,PLACES,DIRS external
```

### Component Location
- **File**: `client/src/components/interactive-map.tsx`
- **Usage**: [[#Route Results Integration]], [[#Trip Planning Integration]]
- **Dependencies**: Google Maps JavaScript API, React Query

### Trip Wizard Integration
- **PlaceAutocomplete Component**: `client/src/components/place-autocomplete.tsx`
- **Manual Entry Support**: Users can proceed without autocomplete matches
- **Tab Navigation**: Tab key moves between start/end city fields for improved UX flow
- **Keyboard Controls**: Escape to cancel, Enter to select, Tab to navigate

## 🚀 Initialization Flow

### 1. Four-Layer Safety System
```mermaid
sequenceDiagram
    participant C as Component Mount
    participant S as Safety Layer
    participant G as Google Maps API
    participant D as DOM Element
    
    Note over C,D: Layer 1: API Key Validation
    C->>S: Fetch /api/maps-key
    S->>C: Return API key or error
    
    Note over C,D: Layer 2: Component Mount Safety
    C->>S: Set isMounted = true
    S->>C: Confirm mounted state
    
    Note over C,D: Layer 3: DOM Stability Buffer
    C->>S: Check mapRef.current exists
    S->>D: Wait 50ms for DOM stability
    D->>S: DOM ready confirmed
    
    Note over C,D: Layer 4: Pre-validation
    S->>D: Validate HTMLElement & isConnected
    D->>S: Element valid
    S->>G: Initialize with validated element
    G->>C: Map ready
```

### 2. State Machine Flow
```mermaid
stateDiagram-v2
    [*] --> Mounting
    Mounting --> FetchingKey: Component mounts
    FetchingKey --> KeyError: API key fetch fails
    FetchingKey --> WaitingDOM: API key received
    
    WaitingDOM --> DOMReady: mapRef & isMounted true
    DOMReady --> Initializing: 50ms delay complete
    
    Initializing --> LoadingScript: DOM validation passed
    LoadingScript --> ScriptError: Google Maps script fails
    LoadingScript --> CreatingMap: Script loaded successfully
    
    CreatingMap --> MapError: Map creation fails
    CreatingMap --> Ready: Map created successfully
    
    Ready --> LoadingPOIs: POI data available
    Ready --> LoadingRoute: Route data available
    
    LoadingPOIs --> POIsReady: Markers created
    LoadingRoute --> RouteReady: Route displayed
    
    KeyError --> [*]: Show error message
    ScriptError --> [*]: Show error message  
    MapError --> [*]: Show error message
```

### 3. Component Lifecycle Integration
```mermaid
graph LR
    subgraph "Route Results Page Lifecycle"
        A[Page Load] --> B[Fetch Route Data]
        B --> C{POI Loading?}
        C -->|Yes| D[Show Map Skeleton]
        C -->|No| E[Render Interactive Map]
        D --> F[POI Data Ready]
        F --> E
    end
    
    subgraph "Interactive Map Lifecycle"  
        E --> G[Mount Component]
        G --> H[Fetch Maps Key]
        H --> I[Initialize Google Maps]
        I --> J[Create POI Markers]
        I --> K[Load Route]
        J --> L[Map Ready]
        K --> L
    end
    
    classDef loading fill:#fff3e0
    classDef ready fill:#e8f5e8
    
    class D,F loading
    class L ready
```

## 🗺️ Map Features & Data Flow

### POI Marker System
```mermaid
graph TD
    subgraph "POI Data Pipeline"
        A[POI Array from Props] --> B[Filter Unique POIs]
        B --> C[Create Marker Elements]
        C --> D[Apply Category Styling]
        D --> E[Position on Map]
    end
    
    subgraph "Marker Interactions"
        E --> F[Click Handler]
        E --> G[Hover Handler]
        F --> H[Show Info Window]
        F --> I[Trigger onPoiClick]
        G --> J[Update Hover State]
    end
    
    subgraph "Trip Integration"
        I --> K[Add to Trip Button]
        K --> L[useTripPlaces Hook]
        L --> M[Update Trip State]
    end
    
    classDef data fill:#e3f2fd
    classDef interaction fill:#f1f8e9
    classDef integration fill:#fce4ec
    
    class A,B,C,D,E data
    class F,G,H,I,J interaction
    class K,L,M integration
```

### Route Visualization Flow
```mermaid
sequenceDiagram
    participant P as Props
    participant M as Map Component  
    participant D as Directions Service
    participant R as Directions Renderer
    participant GM as Google Maps
    
    P->>M: startCity, endCity, checkpoints
    M->>D: Create DirectionsRequest
    
    Note over M,D: Route Configuration
    D->>GM: Calculate route
    GM->>D: Route result
    
    D->>M: Route calculation success
    M->>R: setDirections(result)
    R->>GM: Render route on map
    
    Note over R,GM: Visual Elements
    GM->>M: Route displayed with polylines
    
    alt Route calculation fails
        D->>M: Error result
        M->>M: setError("Failed to load route")
    end
```

## 🔄 State Management Architecture

### Core States & References
```mermaid
mindmap
  root((Interactive Map State))
    Loading States
      isLoading
      poisLoading
      mapsApiLoading
    Error States  
      error
      apiKeyError
      routeError
    Configuration
      googleMapsKey
      isMounted
      isMapVisible
    Google Maps Refs
      mapRef
      mapInstanceRef
      markersRef
      poiMarkersRef
      directionsServiceRef
      directionsRendererRef
      infoWindowRef
    User Interaction
      selectedPoiIds
      hoveredPoi
      onPoiClick
      onPoiSelect
```

### Event Flow Architecture
```mermaid
graph TB
    subgraph "User Events"
        A[POI Click] 
        B[Map Drag]
        C[Zoom Change]
        D[Route Marker Click]
    end
    
    subgraph "Event Handlers"
        A --> E[handlePoiClick]
        B --> F[handleMapDrag]
        C --> G[handleZoomChange]  
        D --> H[handleRouteMarkerClick]
    end
    
    subgraph "State Updates"
        E --> I[Update selectedPoiIds]
        E --> J[Show Info Window]
        F --> K[Update map bounds]
        G --> L[Update POI visibility]
        H --> M[Show route info]
    end
    
    subgraph "Side Effects"
        I --> N[Parent onPoiSelect]
        J --> O[Render POI details]
        K --> P[Update URL params]
        L --> Q[Filter markers]
        M --> R[Update route panel]
    end
```

## 🐛 Error Handling & Recovery

### Error Classification System
```mermaid
graph TD
    subgraph "Initialization Errors"
        A[API Key Missing] --> A1[Show config error]
        B[DOM Not Ready] --> B1[Retry with delay]
        C[Google Script Failed] --> C1[Show network error]
        D[Map Creation Failed] --> D1[Show API error]
    end
    
    subgraph "Runtime Errors"
        E[POI Loading Failed] --> E1[Show partial data]
        F[Route Calculation Failed] --> F1[Show route error]
        G[Marker Creation Failed] --> G1[Skip failed markers]
        H[Info Window Error] --> H1[Fallback to basic popup]
    end
    
    subgraph "Recovery Strategies"
        A1 --> A2[Check backend config]
        B1 --> B2[Implement retry logic]
        C1 --> C2[Fallback to static map]
        D1 --> D2[Check API quotas]
        E1 --> E2[Continue with available data]
        F1 --> F2[Allow manual route entry]
        G1 --> G2[Log error & continue]
        H1 --> H2[Simple text display]
    end
    
    classDef error fill:#ffebee
    classDef recovery fill:#e8f5e8
    
    class A,B,C,D,E,F,G,H error
    class A1,B1,C1,D1,E1,F1,G1,H1 error
    class A2,B2,C2,D2,E2,F2,G2,H2 recovery
```

### Debugging Flow
```mermaid
flowchart LR
    A[Map Error Occurs] --> B{Error Type?}
    
    B -->|Init Error| C[Check Console Logs]
    B -->|Runtime Error| D[Check Network Tab]
    B -->|Display Error| E[Check DOM State]
    
    C --> C1[Verify API Key]
    C --> C2[Check DOM Ready State]  
    C --> C3[Validate Element Refs]
    
    D --> D1[Check /api/maps-key Response]
    D --> D2[Verify Google Script Load]
    D --> D3[Check POI Data Format]
    
    E --> E1[Inspect mapRef.current]
    E --> E2[Check CSS Dimensions]
    E --> E3[Verify React Mount State]
    
    C1 --> F[Apply Fix & Test]
    C2 --> F
    C3 --> F
    D1 --> F  
    D2 --> F
    D3 --> F
    E1 --> F
    E2 --> F
    E3 --> F
```

## 🔧 Configuration & Integration

### Backend Integration Points
```mermaid
graph TB
    subgraph "Phoenix Backend"
        A[MapsController] --> B[/api/maps-key endpoint]
        C[POIController] --> D[/api/pois endpoint]
        E[RoutesController] --> F[/api/routes/* endpoints]
    end
    
    subgraph "Frontend Integration"  
        B --> G[Map API Key Fetch]
        D --> H[POI Data Loading]
        F --> I[Route Calculation]
    end
    
    subgraph "Google Services"
        G --> J[Maps JavaScript API]
        H --> K[Places API Data]
        I --> L[Directions API]
    end
    
    subgraph "Map Rendering"
        J --> M[Map Instance Creation]
        K --> N[POI Marker Display]
        L --> O[Route Polyline Display]
    end
    
    M --> P[Interactive Map Ready]
    N --> P
    O --> P
```

### Route Results Integration
```mermaid
sequenceDiagram
    participant RR as route-results.tsx
    participant RQ as React Query
    participant IM as InteractiveMap
    participant GM as Google Maps
    
    Note over RR,GM: Page Load & Data Fetching
    RR->>RQ: Fetch POI data
    RR->>IM: Render loading skeleton
    
    Note over RR,GM: Data Ready State
    RQ->>RR: POI data loaded
    RR->>IM: Render with real data
    
    Note over RR,GM: Map Initialization  
    IM->>GM: Initialize map
    IM->>GM: Create POI markers
    IM->>GM: Load route
    
    Note over RR,GM: User Interactions
    GM->>IM: POI click event
    IM->>RR: onPoiClick callback
    RR->>RR: Update selectedPoiIds
    RR->>IM: Re-render with selection
```

## 📊 Performance Optimization

### Rendering Optimization Strategy
```mermaid
graph LR
    subgraph "Initial Load"
        A[Lazy Load Google Script] --> B[Batch Marker Creation]
        B --> C[Debounced Map Events]
        C --> D[Virtualized POI List]
    end
    
    subgraph "Runtime Optimization"
        E[Marker Clustering] --> F[Viewport Culling]
        F --> G[Event Delegation]
        G --> H[Memory Cleanup]
    end
    
    subgraph "Data Optimization"
        I[React Query Caching] --> J[Minimal Re-renders]
        J --> K[useMemo for Expensive Ops]
        K --> L[useCallback for Handlers]
    end
    
    A --> E
    E --> I
    
    classDef perf fill:#e8f5e8
    class A,B,C,D,E,F,G,H,I,J,K,L perf
```

### Memory Management Flow
```mermaid
flowchart TD
    A[Component Mount] --> B[Create Refs & States]
    B --> C[Initialize Map & Services]
    C --> D[Create Markers & Listeners]
    
    D --> E[Component Update]
    E --> F{Markers Changed?}
    F -->|Yes| G[Clean Old Markers]
    F -->|No| H[Keep Existing]
    G --> I[Create New Markers]
    I --> D
    H --> D
    
    D --> J[Component Unmount]
    J --> K[Clear All Markers]
    K --> L[Remove Event Listeners]
    L --> M[Delete Global Functions]
    M --> N[Cleanup Complete]
    
    classDef lifecycle fill:#e3f2fd
    classDef cleanup fill:#ffebee
    
    class A,B,C,E lifecycle
    class G,K,L,M,N cleanup
```

## 🧪 Testing Strategy

### Testing Pyramid Structure
```mermaid
graph TD
    subgraph "E2E Tests"
        A[Full Map Interaction Flow]
        B[POI Selection Journey] 
        C[Route Planning End-to-End]
    end
    
    subgraph "Integration Tests"
        D[Google Maps API Integration]
        E[Backend Endpoint Integration]
        F[React Query Data Flow]
        G[Component State Management]
    end
    
    subgraph "Unit Tests"
        H[Marker Creation Logic]
        I[Error Handling Functions]
        J[State Update Functions]
        K[Event Handler Logic]
        L[Data Transformation Utils]
    end
    
    A --> D
    B --> E  
    C --> F
    D --> H
    E --> I
    F --> J
    G --> K
    G --> L
    
    classDef e2e fill:#e8f5e8
    classDef integration fill:#fff3e0
    classDef unit fill:#f3e5f5
    
    class A,B,C e2e
    class D,E,F,G integration  
    class H,I,J,K,L unit
```

---

## Key Dependencies
```typescript
// Core Dependencies
import { useRef, useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTripPlaces } from "@/hooks/use-trip-places";

// Google Maps Types (global)
declare global {
  interface Window {
    google: typeof google;
    addPoiToTrip: (poiIdentifier: string | number) => void;
  }
}
```

## Props Interface
```typescript
interface InteractiveMapProps {
  startCity: string;
  endCity: string;
  checkpoints: string[];
  pois: Poi[];
  selectedPoiIds?: number[];
  hoveredPoi?: Poi | null;
  onPoiClick?: (poi: Poi) => void;
  onPoiSelect?: (poi: Poi) => void;
  height?: string;
  className?: string;
}
```

## Environment Configuration
```bash
# Required
GOOGLE_PLACES_API_KEY=your_google_api_key_here

# Optional (falls back to GOOGLE_PLACES_API_KEY)
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

---

*Last Updated: August 2025*
*Version: 1.0*

**Related Documentation:**
- [[ROUTE_RESULTS_FLOW.md]] - Route Results page integration
- [[../client/src/components/interactive-map.tsx]] - Source code
- [[../pages/route-results.tsx]] - Usage example