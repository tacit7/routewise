import { http, HttpResponse } from 'msw';
import type { InsertPoi } from '@shared/schema';

// Mock data generators
const generateMockPoi = (overrides: Partial<InsertPoi> = {}): InsertPoi => {
  const categories = ['restaurant', 'attraction', 'park', 'museum', 'shopping'] as const;
  const names = [
    'The Rustic Table', 'Blue Mountain Vista', 'Historic Downtown', 'Cedar Creek Park',
    'Art Gallery 42', 'Main Street Cafe', 'Riverside Plaza', 'Oak Tree Museum',
    'Mountain View Restaurant', 'Sunset Point', 'City Center Mall', 'Pine Ridge Lodge',
    'Golden Gate Viewpoint', 'Artisan Bakery', 'Waterfall Trail', 'Heritage Museum'
  ];
  
  const descriptions = [
    'A charming local favorite with authentic cuisine and friendly atmosphere',
    'Breathtaking panoramic views and perfect photo opportunities',
    'Rich history and cultural significance in a beautiful setting',
    'Family-friendly destination with activities for all ages',
    'Unique shopping experience with local artisan crafts',
    'Peaceful retreat surrounded by natural beauty'
  ];

  const addresses = [
    '123 Main St, Austin, TX 78701',
    '456 Oak Ave, Dallas, TX 75201',
    '789 Pine Rd, Houston, TX 77001',
    '321 Elm St, San Antonio, TX 78205',
    '654 Maple Dr, Fort Worth, TX 76102'
  ];

  const imageUrls = [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
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
  // Health Check Endpoint
  http.get('/api/health', () => {
    console.log('🔍 MSW: Intercepted /api/health request');
    
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        nominatim: 'available',
        googlePlaces: 'available',
        googleMaps: 'available'
      }
    });
  }),

  // Google Maps API Key Endpoint  
  http.get('/api/maps-key', () => {
    console.log('🔍 MSW: Intercepted /api/maps-key request');
    
    return HttpResponse.json({
      apiKey: 'mock-google-maps-api-key-for-development'
    });
  }),

  // Places Autocomplete (Free Nominatim)
  http.get('/api/places/autocomplete', ({ request }) => {
    const url = new URL(request.url);
    const input = url.searchParams.get('input');
    
    console.log('🔍 MSW: Intercepted /api/places/autocomplete request, input:', input);
    
    if (!input) {
      return HttpResponse.json(
        { message: 'Input parameter is required' },
        { status: 400 }
      );
    }

    // Mock city suggestions based on input
    const mockCities = [
      { place_id: '1', description: 'Austin, TX, USA', main_text: 'Austin', secondary_text: 'TX, USA' },
      { place_id: '2', description: 'Dallas, TX, USA', main_text: 'Dallas', secondary_text: 'TX, USA' },
      { place_id: '3', description: 'Houston, TX, USA', main_text: 'Houston', secondary_text: 'TX, USA' },
      { place_id: '4', description: 'San Antonio, TX, USA', main_text: 'San Antonio', secondary_text: 'TX, USA' },
      { place_id: '5', description: 'Phoenix, AZ, USA', main_text: 'Phoenix', secondary_text: 'AZ, USA' },
      { place_id: '6', description: 'Denver, CO, USA', main_text: 'Denver', secondary_text: 'CO, USA' },
      { place_id: '7', description: 'Las Vegas, NV, USA', main_text: 'Las Vegas', secondary_text: 'NV, USA' },
      { place_id: '8', description: 'Los Angeles, CA, USA', main_text: 'Los Angeles', secondary_text: 'CA, USA' }
    ];

    // Filter cities based on input
    const filteredCities = mockCities.filter(city => 
      city.main_text.toLowerCase().includes(input.toLowerCase()) ||
      city.description.toLowerCase().includes(input.toLowerCase())
    );

    return HttpResponse.json({
      predictions: filteredCities.slice(0, 5)
    });
  }),

  // Premium Google Places Autocomplete
  http.get('/api/places/autocomplete/google', ({ request }) => {
    const url = new URL(request.url);
    const input = url.searchParams.get('input');
    
    console.log('🔍 MSW: Intercepted /api/places/autocomplete/google request, input:', input);
    
    if (!input) {
      return HttpResponse.json(
        { message: 'Input parameter is required' },
        { status: 400 }
      );
    }

    // Mock premium city suggestions with more detailed data
    const mockPremiumCities = [
      { place_id: 'premium_1', description: 'Austin, TX, USA', main_text: 'Austin', secondary_text: 'Texas, USA' },
      { place_id: 'premium_2', description: 'Dallas, TX, USA', main_text: 'Dallas', secondary_text: 'Texas, USA' },
      { place_id: 'premium_3', description: 'Houston, TX, USA', main_text: 'Houston', secondary_text: 'Texas, USA' },
      { place_id: 'premium_4', description: 'San Antonio, TX, USA', main_text: 'San Antonio', secondary_text: 'Texas, USA' },
      { place_id: 'premium_5', description: 'Phoenix, AZ, USA', main_text: 'Phoenix', secondary_text: 'Arizona, USA' },
      { place_id: 'premium_6', description: 'Denver, CO, USA', main_text: 'Denver', secondary_text: 'Colorado, USA' }
    ];

    const filteredCities = mockPremiumCities.filter(city => 
      city.main_text.toLowerCase().includes(input.toLowerCase()) ||
      city.description.toLowerCase().includes(input.toLowerCase())
    );

    return HttpResponse.json({
      predictions: filteredCities.slice(0, 8)
    });
  }),

  // Points of Interest (POIs) Endpoint
  http.get('/api/pois', ({ request }) => {
    const url = new URL(request.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const checkpoint = url.searchParams.get('checkpoint');
    
    console.log('🔍 MSW: Intercepted /api/pois request', { start, end, checkpoint });

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
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(HttpResponse.json(mockPois));
      }, Math.random() * 500 + 200); // 200-700ms delay
    });
  }),

  // Get POI by ID
  http.get('/api/pois/:id', ({ params }) => {
    const { id } = params;
    console.log('🔍 MSW: Intercepted /api/pois/:id request, id:', id);
    
    const poiId = parseInt(id as string);
    if (isNaN(poiId)) {
      return HttpResponse.json(
        { message: 'Invalid POI ID' },
        { status: 400 }
      );
    }

    // Generate a specific POI for the requested ID
    const mockPoi = generateMockPoi({
      placeId: `specific_poi_${id}`,
      name: `POI #${id}`,
    });

    return HttpResponse.json(mockPoi);
  }),
];
