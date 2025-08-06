import { http, HttpResponse } from "msw";
import type { Poi } from "@/types/schema";
// Helper function to generate mock coordinates for addresses
function getMockCoordinatesForAddress(address: string): {
  lat: number;
  lng: number;
} {
  // Hash the address to get consistent coordinates for the same address
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use hash to generate coordinates within Dallas area
  // Dallas bounds: lat 32.6-32.9, lng -96.9 to -96.6
  const latBase = 32.7; // Dallas center lat
  const lngBase = -96.8; // Dallas center lng

  const latOffset = ((hash % 1000) / 10000) * 0.3; // ±0.15 degree variation
  const lngOffset = (((hash >> 10) % 1000) / 10000) * 0.3; // ±0.15 degree variation

  return {
    lat: latBase + latOffset,
    lng: lngBase + lngOffset,
  };
}

// Mock data generators
const generateMockPoi = (overrides: Partial<InsertPoi> = {}): InsertPoi => {
  const categories = [
    "restaurant",
    "attraction",
    "park",
    "museum",
    "shopping",
  ] as const;
  const names = [
    "The Rustic Table",
    "Blue Mountain Vista",
    "Historic Downtown",
    "Cedar Creek Park",
    "Art Gallery 42",
    "Main Street Cafe",
    "Riverside Plaza",
    "Oak Tree Museum",
    "Mountain View Restaurant",
    "Sunset Point",
    "City Center Mall",
    "Pine Ridge Lodge",
    "Golden Gate Viewpoint",
    "Artisan Bakery",
    "Waterfall Trail",
    "Heritage Museum",
  ];

  const descriptions = [
    "A charming local favorite with authentic cuisine and friendly atmosphere",
    "Breathtaking panoramic views and perfect photo opportunities",
    "Rich history and cultural significance in a beautiful setting",
    "Family-friendly destination with activities for all ages",
    "Unique shopping experience with local artisan crafts",
    "Peaceful retreat surrounded by natural beauty",
  ];

  const addresses = [
    "123 Main St, Austin, TX 78701",
    "456 Oak Ave, Dallas, TX 75201",
    "789 Pine Rd, Houston, TX 77001",
    "321 Elm St, San Antonio, TX 78205",
    "654 Maple Dr, Fort Worth, TX 76102",
  ];

  const imageUrls = [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  ];

  return {
    name: names[Math.floor(Math.random() * names.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
    reviewCount: Math.floor(Math.random() * 500) + 50,
    timeFromStart: `${(Math.random() * 8 + 0.5).toFixed(1)} hours in`,
    imageUrl: imageUrls[Math.floor(Math.random() * imageUrls.length)],
    placeId: `mock_place_${Math.random().toString(36).substr(2, 9)}`,
    address: addresses[Math.floor(Math.random() * addresses.length)],
    priceLevel: Math.floor(Math.random() * 4) + 1,
    isOpen: Math.random() > 0.3,
    ...overrides,
  };
};

// API Handlers
export const handlers = [
  // Google Maps GeocodeService.Search API
  http.get(
    "https://maps.googleapis.com/maps/api/js/GeocodeService.Search",
    ({ request }) => {
      const url = new URL(request.url);
      const address = url.searchParams.get("4s"); // Google uses '4s' parameter for address
      const callback = url.searchParams.get("callback");

      console.log(
        `🎭 MSW: Intercepted Google Maps GeocodeService.Search - RETURNING MOCK COORDINATES for "${address}"`
      );

      if (!address) {
        const errorResponse = {
          results: [],
          status: "INVALID_REQUEST",
        };
        const jsonpResponse = callback
          ? `${callback}(${JSON.stringify(errorResponse)});`
          : JSON.stringify(errorResponse);
        return new Response(jsonpResponse, {
          headers: { "Content-Type": "application/javascript" },
        });
      }

      // Generate mock coordinates for the address
      const coordinates = getMockCoordinatesForAddress(address);

      // Create realistic geocoding response
      const mockResponse = {
        results: [
          {
            address_components: [
              {
                long_name: address.split(",")[0] || address,
                short_name: address.split(",")[0] || address,
                types: ["street_address"],
              },
              {
                long_name: "Dallas",
                short_name: "Dallas",
                types: ["locality", "political"],
              },
              {
                long_name: "Dallas County",
                short_name: "Dallas County",
                types: ["administrative_area_level_2", "political"],
              },
              {
                long_name: "Texas",
                short_name: "TX",
                types: ["administrative_area_level_1", "political"],
              },
              {
                long_name: "United States",
                short_name: "US",
                types: ["country", "political"],
              },
            ],
            formatted_address: `${address}, Dallas, TX, USA`,
            geometry: {
              location: {
                lat: coordinates.lat,
                lng: coordinates.lng,
              },
              location_type: "ROOFTOP",
              viewport: {
                northeast: {
                  lat: coordinates.lat + 0.001,
                  lng: coordinates.lng + 0.001,
                },
                southwest: {
                  lat: coordinates.lat - 0.001,
                  lng: coordinates.lng - 0.001,
                },
              },
            },
            place_id: `mock_place_${Math.random().toString(36).substr(2, 9)}`,
            plus_code: {
              compound_code: `${Math.random()
                .toString(36)
                .substr(2, 4)
                .toUpperCase()}+${Math.random()
                .toString(36)
                .substr(2, 2)
                .toUpperCase()} Dallas, TX, USA`,
              global_code: `864F${Math.random()
                .toString(36)
                .substr(2, 4)
                .toUpperCase()}+${Math.random()
                .toString(36)
                .substr(2, 2)
                .toUpperCase()}`,
            },
            types: ["street_address"],
          },
        ],
        status: "OK",
      };

      // Return JSONP response if callback is provided, otherwise JSON
      const jsonpResponse = callback
        ? `${callback}(${JSON.stringify(mockResponse)});`
        : JSON.stringify(mockResponse);
      console.log(
        `🎭 MSW: Returning mock coordinates lat: ${coordinates.lat.toFixed(
          6
        )}, lng: ${coordinates.lng.toFixed(6)}`
      );

      return new Response(jsonpResponse, {
        headers: { "Content-Type": "application/javascript" },
      });
    }
  ),

  // Google Maps DirectionsService.Route API
  http.get(
    "https://maps.googleapis.com/maps/api/js/DirectionsService.Route",
    ({ request }) => {
      const url = new URL(request.url);
      const callback = url.searchParams.get("callback");
      
      // Extract origin and destination from URL parameters
      const origin = url.searchParams.get("1m1") || url.searchParams.get("2s") || "Unknown Origin";
      const destination = url.searchParams.get("2s") || "Unknown Destination";
      
      console.log(
        `🎭 MSW: Intercepted Google Maps DirectionsService.Route - RETURNING MOCK ROUTE from "${origin}" to "${destination}"`
      );

      // Generate mock route data
      const mockResponse = {
        routes: [
          {
            legs: [
              {
                distance: {
                  text: "274 mi",
                  value: 440901
                },
                duration: {
                  text: "4 hours 15 mins",
                  value: 15300
                },
                end_address: `${destination}, TX, USA`,
                start_address: `${origin}, TX, USA`,
                steps: [
                  {
                    distance: { text: "0.2 mi", value: 322 },
                    duration: { text: "1 min", value: 60 },
                    html_instructions: "Head <b>north</b> on Main St",
                    polyline: { points: "mockPolylinePoints" },
                    start_location: { lat: 29.4241, lng: -98.4936 },
                    end_location: { lat: 29.4261, lng: -98.4936 }
                  }
                ],
                start_location: { lat: 29.4241, lng: -98.4936 },
                end_location: { lat: 32.7767, lng: -96.797 }
              }
            ],
            overview_polyline: {
              points: "mockOverviewPolylinePoints"
            },
            summary: `I-35 N`,
            warnings: [],
            waypoint_order: []
          }
        ],
        status: "OK"
      };

      // Return JSONP response if callback is provided, otherwise JSON
      const jsonpResponse = callback
        ? `${callback}(${JSON.stringify(mockResponse)});`
        : JSON.stringify(mockResponse);
      
      console.log(`🎭 MSW: Returning mock route data for ${origin} to ${destination}`);

      return new Response(jsonpResponse, {
        headers: { "Content-Type": "application/javascript" },
      });
    }
  ),

  // Google Maps Tiles API (Vector Tiles)
  http.get("https://maps.googleapis.com/maps/vt", ({ request }) => {
    const url = new URL(request.url);
    const pb = url.searchParams.get("pb");

    console.log(
      `🎭 MSW: Intercepted Google Maps tiles request - RETURNING MOCK TILE IMAGE`
    );

    // Create a simple 256x256 placeholder tile image (1x1 pixel PNG, stretched)
    // This is a base64 encoded 1x1 transparent PNG
    const transparentPng =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    // Convert base64 to binary
    const binaryString = atob(transparentPng);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400", // Cache for 1 day like real tiles
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),

  // Google Maps Static Assets (cursors, icons, etc.)
  http.get(/.*maps\.gstatic\.com\/mapfiles\/.*/, ({ request }) => {
    const url = new URL(request.url);
    const filename = url.pathname.split('/').pop();
    
    console.log(`🎭 MSW: Intercepted Google Maps static asset - ${filename}`);
    
    // Return empty response for cursor files (.cur)
    if (filename && filename.endsWith('.cur')) {
      // Create minimal cursor file data (empty .cur file)
      const cursorData = new Uint8Array(0);
      return new Response(cursorData, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }
    
    // For other static assets, return empty response
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }),

  // Google Maps Internal RPC - GetViewportInfo
  http.post(
    "https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetViewportInfo",
    async ({ request }) => {
      const requestBody = await request.json();

      console.log(
        `🎭 MSW: Intercepted Google Maps GetViewportInfo RPC - RETURNING MOCK VIEWPORT DATA`
      );

      // Parse viewport bounds from request body
      // Format: [[[sw_lat, sw_lng], [ne_lat, ne_lng]], zoom, ...]
      const viewportBounds = requestBody[0] || [];
      const zoomLevel = requestBody[1] || 7;
      const language = requestBody[3] || "en-US";

      let swBounds = { lat: 32.0, lng: -97.5 }; // Default Dallas area
      let neBounds = { lat: 33.5, lng: -96.0 };

      if (viewportBounds.length >= 2) {
        swBounds = { lat: viewportBounds[0][0], lng: viewportBounds[0][1] };
        neBounds = { lat: viewportBounds[1][0], lng: viewportBounds[1][1] };
      }

      // Create mock RPC response matching Google's internal format
      const mockResponse = [
        null, // Status/error field
        [
          [
            // Viewport region data
            [
              [swBounds.lat, swBounds.lng], // Southwest bounds
              [neBounds.lat, neBounds.lng], // Northeast bounds
            ],
            zoomLevel,
            null,
            language,
            0,
            "m@742000000", // Map version
            0,
            0,
            null,
            null,
            null,
            2,
          ],
        ],
        null, // Additional metadata
      ];

      console.log(
        `🎭 MSW: Returning mock viewport for bounds SW: ${swBounds.lat.toFixed(
          4
        )}, ${swBounds.lng.toFixed(4)} NE: ${neBounds.lat.toFixed(
          4
        )}, ${neBounds.lng.toFixed(4)}`
      );

      return HttpResponse.json(mockResponse, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  ),

  // Google Places Photo API - using more flexible pattern matching
  http.get(
    /.*maps\.googleapis\.com\/maps\/api\/place\/photo.*/,
    async ({ request }) => {
      const url = new URL(request.url);
      const photoReference = url.searchParams.get("photo_reference");
      const maxwidth = url.searchParams.get("maxwidth") || "800";

      console.log(`🎭 MSW: Intercepted Google Places Photo API`);
      console.log(`🎭 MSW: Full URL: ${request.url}`);
      console.log(
        `🎭 MSW: Photo reference: ${photoReference?.substring(0, 20)}...`
      );

      if (!photoReference) {
        console.error("🎭 MSW: No photo reference found in request");
        return new Response("Photo reference required", { status: 400 });
      }

      try {
        // Generate the expected filename using shared utility
        const filename = createSafeFilename(
          "google-places-photo",
          photoReference
        );

        console.log(`🎭 MSW: Generated filename: ${filename}`);

        // Try to load the actual mock file from responses directory
        // Always return a static placeholder image instead of trying to load mock files
        console.log(`🎭 MSW: Returning static placeholder image for photo reference`);
        
        // Create a simple placeholder image (1x1 gray pixel, scaled to requested size)
        const grayPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jgl+4QAAAABJRU5ErkJggg==';
        const bytes = Uint8Array.from(atob(grayPixel), c => c.charCodeAt(0));
        
        return new Response(bytes, {
          headers: {
            'Content-Type': 'image/png',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
            'Content-Length': bytes.length.toString()
          }
        });
      } catch (error) {
        console.error("🎭 MSW: Error processing photo request:", error);
        // Fallback to a static placeholder image
        const grayPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jgl+4QAAAABJRU5ErkJggg==';
        const bytes = Uint8Array.from(atob(grayPixel), c => c.charCodeAt(0));
        
        return new Response(bytes, {
          headers: {
            'Content-Type': 'image/png',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
            'Content-Length': bytes.length.toString()
          }
        });
      }
    }
  ),

  // Health Check Endpoint
  http.get("/api/health", () => {
    console.log(
      "🎭 MSW: Intercepted /api/health request - RETURNING MOCK DATA"
    );

    return HttpResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        nominatim: "available",
        googlePlaces: "available",
        googleMaps: "available",
      },
    });
  }),

  // Google Maps API Key Endpoint
  http.get("/api/maps-key", () => {
    console.log(
      "🎭 MSW: Intercepted /api/maps-key request - RETURNING MOCK API KEY"
    );

    return HttpResponse.json({
      apiKey: "mock-google-maps-api-key-for-development",
    });
  }),

  // Places Autocomplete (Free Nominatim)
  http.get("/api/places/autocomplete", ({ request }) => {
    const url = new URL(request.url);
    const input = url.searchParams.get("input");

    console.log(
      `🎭 MSW: Intercepted /api/places/autocomplete request - RETURNING MOCK CITIES for "${input}"`
    );

    if (!input) {
      return HttpResponse.json(
        { message: "Input parameter is required" },
        { status: 400 }
      );
    }

    // Mock city suggestions based on input
    const mockCities = [
      {
        place_id: "1",
        description: "Austin, TX, USA",
        main_text: "Austin",
        secondary_text: "TX, USA",
      },
      {
        place_id: "2",
        description: "Dallas, TX, USA",
        main_text: "Dallas",
        secondary_text: "TX, USA",
      },
      {
        place_id: "3",
        description: "Houston, TX, USA",
        main_text: "Houston",
        secondary_text: "TX, USA",
      },
      {
        place_id: "4",
        description: "San Antonio, TX, USA",
        main_text: "San Antonio",
        secondary_text: "TX, USA",
      },
      {
        place_id: "5",
        description: "Phoenix, AZ, USA",
        main_text: "Phoenix",
        secondary_text: "AZ, USA",
      },
      {
        place_id: "6",
        description: "Denver, CO, USA",
        main_text: "Denver",
        secondary_text: "CO, USA",
      },
      {
        place_id: "7",
        description: "Las Vegas, NV, USA",
        main_text: "Las Vegas",
        secondary_text: "NV, USA",
      },
      {
        place_id: "8",
        description: "Los Angeles, CA, USA",
        main_text: "Los Angeles",
        secondary_text: "CA, USA",
      },
    ];

    // Filter cities based on input
    const filteredCities = mockCities.filter(
      (city) =>
        city.main_text.toLowerCase().includes(input.toLowerCase()) ||
        city.description.toLowerCase().includes(input.toLowerCase())
    );

    return HttpResponse.json({
      predictions: filteredCities.slice(0, 5),
    });
  }),

  // Premium Google Places Autocomplete
  http.get("/api/places/autocomplete/google", ({ request }) => {
    const url = new URL(request.url);
    const input = url.searchParams.get("input");

    console.log(
      `🎭 MSW: Intercepted /api/places/autocomplete/google request - RETURNING MOCK PREMIUM CITIES for "${input}"`
    );

    if (!input) {
      return HttpResponse.json(
        { message: "Input parameter is required" },
        { status: 400 }
      );
    }

    // Mock premium city suggestions with more detailed data
    const mockPremiumCities = [
      {
        place_id: "premium_1",
        description: "Austin, TX, USA",
        main_text: "Austin",
        secondary_text: "Texas, USA",
      },
      {
        place_id: "premium_2",
        description: "Dallas, TX, USA",
        main_text: "Dallas",
        secondary_text: "Texas, USA",
      },
      {
        place_id: "premium_3",
        description: "Houston, TX, USA",
        main_text: "Houston",
        secondary_text: "Texas, USA",
      },
      {
        place_id: "premium_4",
        description: "San Antonio, TX, USA",
        main_text: "San Antonio",
        secondary_text: "Texas, USA",
      },
      {
        place_id: "premium_5",
        description: "Phoenix, AZ, USA",
        main_text: "Phoenix",
        secondary_text: "Arizona, USA",
      },
      {
        place_id: "premium_6",
        description: "Denver, CO, USA",
        main_text: "Denver",
        secondary_text: "Colorado, USA",
      },
    ];

    const filteredCities = mockPremiumCities.filter(
      (city) =>
        city.main_text.toLowerCase().includes(input.toLowerCase()) ||
        city.description.toLowerCase().includes(input.toLowerCase())
    );

    return HttpResponse.json({
      predictions: filteredCities.slice(0, 8),
    });
  }),

  // Points of Interest (POIs) Endpoint
  http.get("/api/pois", ({ request }) => {
    const url = new URL(request.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const checkpoint = url.searchParams.get("checkpoint");

    let logMessage =
      "🎭 MSW: Intercepted /api/pois request - RETURNING MOCK POI DATA";

    if (checkpoint) {
      logMessage += ` for checkpoint "${checkpoint}"`;
    } else if (start && end) {
      logMessage += ` for route "${start}" → "${end}"`;
    } else {
      logMessage += " (general POIs)";
    }

    console.log(logMessage);

    // Mock POI data generation
    let poisCount = 12; // Default number of POIs
    let mockPois: InsertPoi[] = [];

    if (checkpoint) {
      // Generate checkpoint-specific POIs
      poisCount = 6;
      mockPois = Array.from({ length: poisCount }, (_, index) =>
        generateMockPoi({
          timeFromStart: `In ${checkpoint}`,
          placeId: `checkpoint_${checkpoint.toLowerCase()}_${index}`,
        })
      );
    } else if (start && end) {
      // Generate route-specific POIs
      poisCount = 15;
      mockPois = Array.from({ length: poisCount }, (_, index) =>
        generateMockPoi({
          timeFromStart: `${(index * 0.8 + 1).toFixed(1)} hours from ${start}`,
          placeId: `route_${start.toLowerCase()}_${end.toLowerCase()}_${index}`,
        })
      );
    } else {
      // Generate general POIs
      poisCount = 20;
      mockPois = Array.from({ length: poisCount }, (_, index) =>
        generateMockPoi({
          placeId: `general_poi_${index}`,
        })
      );
    }

    // Add some delay to simulate network request
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(
          `🎭 MSW: Returning ${mockPois.length} mock POIs (fake data generated by MSW)`
        );
        resolve(HttpResponse.json(mockPois));
      }, Math.random() * 500 + 200); // 200-700ms delay
    });
  }),

  // Get POI by ID
  http.get("/api/pois/:id", ({ params }) => {
    const { id } = params;
    console.log(
      `🎭 MSW: Intercepted /api/pois/${id} request - RETURNING MOCK POI DATA for ID ${id}`
    );

    const poiId = parseInt(id as string);
    if (isNaN(poiId)) {
      return HttpResponse.json({ message: "Invalid POI ID" }, { status: 400 });
    }

    // Generate a specific POI for the requested ID
    const mockPoi = generateMockPoi({
      placeId: `specific_poi_${id}`,
      name: `POI #${id}`,
    });

    return HttpResponse.json(mockPoi);
  }),
];
