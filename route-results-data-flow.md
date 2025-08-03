# Route Results Page - Data Flow Diagram

```mermaid
graph TB
    %% Entry Points
    URL[URL Parameters ?start=Austin&end=Dallas] --> RouteResults[RouteResults Component]
    LocalStorage[localStorage routeData] --> RouteResults
    WizardData[Trip Wizard Data] --> RouteResults

    %% Route Results Component State
    RouteResults --> |useState| RouteState{Route State Management}
    RouteState --> routeData[routeData: RouteData]
    RouteState --> selectedCategory[selectedCategory: string]
    RouteState --> selectedCity[selectedCity: string] 
    RouteState --> selectedPoiIds[selectedPoiIds: number[]]
    RouteState --> hoveredPoi[hoveredPoi: Poi | null]
    RouteState --> isMapVisible[isMapVisible: boolean]

    %% Data Fetching Layer
    routeData --> |useQuery| MapsAPI[Google Maps API Key Fetch]
    routeData --> |useQuery| POIFetch[POI Data Fetch /api/pois]
    
    MapsAPI --> |Success| MapsKey[mapsApiData: {apiKey}]
    POIFetch --> |Success| POIData[pois: Poi[]]
    
    %% Backend API Calls
    POIFetch --> BackendAPI[Backend Express Server]
    BackendAPI --> GooglePlaces[Google Places API Service]
    BackendAPI --> MockData[Mock POI Data Fallback]
    GooglePlaces --> |Response| BackendAPI
    MockData --> |Fallback| BackendAPI
    BackendAPI --> |JSON Response| POIData

    %% Data Processing Layer
    POIData --> |filter duplicates| UniquePOIs[uniquePois: Poi[]]
    UniquePOIs --> |useMemo| CityExtraction[extractCityFromPoi function]
    CityExtraction --> AvailableCities[availableCities: string[]]
    
    UniquePOIs --> |filter by category & city| FilteredPOIs[filteredPois: Poi[]]
    AvailableCities --> |city filters| FilteredPOIs
    selectedCategory --> |category filters| FilteredPOIs
    selectedCity --> |city filters| FilteredPOIs

    %% Component Rendering Layer
    FilteredPOIs --> Sidebar[Left Sidebar Component]
    FilteredPOIs --> MapComponent[InteractiveMap Component]
    routeData --> ItineraryComp[ItineraryComponent]
    
    %% Sidebar Rendering
    Sidebar --> SidebarHeader[Trip Details Header]
    Sidebar --> CityFilters[City Filter Buttons]
    Sidebar --> POIList[Scrollable POI List]
    
    SidebarHeader --> |display| routeData
    CityFilters --> |onClick| selectedCity
    POIList --> |map over| CompactPOICards[Compact POI Cards]
    
    %% Map Component Data Flow
    MapComponent --> |props| MapProps{Map Props}
    MapProps --> startCity[startCity: string]
    MapProps --> endCity[endCity: string] 
    MapProps --> pois[pois: Poi[]]
    MapProps --> selectedPoiIds
    MapProps --> hoveredPoi
    MapProps --> onPoiClick[onPoiClick callback]
    MapProps --> onPoiSelect[onPoiSelect callback]

    %% Google Maps Integration
    MapsKey --> |loadGoogleMapsScript| GoogleMapsLoader[Google Maps Script Loader]
    GoogleMapsLoader --> |async loading| GoogleMapsAPI[Google Maps JavaScript API]
    GoogleMapsAPI --> |initialization| MapInstance[google.maps.Map instance]
    
    %% Map Markers
    MapInstance --> RouteMarkers[Route Markers - Start/End/Checkpoints]
    MapInstance --> POIMarkers[POI Markers - AdvancedMarkerElement]
    pois --> |createMarkerElement| POIMarkers
    selectedPoiIds --> |marker styling| POIMarkers
    hoveredPoi --> |marker highlighting| POIMarkers

    %% Interactive Features
    CompactPOICards --> |onMouseEnter/Leave| hoveredPoi
    POIMarkers --> |onClick| onPoiClick
    POIMarkers --> |selection| onPoiSelect
    onPoiSelect --> |update state| selectedPoiIds

    %% Itinerary Component Integration
    ItineraryComp --> |useQuery| RouteQuery[Route API Query /api/route]
    RouteQuery --> GoogleDirections[Google Directions API]
    GoogleDirections --> RouteData[Route Data: distance, duration, polyline]
    
    %% Event Handlers
    selectedPoiIds --> |onChange| UpdateSelectedPois[handleUpdateSelectedPois]
    UpdateSelectedPois --> |callback| ItineraryComp
    
    %% Save Route Functionality
    routeData --> |handleSaveRoute| SaveRoute[Save Route API Call]
    UniquePOIs --> SaveRoute
    SaveRoute --> |POST /api/routes| BackendSave[Backend Route Storage]
    BackendSave --> |Success/Error| ToastNotification[Toast Notification]

    %% URL State Management
    routeData --> |useEffect| URLUpdate[URL Parameters Update]
    URLUpdate --> BrowserHistory[Browser History State]
    
    %% Error Handling
    POIFetch --> |Error| ErrorState[Loading/Error States]
    MapsAPI --> |Error| ErrorState
    RouteQuery --> |Error| ErrorState
    ErrorState --> ErrorDisplay[Error UI Components]

    %% Styling Classes
    subgraph "Component Styling"
        TailwindCSS[Tailwind CSS Classes]
        ShadcnUI[shadcn/ui Components]
        ResponsiveDesign[Responsive Grid/Flexbox]
    end
    
    Sidebar --> TailwindCSS
    CompactPOICards --> ShadcnUI
    MapComponent --> ResponsiveDesign

    %% Data Persistence
    routeData --> |localStorage| LocalStorageSave[localStorage Persistence]
    selectedPoiIds --> |session state| SessionMemory[Session Memory]

    style RouteResults fill:#e1f5fe
    style BackendAPI fill:#f3e5f5
    style GoogleMapsAPI fill:#fff3e0
    style POIData fill:#e8f5e8
    style FilteredPOIs fill:#fff8e1
    style MapComponent fill:#fce4ec
    style Sidebar fill:#f1f8e9
```

## Data Flow Summary

### 1. **Initialization Phase**
- RouteResults component receives route data from URL parameters, localStorage, or Trip Wizard
- Component initializes state for filters, selections, and UI toggles

### 2. **Data Fetching Phase**
- **Google Maps API Key**: Fetched once and cached for 30 minutes
- **POI Data**: Fetched based on start/end cities with React Query caching
- **Route Data**: Fetched by ItineraryComponent for distance/duration display

### 3. **Data Processing Phase**
- **Deduplication**: Remove duplicate POIs based on placeId
- **City Extraction**: Parse POI addresses to extract city names
- **Filtering**: Apply category and city filters to create filteredPois array

### 4. **Rendering Phase**
- **Left Sidebar**: Displays trip details, filters, and compact POI cards
- **Interactive Map**: Renders full-screen map with route and POI markers
- **ItineraryComponent**: Shows route overview with real Google Directions data

### 5. **Interactive Features**
- **POI Selection**: Click handlers update selectedPoiIds state
- **Hover Effects**: Mouse events highlight POIs on both sidebar and map
- **Filter Updates**: Button clicks update category/city filter state
- **Route Saving**: API calls to persist route data with selected POIs

### 6. **State Synchronization**
- All components share state through props and callback functions
- Real-time updates flow from user interactions to visual feedback
- URL parameters and localStorage provide state persistence

## Key Technical Features

- **React Query**: Caching and data fetching with automatic retries
- **Google Maps Integration**: AdvancedMarkerElement API with custom styling
- **Responsive Design**: Flexbox layout with sidebar and full-screen map
- **Real-time Filtering**: Immediate UI updates based on user selections
- **Error Handling**: Graceful fallbacks and loading states throughout
- **Performance Optimization**: Memoized calculations and efficient re-renders