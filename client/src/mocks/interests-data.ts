import { SuggestedTrip, InterestCategory } from "@/types/interests";

// Mock interest categories with high-quality Unsplash images
export const MOCK_INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'restaurants',
    name: 'Restaurants',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop&crop=center',
    description: 'Local cuisine and dining experiences'
  },
  {
    id: 'museums',
    name: 'Museums',
    imageUrl: 'https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=400&h=400&fit=crop&crop=center',
    description: 'Art galleries and cultural exhibitions'
  },
  {
    id: 'parks',
    name: 'Parks & Nature',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop&crop=center',
    description: 'Outdoor spaces and natural attractions'
  },
  {
    id: 'landmarks',
    name: 'Landmarks',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop&crop=center',
    description: 'Historic sites and famous monuments'
  },
  {
    id: 'shopping',
    name: 'Shopping',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center',
    description: 'Local markets and retail experiences'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    imageUrl: 'https://images.unsplash.com/photo-1489599849926-2ee91cede3ba?w=400&h=400&fit=crop&crop=center',
    description: 'Theaters, concerts, and nightlife'
  },
  {
    id: 'outdoor',
    name: 'Outdoor Activities',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop&crop=center',
    description: 'Adventures and outdoor recreation'
  },
  {
    id: 'culture',
    name: 'Culture',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center',
    description: 'Local traditions and cultural experiences'
  },
  {
    id: 'beaches',
    name: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop&crop=center',
    description: 'Coastal destinations and water activities'
  },
  {
    id: 'nightlife',
    name: 'Nightlife',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop&crop=center',
    description: 'Bars, clubs, and evening entertainment'
  },
  {
    id: 'architecture',
    name: 'Architecture',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop&crop=center',
    description: 'Notable buildings and architectural wonders'
  },
  {
    id: 'wellness',
    name: 'Wellness',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop&crop=center',
    description: 'Spas, yoga, and wellness activities'
  }
];

// Mock suggested trips with compelling imagery and descriptions
export const MOCK_SUGGESTED_TRIPS: SuggestedTrip[] = [
  {
    id: "1",
    title: "California Coastal Adventure",
    description: "Experience the stunning Pacific coastline from San Francisco to Los Angeles, with stops at charming coastal towns, scenic viewpoints, and world-class restaurants. Discover hidden gems along Highway 1 and enjoy breathtaking ocean views.",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&crop=center",
    duration: "7 days",
    highlights: ["Golden Gate Bridge", "Monterey Bay", "Big Sur", "Santa Barbara"],
    difficulty: "moderate",
    startLocation: "San Francisco",
    endLocation: "Los Angeles"
  },
  {
    id: "2",
    title: "Historic Northeast Journey",
    description: "Discover America's rich history through iconic landmarks, museums, and cultural sites from Boston to Washington DC. Walk the Freedom Trail, explore world-class museums, and visit the nation's capital.",
    imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop&crop=center",
    duration: "5 days",
    highlights: ["Freedom Trail", "Smithsonian", "Independence Hall", "Capitol Building"],
    difficulty: "easy",
    startLocation: "Boston",
    endLocation: "Washington DC"
  },
  {
    id: "3",
    title: "Rocky Mountain Explorer",
    description: "Breathtaking mountain scenery, outdoor adventures, and charming mountain towns through Colorado's most spectacular landscapes. Perfect for nature lovers and outdoor enthusiasts seeking alpine beauty.",
    imageUrl: "https://images.unsplash.com/photo-1506097425191-7ad538b29e05?w=600&h=400&fit=crop&crop=center",
    duration: "10 days",
    highlights: ["Rocky Mountain NP", "Aspen", "Vail", "Garden of the Gods"],
    difficulty: "challenging",
    startLocation: "Denver",
    endLocation: "Colorado Springs"
  },
  {
    id: "4",
    title: "Texas BBQ & Culture Trail",
    description: "A delicious journey through Texas showcasing the best BBQ joints, live music venues, and cultural attractions across the Lone Star State. Experience authentic Texan hospitality and flavors.",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop&crop=center",
    duration: "6 days",
    highlights: ["Franklin BBQ", "Live Music", "State Capitol", "River Walk"],
    difficulty: "easy",
    startLocation: "Austin",
    endLocation: "San Antonio"
  },
  {
    id: "5",
    title: "Pacific Northwest Adventure",
    description: "Explore the lush forests, dramatic coastlines, and vibrant cities of the Pacific Northwest. From Seattle's urban culture to the natural wonders of the Olympic Peninsula.",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop&crop=center",
    duration: "8 days",
    highlights: ["Pike Place Market", "Olympic National Park", "Mount Rainier", "Columbia River Gorge"],
    difficulty: "moderate",
    startLocation: "Seattle",
    endLocation: "Portland"
  },
  {
    id: "6",
    title: "Florida Keys Island Hopping",
    description: "Tropical paradise awaits as you island-hop through the Florida Keys. Crystal clear waters, fresh seafood, and laid-back island vibes make this the perfect escape.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&crop=center",
    duration: "4 days",
    highlights: ["Key Largo", "Islamorada", "Key West", "John Pennekamp Park"],
    difficulty: "easy",
    startLocation: "Miami",
    endLocation: "Key West"
  },
  {
    id: "7",
    title: "Desert Southwest Discovery",
    description: "Marvel at stunning desert landscapes, ancient Native American ruins, and iconic red rock formations. Experience the magical beauty of the American Southwest.",
    imageUrl: "https://images.unsplash.com/photo-1508183688878-68fae2ae56d0?w=600&h=400&fit=crop&crop=center",
    duration: "9 days",
    highlights: ["Grand Canyon", "Antelope Canyon", "Monument Valley", "Sedona"],
    difficulty: "moderate",
    startLocation: "Phoenix",
    endLocation: "Las Vegas"
  },
  {
    id: "8",
    title: "New England Fall Foliage",
    description: "Experience the spectacular autumn colors of New England while visiting charming small towns, covered bridges, and historic sites. Best enjoyed during peak foliage season.",
    imageUrl: "https://images.unsplash.com/photo-1476209446441-5ad72f223207?w=600&h=400&fit=crop&crop=center",
    duration: "6 days",
    highlights: ["White Mountains", "Stowe", "Mystic Seaport", "Covered Bridges"],
    difficulty: "easy",
    startLocation: "Boston",
    endLocation: "Burlington"
  }
];

// Helper function to get trips based on user interests
export function getPersonalizedTrips(userInterests: string[]): SuggestedTrip[] {
  // Simple logic to filter/sort trips based on interests
  // In a real app, this would be more sophisticated
  
  if (userInterests.length === 0) {
    return MOCK_SUGGESTED_TRIPS.slice(0, 4);
  }
  
  const tripScores = MOCK_SUGGESTED_TRIPS.map(trip => {
    let score = 0;
    
    // Score based on interest matches (simple keyword matching)
    if (userInterests.includes('restaurants') && trip.id === '4') score += 3;
    if (userInterests.includes('museums') && trip.id === '2') score += 3;
    if (userInterests.includes('parks') && ['3', '5', '7'].includes(trip.id)) score += 3;
    if (userInterests.includes('landmarks') && ['2', '7'].includes(trip.id)) score += 3;
    if (userInterests.includes('beaches') && trip.id === '6') score += 3;
    if (userInterests.includes('outdoor') && ['3', '5', '7'].includes(trip.id)) score += 3;
    if (userInterests.includes('culture') && ['2', '4', '8'].includes(trip.id)) score += 3;
    if (userInterests.includes('entertainment') && ['4', '6'].includes(trip.id)) score += 2;
    
    return { trip, score };
  });
  
  // Sort by score and return top results
  return tripScores
    .sort((a, b) => b.score - a.score)
    .map(item => item.trip)
    .slice(0, 6);
}

// Mock user preferences
export const MOCK_USER_INTERESTS = {
  default: ['restaurants', 'museums', 'parks', 'landmarks', 'shopping', 'entertainment', 'outdoor', 'culture'],
  foodie: ['restaurants', 'culture', 'shopping', 'entertainment'],
  outdoorsy: ['parks', 'outdoor', 'landmarks', 'beaches'],
  cultural: ['museums', 'culture', 'landmarks', 'architecture'],
  relaxed: ['beaches', 'wellness', 'parks', 'restaurants']
};