// Global type declarations for Google Maps API
declare global {
  interface Window {
    google: typeof google;
    togglePoi?: (poiId: number) => void;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
    }
    
    interface MapOptions {
      zoom?: number;
      center?: LatLng | LatLngLiteral;
      mapTypeId?: MapTypeId;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      scaleControl?: boolean;
      streetViewControl?: boolean;
      rotateControl?: boolean;
      fullscreenControl?: boolean;
    }
    
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
    
    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain'
    }
    
    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: Function): void;
    }
    
    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon | Symbol;
    }
    
    interface Icon {
      url?: string;
      size?: Size;
      origin?: Point;
      anchor?: Point;
      scaledSize?: Size;
      path?: string | SymbolPath;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
      scale?: number;
    }
    
    enum SymbolPath {
      CIRCLE = 0,
      FORWARD_CLOSED_ARROW = 1,
      FORWARD_OPEN_ARROW = 2,
      BACKWARD_CLOSED_ARROW = 3,
      BACKWARD_OPEN_ARROW = 4
    }
    
    class Size {
      constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
    }
    
    class Point {
      constructor(x: number, y: number);
    }
    
    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      close(): void;
      open(map?: Map, anchor?: Marker): void;
      setContent(content: string | Element): void;
    }
    
    interface InfoWindowOptions {
      content?: string | Element;
      position?: LatLng | LatLngLiteral;
    }
    
    class DirectionsService {
      route(request: DirectionsRequest, callback: (result: DirectionsResult, status: DirectionsStatus) => void): void;
    }
    
    interface DirectionsRequest {
      origin: string | LatLng | LatLngLiteral | google.maps.Place;
      destination: string | LatLng | LatLngLiteral | google.maps.Place;
      waypoints?: DirectionsWaypoint[];
      optimizeWaypoints?: boolean;
      travelMode: TravelMode;
      avoidHighways?: boolean;
      avoidTolls?: boolean;
      region?: string;
    }
    
    interface DirectionsWaypoint {
      location: string | LatLng | LatLngLiteral;
      stopover: boolean;
    }
    
    enum TravelMode {
      DRIVING = 'DRIVING',
      WALKING = 'WALKING',
      BICYCLING = 'BICYCLING',
      TRANSIT = 'TRANSIT'
    }
    
    type DirectionsStatus = 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'MAX_WAYPOINTS_EXCEEDED' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
    
    interface DirectionsResult {
      routes: DirectionsRoute[];
    }
    
    interface DirectionsRoute {
      legs: DirectionsLeg[];
      overview_path: LatLng[];
      overview_polyline: string;
      warnings: string[];
      waypoint_order: number[];
    }
    
    interface DirectionsLeg {
      start_location: LatLng;
      end_location: LatLng;
      start_address: string;
      end_address: string;
      distance: Distance;
      duration: Duration;
      steps: DirectionsStep[];
    }
    
    interface Distance {
      text: string;
      value: number;
    }
    
    interface Duration {
      text: string;
      value: number;
    }
    
    interface DirectionsStep {
      distance: Distance;
      duration: Duration;
      end_location: LatLng;
      start_location: LatLng;
      instructions: string;
      path: LatLng[];
      travel_mode: TravelMode;
    }
    
    class DirectionsRenderer {
      constructor(opts?: DirectionsRendererOptions);
      setMap(map: Map | null): void;
      setDirections(directions: DirectionsResult): void;
    }
    
    interface DirectionsRendererOptions {
      map?: Map;
      directions?: DirectionsResult;
      panel?: Element;
      routeIndex?: number;
      suppressMarkers?: boolean;
      suppressInfoWindows?: boolean;
      suppressPolylines?: boolean;
      draggable?: boolean;
    }
    
    class Geocoder {
      constructor();
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: GeocoderStatus) => void): void;
    }
    
    interface GeocoderRequest {
      address?: string;
      location?: LatLng | LatLngLiteral;
      placeId?: string;
      bounds?: LatLngBounds;
      componentRestrictions?: GeocoderComponentRestrictions;
      region?: string;
    }
    
    interface GeocoderResult {
      address_components: GeocoderAddressComponent[];
      formatted_address: string;
      geometry: GeocoderGeometry;
      place_id: string;
      types: string[];
    }
    
    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }
    
    interface GeocoderGeometry {
      bounds?: LatLngBounds;
      location: LatLng;
      location_type: GeocoderLocationType;
      viewport: LatLngBounds;
    }
    
    type GeocoderLocationType = 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
    
    type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_DAILY_LIMIT' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
    
    interface GeocoderComponentRestrictions {
      administrativeArea?: string;
      country?: string | string[];
      locality?: string;
      postalCode?: string;
      route?: string;
    }
    
    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      contains(latLng: LatLng | LatLngLiteral): boolean;
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
    }
    
    interface Place {
      placeId?: string;
      query?: string;
      location?: LatLng | LatLngLiteral;
    }
  }
}

export {};
