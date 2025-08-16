import { Map as LeafletMap, Polyline, LayerGroup, LatLngBounds, divIcon, Marker } from 'leaflet';
import * as polyline from '@mapbox/polyline';
import type { RouteSegment, ItineraryDay } from '@/types/schema';

// Color palette for multi-day routes (up to 14 days)
const ROUTE_COLORS = [
  '#EA4335', // Red
  '#34A853', // Green  
  '#4285F4', // Blue
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#795548', // Brown
  '#E91E63', // Pink
  '#FF5722', // Deep Orange
  '#607D8B', // Blue Grey
  '#8BC34A', // Light Green
  '#FFC107', // Amber
  '#673AB7', // Deep Purple
  '#00BCD4', // Cyan
  '#CDDC39', // Lime
];

/**
 * Get the color for a specific day (utility function)
 */
export function getDayColor(day: number): string {
  return ROUTE_COLORS[(day - 1) % ROUTE_COLORS.length];
}

export interface RouteLayer {
  polyline: Polyline;
  markers: Marker[];
  bounds: LatLngBounds;
}

export class MultiRouteRenderer {
  private map: LeafletMap;
  private routeLayers: Map<number, RouteLayer> = new Map();
  private routeGroup: LayerGroup;
  private visibleDays: Set<number> = new Set();

  constructor(map: LeafletMap) {
    this.map = map;
    this.routeGroup = new LayerGroup().addTo(map);
  }

  /**
   * Add multiple day routes to the map
   */
  addMultiDayRoutes(routesByDay: Record<number, RouteSegment>, itinerary: ItineraryDay[]): void {
    // Clear existing routes
    this.clearAllRoutes();

    Object.entries(routesByDay).forEach(([dayStr, route]) => {
      const day = parseInt(dayStr, 10);
      const dayData = itinerary.find(d => d.day === day);
      const color = this.getDayColor(day);
      
      if (route.encodedPolyline && dayData) {
        this.addDayRoute(day, route, dayData, color);
      }
    });
  }

  /**
   * Add a single day's route to the map
   */
  private addDayRoute(day: number, route: RouteSegment, dayData: ItineraryDay, color: string): void {
    try {
      // Decode polyline coordinates
      const coordinates: [number, number][] = polyline.decode(route.encodedPolyline);
      const latLngs = coordinates.map(([lat, lng]: [number, number]) => [lat, lng] as [number, number]);

      // Create polyline
      const routePolyline = new Polyline(latLngs, {
        color: color,
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1,
      });

      // Create waypoint markers
      const markers: Marker[] = [];
      dayData.waypoints.forEach((waypoint, index) => {
        const isStart = index === 0;
        const isEnd = index === dayData.waypoints.length - 1;
        const markerIcon = this.createWaypointIcon(color, isStart, isEnd, index + 1);
        
        const marker = new Marker([waypoint.lat, waypoint.lng], { icon: markerIcon })
          .bindPopup(`
            <div class="text-sm">
              <h3 class="font-semibold">${waypoint.name}</h3>
              <p class="text-muted-foreground">Day ${day} - ${isStart ? 'Start' : isEnd ? 'End' : `Stop ${index + 1}`}</p>
              ${waypoint.address ? `<p class="text-xs text-muted-foreground mt-1">${waypoint.address}</p>` : ''}
            </div>
          `);
        
        markers.push(marker);
      });

      // Calculate bounds for this route
      const bounds = new LatLngBounds(latLngs);

      // Store route layer
      this.routeLayers.set(day, {
        polyline: routePolyline,
        markers,
        bounds,
      });

    } catch (error) {
      console.error(`Failed to render route for day ${day}:`, error);
    }
  }

  /**
   * Show only specific day routes
   */
  showOnlyDay(day: number): void {
    this.hideAllRoutes();
    this.showDays([day]);
    this.fitBoundsToDay(day);
  }

  /**
   * Show multiple specific days
   */
  showDays(days: number[]): void {
    // Hide currently visible days that aren't in the new selection
    this.visibleDays.forEach(day => {
      if (!days.includes(day)) {
        this.hideDayRoute(day);
      }
    });

    // Show the requested days
    days.forEach(day => {
      this.showDayRoute(day);
    });

    this.visibleDays = new Set(days);

    // Fit bounds to all visible routes
    if (days.length > 1) {
      this.fitBoundsToAllVisible();
    }
  }

  /**
   * Show all routes
   */
  showAllRoutes(): void {
    const allDays = Array.from(this.routeLayers.keys());
    this.showDays(allDays);
  }

  /**
   * Hide all routes
   */
  hideAllRoutes(): void {
    this.routeLayers.forEach((_, day) => {
      this.hideDayRoute(day);
    });
    this.visibleDays.clear();
  }

  /**
   * Show a specific day's route
   */
  private showDayRoute(day: number): void {
    const routeLayer = this.routeLayers.get(day);
    if (routeLayer) {
      this.routeGroup.addLayer(routeLayer.polyline);
      routeLayer.markers.forEach(marker => {
        this.routeGroup.addLayer(marker);
      });
      this.visibleDays.add(day);
    }
  }

  /**
   * Hide a specific day's route
   */
  private hideDayRoute(day: number): void {
    const routeLayer = this.routeLayers.get(day);
    if (routeLayer) {
      this.routeGroup.removeLayer(routeLayer.polyline);
      routeLayer.markers.forEach(marker => {
        this.routeGroup.removeLayer(marker);
      });
      this.visibleDays.delete(day);
    }
  }

  /**
   * Fit map bounds to specific day
   */
  private fitBoundsToDay(day: number): void {
    const routeLayer = this.routeLayers.get(day);
    if (routeLayer) {
      this.map.fitBounds(routeLayer.bounds, { padding: [20, 20] });
    }
  }

  /**
   * Fit map bounds to all visible routes
   */
  private fitBoundsToAllVisible(): void {
    if (this.visibleDays.size === 0) return;

    const combinedBounds = new LatLngBounds([]);
    this.visibleDays.forEach(day => {
      const routeLayer = this.routeLayers.get(day);
      if (routeLayer) {
        combinedBounds.extend(routeLayer.bounds);
      }
    });

    if (combinedBounds.isValid()) {
      this.map.fitBounds(combinedBounds, { padding: [20, 20] });
    }
  }

  /**
   * Get the color for a specific day
   */
  getDayColor(day: number): string {
    return getDayColor(day);
  }

  /**
   * Create waypoint marker icon
   */
  private createWaypointIcon(color: string, isStart: boolean, isEnd: boolean, number: number) {
    const size = 28;
    let symbol = number.toString();
    
    if (isStart) {
      symbol = '●';
    } else if (isEnd) {
      symbol = '▲';
    }

    return divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-weight: bold;
          font-size: ${isStart || isEnd ? '16px' : '12px'};
          color: white;
        ">
          ${symbol}
        </div>
      `,
      className: 'custom-waypoint-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }

  /**
   * Clear all routes from the map
   */
  clearAllRoutes(): void {
    this.routeGroup.clearLayers();
    this.routeLayers.clear();
    this.visibleDays.clear();
  }

  /**
   * Get currently visible days
   */
  getVisibleDays(): number[] {
    return Array.from(this.visibleDays).sort((a, b) => a - b);
  }

  /**
   * Get total number of days
   */
  getTotalDays(): number {
    return this.routeLayers.size;
  }

  /**
   * Check if a day has a route
   */
  hasRoute(day: number): boolean {
    return this.routeLayers.has(day);
  }

  /**
   * Add standalone waypoint markers (without routes) for all itinerary days
   */
  addStandaloneWaypoints(itinerary: ItineraryDay[]): void {
    console.log('🔍 addStandaloneWaypoints called with:', itinerary);
    
    // Clear existing routes first
    this.clearAllRoutes();

    itinerary.forEach((dayData) => {
      console.log(`🔍 Processing day ${dayData.day}:`, dayData);
      const color = this.getDayColor(dayData.day);
      console.log(`🔍 Day ${dayData.day} color:`, color);
      const markers: Marker[] = [];
      
      // Create markers for each waypoint in this day
      dayData.waypoints.forEach((waypoint, index) => {
        console.log(`🔍 Creating marker for waypoint ${index}:`, waypoint);
        console.log(`🔍 Coordinates: lat=${waypoint.lat}, lng=${waypoint.lng}`);
        
        const isStart = index === 0;
        const isEnd = index === dayData.waypoints.length - 1;
        const markerIcon = this.createWaypointIcon(color, isStart, isEnd, index + 1);
        
        const marker = new Marker([waypoint.lat, waypoint.lng], { icon: markerIcon })
          .bindPopup(`
            <div class="text-sm">
              <h3 class="font-semibold">${waypoint.name}</h3>
              <p class="text-muted-foreground">Day ${dayData.day} - ${isStart ? 'Start' : isEnd ? 'End' : `Stop ${index + 1}`}</p>
              ${waypoint.address ? `<p class="text-xs text-muted-foreground mt-1">${waypoint.address}</p>` : ''}
            </div>
          `);
        
        console.log(`🔍 Created marker:`, marker);
        markers.push(marker);
        this.routeGroup.addLayer(marker);
        console.log(`🔍 Added marker to route group`);
      });

      // Create a fake RouteLayer with just markers (no polyline)
      if (markers.length > 0) {
        console.log(`🔍 Creating RouteLayer for day ${dayData.day} with ${markers.length} markers`);
        const bounds = new LatLngBounds([]);
        markers.forEach(marker => {
          bounds.extend(marker.getLatLng());
        });
        console.log(`🔍 Bounds for day ${dayData.day}:`, bounds);

        // Create empty polyline to satisfy the RouteLayer interface
        const emptyPolyline = new Polyline([], { color: 'transparent', weight: 0 });
        
        this.routeLayers.set(dayData.day, {
          polyline: emptyPolyline,
          markers: markers,
          bounds: bounds
        });
        console.log(`🔍 Added RouteLayer for day ${dayData.day}`);
      }
    });

    // Show all days by default
    const dayNumbers = itinerary.map(d => d.day);
    this.visibleDays = new Set(dayNumbers);
    console.log(`🔍 Visible days set to:`, dayNumbers);

    // Fit bounds to all waypoints
    if (itinerary.length > 0) {
      console.log(`🔍 Fitting bounds to all visible waypoints`);
      this.fitBoundsToAllVisible();
    }
    
    console.log(`🔍 Final route layers:`, this.routeLayers);
    console.log(`🔍 Route group layers count:`, this.routeGroup.getLayers().length);
  }

  /**
   * Cleanup - remove from map
   */
  destroy(): void {
    this.clearAllRoutes();
    this.map.removeLayer(this.routeGroup);
  }
}