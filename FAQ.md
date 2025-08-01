# Routewise Project FAQ

## Development Environment

### Docker Compose Command Updates

**Question:** Should I use docker-compose or docker compose for this project?
**Error/Issue:** User preference for modern Docker Compose V2 syntax
**Context:** Setting up development environment and following current best practices
**Solution:** Use docker compose (V2) instead of docker-compose (V1) for all commands
**Code:**

```bash
# Correct (Docker Compose V2)
docker compose up --build
docker compose down

# Legacy (avoid)
docker-compose up --build
```

**Date:** July 30, 2025
**Project:** [[Routewise]]
**Status:** Solved

#docker #docker-compose #development #environment #solved
**Related:** [[Development Setup]] [[Docker Configuration]]

---

### Starting the Routewise Application

**Question:** How do I start the app with the existing Docker setup?
**Error/Issue:** Multiple startup options available, need recommended approach
**Context:** Project has both local npm and Docker configurations available
**Solution:** Use Docker Compose for full development environment with PostgreSQL
**Code:**

```bash
# Recommended approach
cd /Users/urielmaldonado/projects/routewise
docker compose up --build

# Access at http://localhost:3000
# (Container port 5000 mapped to host port 3000)
```

**Date:** July 30, 2025
**Project:** [[Routewise]]
**Status:** Solved

#docker #startup #development #environment #solved
**Related:** [[Docker Setup]] [[Development Workflow]]

---

## API Configuration

### Google API Keys Configuration in Docker

**Question:** How do API keys get set in the Docker environment?
**Error/Issue:** Need to configure Google Maps and Places API keys for real data
**Context:** App works with sample data but needs real Google API integration
**Solution:** Set API keys in .env file which gets loaded by docker-compose.yml
**Code:**

```bash
# .env file
GOOGLE_PLACES_API_KEY=AIzaSyB8Teox86QyiwM8RMr32hvx-tnyHpE23AE
GOOGLE_MAPS_API_KEY=AIzaSyB8Teox86QyiwM8RMr32hvx-tnyHpE23AE

# docker-compose.yml
services:
  app:
    env_file:
      - .env
```

**Date:** July 30, 2025
**Project:** [[Routewise]]
**Status:** Solved

#docker #api-keys #environment #google-api #configuration #solved
**Related:** [[Environment Variables]] [[Google APIs]]

---

### Finding Existing Google API Keys

**Question:** I want to reuse my old Google API key but don't know where to get it
**Error/Issue:** Need to locate existing API key instead of creating new one
**Context:** User has existing Google Cloud project with API keys
**Solution:** Check Google Cloud Console → APIs & Services → Credentials
**Code:**

```bash
# Alternative: Search existing projects for keys
find ~/projects -name "*.env*" -exec grep -l "AIza" {} \;
grep -r "AIza" ~/projects/
```

**Date:** July 30, 2025
**Project:** [[Routewise]]
**Status:** Solved

#google-api #api-keys #credentials #google-cloud #solved
**Related:** [[API Management]] [[Google Cloud Console]]

---

## Backend Implementation

### Google Directions API Integration

**Question:** How to add route calculation to existing Node.js Express app with Google APIs
**Error/Issue:** Need real route calculation instead of sample data for MVP
**Context:** Adding route calculation functionality to travel planner backend
**Solution:** Created GoogleDirectionsService class and integrated with Express routes
**Code:**

```typescript
// server/google-directions.ts
interface RouteResult {
  distance: string;
  duration: string;
  start_address: string;
  end_address: string;
  polyline: string;
  route_points: { lat: number; lng: number }[];
}

export class GoogleDirectionsService {
  private apiKey: string;
  private baseUrl = "https://maps.googleapis.com/maps/api/directions/json";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async calculateRoute(
    origin: string,
    destination: string,
    travelMode: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT" = "DRIVING"
  ): Promise<RouteResult | null> {
    const params = new URLSearchParams({
      origin: origin,
      destination: destination,
      mode: travelMode.toLowerCase(),
      key: this.apiKey,
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Directions API error:", data.status);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distance: leg.distance.text,
      duration: leg.duration.text,
      start_address: leg.start_address,
      end_address: leg.end_address,
      polyline: route.overview_polyline.points,
      legs: route.legs.map((leg) => ({
        distance: leg.distance.text,
        duration: leg.duration.text,
        start_address: leg.start_address,
        end_address: leg.end_address,
        start_location: leg.start_location,
        end_location: leg.end_location,
      })),
      route_points: this.extractRoutePoints(route, 10),
    };
  }
}

// server/routes.ts - Added endpoint
app.get("/api/route", async (req, res) => {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res
      .status(400)
      .json({ message: "Origin and destination are required" });
  }

  if (!directionsService) {
    return res.status(503).json({
      message: "Google Maps API key is required for route calculation",
    });
  }

  try {
    const route = await directionsService.calculateRoute(origin, destination);

    if (!route) {
      return res.status(404).json({
        message: "Could not calculate route between the specified locations",
      });
    }

    res.json(route);
  } catch (error) {
    console.error("Error calculating route:", error);
    res.status(500).json({ message: "Failed to calculate route" });
  }
});
```

**Date:** July 30, 2025
**Project:** [[Routewise]]
**Status:** Solved

#nodejs #express #google-api #directions #routing #backend #api-integration #solved
**Related:** [[Google Places Integration]] [[Express Routes]] [[Travel Planning]]

---

## Project Status

### Current MVP Progress Assessment

**Question:** What's the current status of the Routewise MVP implementation?
**Error/Issue:** Need to understand what's completed vs what needs work
**Context:** 2-week MVP timeline, need to prioritize remaining work
**Solution:** Analyzed project structure and functionality - 65% complete
**Code:**

```markdown
✅ Completed (65%):

- Backend: Express + Google Places/Directions APIs
- Frontend: React components with shadcn/ui
- Database: PostgreSQL with Drizzle ORM
- Environment: Docker Compose setup
- APIs: Real Google data integration

🔧 Remaining (35%):

- Route visualization on map
- Interactive itinerary view
- POI selection/deselection
- Route recalculation
- Production deployment
```

**Date:** July 30, 2025
**Project:** [[Routewise]]
**Status:** Ongoing

#project-analysis #mvp #progress #assessment #ongoing
**Related:** [[Project Planning]] [[Development Timeline]]

---

## Frontend Development

### JSX Escaped Quotes Syntax Error

**Question:** Pre-transform error with escaped quotes in JSX className attributes
**Error/Issue:** `Expecting Unicode escape sequence \uXXXX. (106:21)` - Pre-transform error in itinerary component
**Context:** Building enhanced itinerary component with TypeScript and JSX
**Solution:** Replace escaped quotes `\"` with regular quotes `"` in all JSX className attributes
**Code:**

```jsx
// Wrong (causes error)
<Card className=\"w-full\">
  <div className=\"space-y-6\">

// Correct
<Card className="w-full">
  <div className="space-y-6">
```

**Date:** July 30, 2025
**Project:** [[Routewise]]
**Status:** Solved

#react #jsx #typescript #syntax-error #frontend #solved
**Related:** [[Component Development]] [[TypeScript Configuration]]

---

### Enhanced Itinerary Component Implementation

**Question:** How can POI Integration work better with real route data?
**Error/Issue:** Basic POI grouping using mock data instead of real route positioning
**Context:** Need smart POI positioning along actual calculated routes with interactive selection
**Solution:** Created enhanced itinerary component with Google Directions API integration, real distance calculations, and interactive POI selection
**Code:**

```typescript
// Enhanced component with real route data
export default function ItineraryComponent({
  startCity,
  endCity,
  checkpoints,
  pois,
  onUpdateSelectedPois,
}: ItineraryComponentProps) {
  const [selectedPoiIds, setSelectedPoiIds] = useState<Set<number>>(new Set());
  const [poisWithDistances, setPoisWithDistances] = useState<Poi[]>([]);

  // Fetch actual route data from backend
  const { data: routeData, isLoading: routeLoading } = useQuery<RouteData>({
    queryKey: ["/api/route", startCity, endCity],
    queryFn: async () => {
      const params = new URLSearchParams({
        origin: startCity,
        destination: endCity,
      });
      const response = await fetch(`/api/route?${params}`);
      return response.json();
    },
    enabled: !!(startCity && endCity),
  });

  // Calculate POI positions along route
  useEffect(() => {
    if (routeData?.route_points && pois.length > 0) {
      const poisWithPositions = pois.map((poi) => {
        const poiCoords = extractPoiCoordinates(poi);
        if (poiCoords) {
          const distanceFromStart = calculateDistanceAlongRoute(
            routeData.route_points,
            poiCoords
          );
          return { ...poi, distanceFromStart, coordinates: poiCoords };
        }
        return poi;
      });
      setPoisWithDistances(
        poisWithPositions.sort(
          (a, b) => (a.distanceFromStart || 0) - (b.distanceFromStart || 0)
        )
      );
    }
  }, [routeData, pois]);
}
```

**Date:** July 30, 2025
**Project:** [[Routewise]]
**Status:** Solved

#react #google-api #routing #poi-integration #frontend #enhanced-features #solved
**Related:** [[Google Directions Integration]] [[POI Management]] [[Interactive Components]]

---

## Google Cloud Configuration

### Google Cloud Billing API Access Error

**Question:** Google APIs returning REQUEST*DENIED errors for geocoding
**Error/Issue:** `REQUEST_DENIED You must enable Billing on the Google Cloud Project at https://console.cloud.google.com/project/*/billing/enable`
**Context:** Trying to use Google Geocoding and Directions APIs for real route calculation
**Solution:** Enable billing in Google Cloud Console, user resolved by switching to different credit card
**Code:**

```bash
# APIs that require billing:
# - Geocoding API (city → coordinates)
# - Directions API (route calculation)
# - Places API (business data)

# Fallback system when billing not enabled:
# - Uses hardcoded city coordinates
# - Still gets real Places data
# - Graceful degradation
```

**Date:** July 30, 2025
**Project:** [[Routewise]]
**Status:** Solved

#google-cloud #billing #api-access #geocoding #directions #solved
**Related:** [[Google API Configuration]] [[API Billing]] [[Fallback Systems]]

---

### POI Data Flow and Architecture Explanation

**Question:** Can you explain to me how you are getting POIs?
**Error/Issue:** Need to understand complete POI fetching architecture
**Context:** Understanding data flow from frontend queries to Google APIs
**Solution:** Detailed explanation of multi-layer POI system with route/checkpoint/fallback strategies
**Code:**

```javascript
// Frontend Queries
const { data: pois } = useQuery({
  queryKey: ["/api/pois", startCity, endCity],
  queryFn: async () => {
    const params = new URLSearchParams({ start: startCity, end: endCity });
    return fetch(`/api/pois?${params}`).then((res) => res.json());
  },
});

// Backend API Decision Tree
app.get("/api/pois", async (req, res) => {
  const { start, end, checkpoint } = req.query;

  if (checkpoint) {
    return await getCheckpointPois(checkpoint, placesService, res);
  }
  if (start && end) {
    return await getRoutePois(start, end, placesService, res);
  }
  return await getGeneralPois(placesService, res);
});

// Route POI Process:
// 1. Geocode cities → Get lat/lng
// 2. Generate route points → 4 intermediate points
// 3. Search each point → 25km radius for businesses
// 4. Transform data → Convert to POI schema
// 5. Return results → ~36 POIs max
```

**Date:** July 30, 2025
**Project:** [[Routewise]]
**Status:** Explained

#architecture #poi-system #google-api #data-flow #backend #explanation
**Related:** [[Google Places Integration]] [[API Architecture]] [[Data Management]]

---
