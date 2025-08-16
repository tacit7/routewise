// Mock data generator for development testing

export interface MockPlace {
  id: number;
  placeId: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  rating: number;
  address: string;
  description: string;
  imageUrl: string;
}

export const generateMockPlaces = (): MockPlace[] => {
  return [
    {
      id: 1,
      placeId: "place-1",
      name: "Golden Gate Bridge",
      category: "tourist_attraction",
      latitude: 37.8199,
      longitude: -122.4783,
      rating: 4.7,
      address: "Golden Gate Bridge, San Francisco, CA, USA",
      description: "Iconic suspension bridge and symbol of San Francisco",
      imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop"
    },
    {
      id: 2,
      placeId: "place-2", 
      name: "Fisherman's Wharf",
      category: "tourist_attraction",
      latitude: 37.8080,
      longitude: -122.4177,
      rating: 4.3,
      address: "Fisherman's Wharf, San Francisco, CA, USA",
      description: "Waterfront area with shops, restaurants and sea lions",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
    },
    {
      id: 3,
      placeId: "place-3",
      name: "Lombard Street",
      category: "tourist_attraction", 
      latitude: 37.8021,
      longitude: -122.4187,
      rating: 4.5,
      address: "Lombard Street, San Francisco, CA, USA",
      description: "The most crooked street in the world",
      imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop"
    },
    {
      id: 4,
      placeId: "place-4",
      name: "Union Square",
      category: "tourist_attraction",
      latitude: 37.7879,
      longitude: -122.4075,
      rating: 4.2,
      address: "Union Square, San Francisco, CA, USA", 
      description: "Central square surrounded by shops and hotels",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
    },
    {
      id: 5,
      placeId: "place-5",
      name: "Boudin Bakery",
      category: "restaurant",
      latitude: 37.8085,
      longitude: -122.4100,
      rating: 4.4,
      address: "160 Jefferson St, San Francisco, CA 94133, USA",
      description: "Famous sourdough bread bakery since 1849",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop"
    },
    {
      id: 6,
      placeId: "place-6",
      name: "Swan Oyster Depot",
      category: "restaurant",
      latitude: 37.7938,
      longitude: -122.4194,
      rating: 4.6,
      address: "1517 Polk St, San Francisco, CA 94109, USA",
      description: "Historic seafood counter serving fresh oysters",
      imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop"
    },
    {
      id: 7,
      placeId: "place-7",
      name: "Alcatraz Island",
      category: "tourist_attraction",
      latitude: 37.8267,
      longitude: -122.4230,
      rating: 4.8,
      address: "Alcatraz Island, San Francisco, CA, USA",
      description: "Historic former federal prison on an island",
      imageUrl: "https://images.unsplash.com/photo-1577224084914-b3ecd6b14ad9?w=400&h=300&fit=crop"
    },
    {
      id: 8,
      placeId: "place-8",
      name: "Blue Bottle Coffee",
      category: "cafe",
      latitude: 37.7749,
      longitude: -122.4194,
      rating: 4.3,
      address: "66 Mint St, San Francisco, CA 94103, USA",
      description: "Specialty coffee roaster with modern aesthetic",
      imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop"
    }
  ];
};

export const setupMockData = () => {
  if (import.meta.env.VITE_DISABLE_AUTH === 'true') {
    const mockPlaces = generateMockPlaces();
    localStorage.setItem('tripPlaces', JSON.stringify(mockPlaces));
    console.log('🎭 Mock trip places data loaded for development');
  }
};