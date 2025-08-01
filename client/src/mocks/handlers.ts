import { http, graphql } from "msw";

// Catch-all handler to log unhandled requests
const logUnhandledRequests = http.all("*", ({ request }) => {
  console.group(`🔍 Unhandled ${request.method} request to ${request.url}`);
  console.log("Headers:", Object.fromEntries(request.headers.entries()));
  console.log(
    "URL params:",
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  console.groupEnd();

  // Pass through to actual network (remove this to block requests)
  return Response.error();
});

import pois from './pois.mock.json';
import geocodeMock from './responses/geocode.mock.json';
import googlePlacesNearbyMock from './responses/google-places-nearby.mock.json';

export const handlers = [
  // Mock POIs endpoint
  http.get('/api/pois', ({ request }) => {
    return Response.json({ pois });
  }),

  // Mock Google Places Nearby endpoint
  http.get('/api/places/nearby', () => {
    return Response.json(googlePlacesNearbyMock);
  }),

  // Mock geocode endpoint
  http.get('/api/geocode', () => {
    return Response.json(geocodeMock);
  }),

  // Mock city autocomplete (Nominatim)
  http.get('/api/places/autocomplete', ({ request }) => {
    const input = new URL(request.url).searchParams.get('input');
    return Response.json({
      predictions: [
        {
          place_id: 'nominatim-1',
          description: `${input} City, Country`,
          main_text: `${input} City`,
          secondary_text: 'Country'
        }
      ]
    });
  }),

  // Mock Google Places autocomplete
  http.get('/api/places/autocomplete/google', ({ request }) => {
    const input = new URL(request.url).searchParams.get('input');
    return Response.json({
      predictions: [
        {
          place_id: 'google-1',
          description: `${input} Google City, Country`,
          main_text: `${input} Google City`,
          secondary_text: 'Country'
        }
      ]
    });
  }),

  // Mock maps key endpoint
  http.get('/api/maps-key', () => {
    return Response.json({ apiKey: 'mock-maps-api-key' });
  }),

  // Mock health check endpoint
  http.get('/api/health', () => {
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'development',
      version: '1.0.0-mock'
    });
  }),

  // Keep this last to catch unhandled requests
  logUnhandledRequests,
];
