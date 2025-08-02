import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';

// Mock handlers for API endpoints
const handlers = [
  // Authentication endpoints
  http.get('http://localhost:3001/api/auth/me', () => {
    return HttpResponse.json({ user: null }, { status: 401 });
  }),

  http.post('http://localhost:3001/api/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string; password: string };
    if (body.username === 'testuser' && body.password === 'password') {
      return HttpResponse.json({
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        token: 'mock-jwt-token'
      });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('http://localhost:3001/api/auth/register', async ({ request }) => {
    const body = await request.json() as { username: string; email: string; password: string };
    return HttpResponse.json({
      user: { id: 2, username: body.username, email: body.email },
      token: 'mock-jwt-token'
    });
  }),

  http.post('http://localhost:3001/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Places endpoints
  http.get('http://localhost:3001/api/places/autocomplete', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    
    return HttpResponse.json({
      predictions: [
        {
          place_id: 'mock-place-1',
          description: `${query} City Center`,
          structured_formatting: {
            main_text: `${query} City`,
            secondary_text: 'Center, State, Country'
          }
        },
        {
          place_id: 'mock-place-2', 
          description: `${query} Downtown`,
          structured_formatting: {
            main_text: `${query} Downtown`,
            secondary_text: 'Business District'
          }
        }
      ]
    });
  }),

  http.get('http://localhost:3001/api/places/details/:placeId', ({ params }) => {
    return HttpResponse.json({
      result: {
        place_id: params.placeId,
        name: 'Mock Location',
        formatted_address: '123 Mock Street, Mock City, State 12345',
        geometry: {
          location: {
            lat: 40.7128,
            lng: -74.0060
          }
        },
        types: ['establishment', 'point_of_interest']
      }
    });
  }),

  // Routes endpoints
  http.post('http://localhost:3001/api/routes/directions', async ({ request }) => {
    const body = await request.json() as { origin: string; destination: string };
    
    return HttpResponse.json({
      routes: [{
        legs: [{
          distance: { text: '10.5 km', value: 10500 },
          duration: { text: '15 mins', value: 900 },
          start_address: body.origin,
          end_address: body.destination,
          steps: [
            {
              distance: { text: '5.2 km', value: 5200 },
              duration: { text: '8 mins', value: 480 },
              html_instructions: 'Head north on Main St',
              start_location: { lat: 40.7128, lng: -74.0060 },
              end_location: { lat: 40.7200, lng: -74.0000 }
            }
          ]
        }],
        overview_polyline: { points: 'mock_polyline_data' },
        summary: 'Main St route'
      }]
    });
  }),

  // POIs endpoints
  http.get('http://localhost:3001/api/pois/nearby', ({ request }) => {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    
    return HttpResponse.json({
      results: [
        {
          place_id: 'poi-1',
          name: 'Mock Restaurant',
          rating: 4.5,
          types: ['restaurant', 'food'],
          geometry: {
            location: { lat: Number(lat) + 0.001, lng: Number(lng) + 0.001 }
          },
          photos: [{ photo_reference: 'mock-photo-ref' }],
          opening_hours: { open_now: true }
        },
        {
          place_id: 'poi-2',
          name: 'Mock Museum',
          rating: 4.2,
          types: ['museum', 'tourist_attraction'],
          geometry: {
            location: { lat: Number(lat) - 0.001, lng: Number(lng) - 0.001 }
          },
          opening_hours: { open_now: false }
        }
      ]
    });
  }),

  // Health check endpoint
  http.get('http://localhost:3001/api/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),

  // Nominatim geocoding (external API mock)
  http.get('https://nominatim.openstreetmap.org/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    return HttpResponse.json([
      {
        place_id: 123456,
        display_name: `${query}, Mock City, Mock State, Mock Country`,
        lat: '40.7128',
        lon: '-74.0060',
        boundingbox: ['40.7000', '40.7200', '-74.0200', '-74.0000']
      }
    ]);
  }),
];

// Mock server for API calls
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
  
  // Set up base URL for fetch
  global.location = {
    ...global.location,
    origin: 'http://localhost:3001',
    href: 'http://localhost:3001',
    protocol: 'http:',
    host: 'localhost:3001',
    hostname: 'localhost',
    port: '3001',
    pathname: '/',
    search: '',
    hash: '',
  };

  // Mock Request constructor to handle relative URLs
  const OriginalRequest = global.Request;
  global.Request = class extends OriginalRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string' && input.startsWith('/')) {
        // Convert relative URLs to absolute URLs for MSW
        input = new URL(input, 'http://localhost:3001').toString();
      }
      super(input, init);
    }
  } as any;
});

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock window.location for URL handling
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3001',
    href: 'http://localhost:3001',
    pathname: '/',
    search: '',
    replace: vi.fn(),
  },
  writable: true,
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock history API
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn(),
    pushState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock fetch for any non-intercepted requests
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue(''),
});

// Mock URLSearchParams
global.URLSearchParams = class URLSearchParams {
  constructor(init?: string | string[][] | Record<string, string>) {}
  get(name: string) { return null; }
  set(name: string, value: string) {}
  append(name: string, value: string) {}
  delete(name: string) {}
  has(name: string) { return false; }
  toString() { return ''; }
};

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));