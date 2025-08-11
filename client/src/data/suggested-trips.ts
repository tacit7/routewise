// Suggested trips data structure
export interface TripPlace {
  id: string;
  name: string;
  description: string;
  image: string;
  coordinates: { lat: number; lng: number };
  activities?: string[];
  bestTimeToVisit?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  location: string;
  activities: string[];
  highlights: string[];
  estimatedTime?: string;
  drivingTime?: string;
}

export interface TripData {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  duration: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  bestTime: string;
  estimatedCost: string;
  heroImage: string;
  places: TripPlace[];
  itinerary: ItineraryDay[];
  tips: string[];
  tags: string[];
}

export const SUGGESTED_TRIPS: Record<string, TripData> = {
  'pacific-coast-highway': {
    id: 'pch-001',
    slug: 'pacific-coast-highway',
    title: 'Pacific Coast Highway Adventure',
    summary: 'Experience the breathtaking beauty of California\'s iconic coastline with stunning ocean views, charming coastal towns, and unforgettable sunsets.',
    description: 'The Pacific Coast Highway is one of America\'s most scenic drives, stretching along California\'s rugged coastline from San Francisco to San Diego. This 7-day journey takes you through some of the most beautiful and iconic locations on the West Coast.',
    duration: '7 Days',
    difficulty: 'Easy',
    bestTime: 'April - October',
    estimatedCost: '$1,500 - $2,500',
    heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
    places: [
      {
        id: 'pch-sf',
        name: 'San Francisco',
        description: 'Start your journey in the iconic City by the Bay with its famous Golden Gate Bridge, steep hills, and vibrant culture.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        activities: ['Golden Gate Bridge', 'Fisherman\'s Wharf', 'Lombard Street', 'Alcatraz Island'],
        bestTimeToVisit: 'Morning departure'
      },
      {
        id: 'pch-monterey',
        name: 'Monterey Bay',
        description: 'World-famous aquarium and scenic 17-Mile Drive through Pebble Beach with stunning coastal views.',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        coordinates: { lat: 36.6002, lng: -121.8947 },
        activities: ['Monterey Bay Aquarium', '17-Mile Drive', 'Carmel-by-the-Sea', 'Cannery Row'],
        bestTimeToVisit: 'Full day'
      },
      {
        id: 'pch-bigsur',
        name: 'Big Sur',
        description: 'Dramatic cliffs meet crashing waves in this pristine wilderness area with towering redwoods and scenic hiking trails.',
        image: 'https://images.unsplash.com/photo-1539635278303-dd5c92632f4d?w=400&h=300&fit=crop',
        coordinates: { lat: 36.2704, lng: -121.8081 },
        activities: ['McWay Falls', 'Bixby Creek Bridge', 'Julia Pfeiffer Burns State Park', 'Nepenthe Restaurant'],
        bestTimeToVisit: 'Sunrise to sunset'
      },
      {
        id: 'pch-hearst',
        name: 'Hearst Castle',
        description: 'Opulent mansion built by newspaper magnate William Randolph Hearst, featuring stunning architecture and art collections.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        coordinates: { lat: 35.6850, lng: -121.1681 },
        activities: ['Castle tours', 'Gardens exploration', 'Zebra viewing', 'Historic exhibits'],
        bestTimeToVisit: 'Half day'
      },
      {
        id: 'pch-morrow',
        name: 'Morro Bay',
        description: 'Charming harbor town dominated by the iconic 576-foot tall Morro Rock, perfect for kayaking and seafood.',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        coordinates: { lat: 35.3659, lng: -120.8507 },
        activities: ['Morro Rock', 'Kayaking', 'Harbor walks', 'Fresh seafood dining'],
        bestTimeToVisit: 'Afternoon and sunset'
      }
    ],
    itinerary: [
      {
        day: 1,
        title: 'San Francisco Departure',
        location: 'San Francisco to Santa Cruz, CA',
        activities: ['Golden Gate Bridge photo stop', 'Sausalito visit', 'Drive scenic Highway 1', 'Santa Cruz arrival'],
        highlights: ['Golden Gate Bridge', 'Marin Headlands views', 'Highway 1 coastal drive'],
        estimatedTime: '6-8 hours',
        drivingTime: '3 hours'
      },
      {
        day: 2,
        title: 'Monterey Peninsula',
        location: 'Monterey, CA',
        activities: ['Monterey Bay Aquarium', '17-Mile Drive', 'Carmel-by-the-Sea exploration', 'Clint Eastwood\'s mission ranch'],
        highlights: ['Sea otters and marine life', 'Pebble Beach golf course', 'Carmel\'s fairy-tale cottages'],
        estimatedTime: 'Full day',
        drivingTime: '1 hour from Santa Cruz'
      },
      {
        day: 3,
        title: 'Big Sur Wilderness',
        location: 'Big Sur, CA',
        activities: ['McWay Falls hike', 'Bixby Creek Bridge photos', 'Nepenthe lunch with views', 'Julia Pfeiffer Burns State Park'],
        highlights: ['80-foot waterfall', 'Iconic bridge photography', 'Coastal redwood forests'],
        estimatedTime: 'Full day',
        drivingTime: '2.5 hours scenic driving'
      },
      {
        day: 4,
        title: 'Hearst Castle & San Simeon',
        location: 'San Simeon, CA',
        activities: ['Hearst Castle guided tour', 'Elephant seal colony viewing', 'Moonstone Beach walk'],
        highlights: ['Opulent mansion rooms', 'Wildlife viewing', 'Beach combing'],
        estimatedTime: 'Half day',
        drivingTime: '2 hours from Big Sur'
      },
      {
        day: 5,
        title: 'Morro Bay Adventure',
        location: 'Morro Bay, CA',
        activities: ['Kayaking around Morro Rock', 'Harbor walk and sea lions', 'Fresh seafood dinner', 'Sunset photography'],
        highlights: ['Morro Rock up close', 'Harbor seals and sea otters', 'Spectacular sunsets'],
        estimatedTime: 'Full day',
        drivingTime: '30 minutes from San Simeon'
      },
      {
        day: 6,
        title: 'Pismo Beach & Dunes',
        location: 'Pismo Beach, CA',
        activities: ['ATV riding in sand dunes', 'Pismo Pier walk', 'Clam chowder lunch', 'Beach activities'],
        highlights: ['Oceano Dunes adventure', 'Classic beach pier', 'Famous clam chowder'],
        estimatedTime: 'Full day',
        drivingTime: '45 minutes from Morro Bay'
      },
      {
        day: 7,
        title: 'Santa Barbara Wine Country',
        location: 'Santa Barbara, CA',
        activities: ['Mission Santa Barbara visit', 'State Street shopping', 'Wine tasting tour', 'Departure preparation'],
        highlights: ['Historic Spanish mission', 'Mediterranean architecture', 'World-class wineries'],
        estimatedTime: 'Full day',
        drivingTime: '2 hours from Pismo Beach'
      }
    ],
    tips: [
      'Book Hearst Castle tours in advance',
      'Check road conditions for Big Sur (sometimes closed)',
      'Pack layers - coastal weather can be unpredictable',
      'Make dinner reservations at popular restaurants',
      'Fill up gas tank regularly - limited stations in Big Sur'
    ],
    tags: ['Coastal Drive', 'Scenic', 'Photography', 'Nature', 'Easy Driving']
  },
  
  'great-lakes': {
    id: 'gl-001',
    slug: 'great-lakes',
    title: 'Great Lakes Circle Tour',
    summary: 'Discover the majesty of America\'s inland seas with stunning lakeshores, charming coastal towns, and diverse ecosystems across multiple states.',
    description: 'The Great Lakes Circle Tour takes you around the world\'s largest group of freshwater lakes, offering spectacular scenery, rich maritime history, and diverse cultural experiences across the northern United States.',
    duration: '10 Days',
    difficulty: 'Moderate',
    bestTime: 'May - September',
    estimatedCost: '$2,000 - $3,500',
    heroImage: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=1200&h=600&fit=crop',
    places: [
      {
        id: 'gl-mackinac',
        name: 'Mackinac Island',
        description: 'Historic island where cars are banned and horse-drawn carriages transport visitors through time.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        coordinates: { lat: 45.8492, lng: -84.6189 },
        activities: ['Grand Hotel visit', 'Horse-drawn carriage tours', 'Fort Mackinac', 'Fudge shopping'],
        bestTimeToVisit: 'Full day'
      },
      {
        id: 'gl-pictured',
        name: 'Pictured Rocks',
        description: 'Stunning multicolored cliffs rising from Lake Superior with waterfalls and pristine beaches.',
        image: 'https://images.unsplash.com/photo-1539635278303-dd5c92632f4d?w=400&h=300&fit=crop',
        coordinates: { lat: 46.4619, lng: -86.4614 },
        activities: ['Boat tours', 'Hiking trails', 'Munising Falls', 'Kayaking'],
        bestTimeToVisit: 'Full day'
      },
      {
        id: 'gl-apostle',
        name: 'Apostle Islands',
        description: '22 pristine islands in Lake Superior featuring sea caves, lighthouses, and incredible wilderness.',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        coordinates: { lat: 46.7719, lng: -90.7865 },
        activities: ['Sea cave kayaking', 'Lighthouse tours', 'Island camping', 'Ferry rides'],
        bestTimeToVisit: '2 days'
      },
      {
        id: 'gl-duluth',
        name: 'Duluth',
        description: 'Historic port city with aerial lift bridge, Great Lakes maritime museum, and scenic lakefront.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        coordinates: { lat: 46.7867, lng: -92.1005 },
        activities: ['Aerial Lift Bridge', 'Great Lakes Aquarium', 'Maritime museum', 'Canal Park'],
        bestTimeToVisit: '1-2 days'
      },
      {
        id: 'gl-sleeping',
        name: 'Sleeping Bear Dunes',
        description: 'Massive sand dunes overlooking Lake Michigan with scenic drives and challenging climbs.',
        image: 'https://images.unsplash.com/photo-1539635278303-dd5c92632f4d?w=400&h=300&fit=crop',
        coordinates: { lat: 44.8619, lng: -86.0581 },
        activities: ['Dune climbing', 'Scenic drives', 'Lake Michigan beaches', 'Historic villages'],
        bestTimeToVisit: 'Full day'
      }
    ],
    itinerary: [
      {
        day: 1,
        title: 'Chicago Departure',
        location: 'Chicago to Milwaukee, WI',
        activities: ['Lake Michigan shoreline drive', 'Milwaukee brewery tours', 'Historic Third Ward'],
        highlights: ['Lakefront views', 'Craft beer culture', 'Historic architecture'],
        drivingTime: '2 hours'
      },
      {
        day: 2,
        title: 'Wisconsin Dells',
        location: 'Wisconsin Dells, WI',
        activities: ['Scenic boat tours', 'State parks exploration', 'Local attractions'],
        highlights: ['Sandstone formations', 'Wisconsin River', 'Natural beauty'],
        drivingTime: '2 hours from Milwaukee'
      },
      {
        day: 3,
        title: 'Mackinac Island',
        location: 'Mackinac Island, MI',
        activities: ['Ferry to island', 'Grand Hotel afternoon tea', 'Horse-drawn carriage tour', 'Fort Mackinac'],
        highlights: ['No cars policy', 'Victorian charm', 'Famous fudge shops'],
        drivingTime: '5 hours to Mackinaw City + ferry'
      },
      {
        day: 4,
        title: 'Upper Peninsula',
        location: 'Marquette, MI',
        activities: ['Pictured Rocks boat tour', 'Munising Falls hike', 'Lake Superior shoreline'],
        highlights: ['Multicolored cliffs', 'Pristine waterfalls', 'Largest Great Lake'],
        drivingTime: '4 hours'
      },
      {
        day: 5,
        title: 'Apostle Islands',
        location: 'Bayfield, WI',
        activities: ['Ferry to islands', 'Sea cave kayaking', 'Lighthouse visits'],
        highlights: ['22 pristine islands', 'Ice caves (winter)', 'Maritime history'],
        drivingTime: '3 hours'
      },
      {
        day: 6,
        title: 'Duluth Harbor',
        location: 'Duluth, MN',
        activities: ['Aerial Lift Bridge', 'Great Lakes Aquarium', 'Canal Park shopping'],
        highlights: ['Iconic lift bridge', 'Maritime heritage', 'Lake Superior views'],
        drivingTime: '2 hours'
      },
      {
        day: 7,
        title: 'Minnesota North Shore',
        location: 'Grand Portage, MN',
        activities: ['Scenic Highway 61', 'State parks', 'Waterfalls exploration'],
        highlights: ['Dramatic coastline', 'Historic trading post', 'Superior Hiking Trail'],
        drivingTime: '2.5 hours'
      },
      {
        day: 8,
        title: 'Michigan Upper Peninsula',
        location: 'Grand Marais, MI',
        activities: ['Grand Sable Dunes', 'Log Slide', 'Au Sable Light Station'],
        highlights: ['Massive sand dunes', 'Historic lighthouse', 'Pristine wilderness'],
        drivingTime: '4 hours'
      },
      {
        day: 9,
        title: 'Sleeping Bear Dunes',
        location: 'Traverse City, MI',
        activities: ['Dune climbing', 'Pierce Stocking Scenic Drive', 'Cherry orchards'],
        highlights: ['Epic dune views', 'Lake Michigan overlooks', 'Local cherries'],
        drivingTime: '5 hours'
      },
      {
        day: 10,
        title: 'Return Journey',
        location: 'Chicago, IL',
        activities: ['Michigan lakefront drive', 'Final Great Lakes views', 'Chicago arrival'],
        highlights: ['Completion of circle tour', 'Reflection on journey', 'Urban contrast'],
        drivingTime: '4 hours'
      }
    ],
    tips: [
      'Pack warm clothes even in summer',
      'Book island ferries in advance',
      'Check lighthouse tour schedules',
      'Prepare for variable lake weather',
      'Consider camping reservations early'
    ],
    tags: ['Lakes', 'Islands', 'Lighthouses', 'Nature', 'History']
  },

  'san-francisco': {
    id: 'sf-001',
    slug: 'san-francisco',
    title: 'San Francisco City Explorer',
    summary: 'Immerse yourself in the vibrant culture, iconic landmarks, and diverse neighborhoods of the City by the Bay.',
    description: 'San Francisco offers an incredible urban adventure with its famous hills, historic cable cars, world-class dining, and eclectic neighborhoods each with their own unique character.',
    duration: '5 Days',
    difficulty: 'Easy',
    bestTime: 'September - November',
    estimatedCost: '$1,200 - $2,000',
    heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
    places: [
      {
        id: 'sf-golden-gate',
        name: 'Golden Gate Bridge',
        description: 'World-famous suspension bridge offering spectacular views and photo opportunities.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        coordinates: { lat: 37.8199, lng: -122.4783 },
        activities: ['Bridge walk', 'Crissy Field', 'Battery Spencer viewpoint', 'Visitor center'],
        bestTimeToVisit: 'Early morning or sunset'
      },
      {
        id: 'sf-alcatraz',
        name: 'Alcatraz Island',
        description: 'Former federal prison on an island with fascinating history and stunning city views.',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        coordinates: { lat: 37.8267, lng: -122.4233 },
        activities: ['Prison tour', 'Audio guide', 'Island exploration', 'Historical exhibits'],
        bestTimeToVisit: 'Half day'
      },
      {
        id: 'sf-fishermans',
        name: 'Fisherman\'s Wharf',
        description: 'Bustling waterfront district with sea lions, street performers, and fresh seafood.',
        image: 'https://images.unsplash.com/photo-1539635278303-dd5c92632f4d?w=400&h=300&fit=crop',
        coordinates: { lat: 37.8080, lng: -122.4177 },
        activities: ['Pier 39', 'Sea lions viewing', 'Street performers', 'Sourdough bread'],
        bestTimeToVisit: 'Morning to afternoon'
      },
      {
        id: 'sf-chinatown',
        name: 'Chinatown',
        description: 'Largest Chinatown outside of Asia with authentic cuisine, shops, and cultural experiences.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        coordinates: { lat: 37.7941, lng: -122.4078 },
        activities: ['Dragon Gate', 'Dim sum dining', 'Herb shops', 'Temple visits'],
        bestTimeToVisit: 'Lunch and shopping'
      },
      {
        id: 'sf-lombard',
        name: 'Lombard Street',
        description: 'The world\'s most crooked street with eight hairpin turns and beautiful gardens.',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        coordinates: { lat: 37.8021, lng: -122.4187 },
        activities: ['Driving the curves', 'Walking down', 'Photography', 'Russian Hill exploration'],
        bestTimeToVisit: 'Any time'
      }
    ],
    itinerary: [
      {
        day: 1,
        title: 'Iconic Landmarks',
        location: 'Golden Gate & Fisherman\'s Wharf',
        activities: ['Golden Gate Bridge walk', 'Crissy Field picnic', 'Fisherman\'s Wharf lunch', 'Pier 39 sea lions'],
        highlights: ['Bridge photography', 'Waterfront dining', 'Sea lion entertainment'],
        estimatedTime: 'Full day'
      },
      {
        day: 2,
        title: 'Alcatraz & North Beach',
        location: 'Alcatraz Island & Italian District',
        activities: ['Alcatraz prison tour', 'North Beach Italian lunch', 'Coit Tower visit', 'Washington Square'],
        highlights: ['Prison history', 'Italian culture', 'City views from tower'],
        estimatedTime: 'Full day'
      },
      {
        day: 3,
        title: 'Chinatown & Union Square',
        location: 'Cultural Districts',
        activities: ['Chinatown walking tour', 'Dim sum lunch', 'Union Square shopping', 'Cable car rides'],
        highlights: ['Authentic Chinese culture', 'Shopping district', 'Historic transportation'],
        estimatedTime: 'Full day'
      },
      {
        day: 4,
        title: 'Neighborhoods Explorer',
        location: 'Castro, Haight & Mission',
        activities: ['Castro District history', 'Haight-Ashbury hippie culture', 'Mission District murals', 'Local dining'],
        highlights: ['LGBTQ history', '1960s culture', 'Street art', 'Diverse cuisine'],
        estimatedTime: 'Full day'
      },
      {
        day: 5,
        title: 'Golden Gate Park & Sunset',
        location: 'Park & Ocean',
        activities: ['Japanese Tea Garden', 'de Young Museum', 'Ocean Beach walk', 'Sunset at Lands End'],
        highlights: ['Peaceful gardens', 'World-class art', 'Pacific Ocean', 'Dramatic coastline'],
        estimatedTime: 'Full day'
      }
    ],
    tips: [
      'Layer clothing - weather changes quickly',
      'Book Alcatraz tickets well in advance',
      'Use public transportation - parking is difficult',
      'Try local sourdough bread and Dungeness crab',
      'Walk carefully on steep hills'
    ],
    tags: ['Urban', 'Culture', 'Food', 'History', 'Architecture']
  },

  'yellowstone': {
    id: 'ys-001',
    slug: 'yellowstone',
    title: 'Yellowstone National Park',
    summary: 'Explore America\'s first national park with geysers, hot springs, wildlife, and pristine wilderness across Wyoming, Montana, and Idaho.',
    description: 'Yellowstone National Park is a wonderland of geothermal features, diverse wildlife, and stunning landscapes. Home to Old Faithful and thousands of other geothermal features, it\'s a true natural treasure.',
    duration: '6 Days',
    difficulty: 'Moderate',
    bestTime: 'May - September',
    estimatedCost: '$1,000 - $1,800',
    heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
    places: [
      {
        id: 'ys-old-faithful',
        name: 'Old Faithful',
        description: 'World\'s most famous geyser that erupts approximately every 90 minutes.',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        coordinates: { lat: 44.4605, lng: -110.8281 },
        activities: ['Geyser viewing', 'Visitor center', 'Upper Geyser Basin walk', 'Old Faithful Inn'],
        bestTimeToVisit: 'Multiple visits recommended'
      },
      {
        id: 'ys-grand-canyon',
        name: 'Grand Canyon of Yellowstone',
        description: 'Spectacular canyon with 308-foot Lower Falls and colorful rock formations.',
        image: 'https://images.unsplash.com/photo-1539635278303-dd5c92632f4d?w=400&h=300&fit=crop',
        coordinates: { lat: 44.7197, lng: -110.4983 },
        activities: ['Artist Point viewing', 'Canyon rim walks', 'Lower Falls hike', 'Photography'],
        bestTimeToVisit: 'Morning light'
      },
      {
        id: 'ys-mammoth',
        name: 'Mammoth Hot Springs',
        description: 'Terraced limestone formations created by hot springs over thousands of years.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        coordinates: { lat: 44.9778, lng: -110.7031 },
        activities: ['Terraces boardwalk', 'Fort Yellowstone', 'Elk viewing', 'Hot springs exploration'],
        bestTimeToVisit: 'Any time'
      },
      {
        id: 'ys-lamar',
        name: 'Lamar Valley',
        description: 'America\'s Serengeti - prime wildlife viewing area for bison, wolves, and bears.',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        coordinates: { lat: 44.9167, lng: -110.2833 },
        activities: ['Wildlife spotting', 'Photography', 'Early morning drives', 'Wolf watching'],
        bestTimeToVisit: 'Dawn and dusk'
      },
      {
        id: 'ys-yellowstone-lake',
        name: 'Yellowstone Lake',
        description: 'Largest high-elevation lake in North America with pristine waters and mountain views.',
        image: 'https://images.unsplash.com/photo-1539635278303-dd5c92632f4d?w=400&h=300&fit=crop',
        coordinates: { lat: 44.4167, lng: -110.3833 },
        activities: ['Lake activities', 'Fishing', 'Boat tours', 'Scenic drives'],
        bestTimeToVisit: 'Summer months'
      }
    ],
    itinerary: [
      {
        day: 1,
        title: 'South Entrance & Old Faithful',
        location: 'Old Faithful Area',
        activities: ['Park entry via South Gate', 'Old Faithful geyser viewing', 'Upper Geyser Basin walk', 'Old Faithful Inn tour'],
        highlights: ['First geyser eruption', 'Geyser basin exploration', 'Historic lodge'],
        drivingTime: 'Varies by origin'
      },
      {
        day: 2,
        title: 'Grand Loop Lower',
        location: 'Grand Canyon of Yellowstone',
        activities: ['Artist Point sunrise', 'Lower Falls viewing', 'Canyon rim trail', 'Hayden Valley wildlife'],
        highlights: ['Iconic waterfall views', 'Colorful canyon walls', 'Bison herds'],
        drivingTime: '2 hours from Old Faithful'
      },
      {
        day: 3,
        title: 'Wildlife & Geothermal',
        location: 'Lamar Valley & Mammoth',
        activities: ['Dawn wildlife safari in Lamar', 'Mammoth Hot Springs terraces', 'Fort Yellowstone', 'Elk viewing'],
        highlights: ['Wolf and bear spotting', 'Unique limestone terraces', 'Historic fort'],
        drivingTime: '1.5 hours between areas'
      },
      {
        day: 4,
        title: 'Yellowstone Lake',
        location: 'Lake Area',
        activities: ['West Thumb Geyser Basin', 'Lake Hotel visit', 'Fishing opportunities', 'Scenic lake drives'],
        highlights: ['Lakeside geysers', 'Historic hotel', 'Mountain reflections'],
        drivingTime: '1 hour from Canyon'
      },
      {
        day: 5,
        title: 'Backcountry Adventure',
        location: 'Various Trails',
        activities: ['Choose hiking trail', 'Backcountry exploration', 'Photography opportunities', 'Ranger programs'],
        highlights: ['Wilderness experience', 'Less crowded areas', 'Advanced photography'],
        estimatedTime: 'Full day hiking'
      },
      {
        day: 6,
        title: 'Final Exploration',
        location: 'Revisit Favorites',
        activities: ['Return to favorite spots', 'Last-minute wildlife viewing', 'Souvenir shopping', 'Park departure'],
        highlights: ['Favorite locations', 'Final photos', 'Memories'],
        estimatedTime: 'Departure day'
      }
    ],
    tips: [
      'Book accommodations a year in advance',
      'Bring bear spray for hiking',
      'Check road closures before visiting',
      'Pack layers for temperature changes',
      'Maintain safe distance from wildlife'
    ],
    tags: ['National Park', 'Geysers', 'Wildlife', 'Hiking', 'Photography']
  },

  'grand-canyon': {
    id: 'gc-001',
    slug: 'grand-canyon',
    title: 'Grand Canyon National Park',
    summary: 'Marvel at one of the world\'s most spectacular natural wonders with breathtaking views, hiking trails, and geological history.',
    description: 'The Grand Canyon is a UNESCO World Heritage Site and one of the most visited national parks in America. Its immense size and colorful landscape offers visitors multiple ways to experience this natural wonder.',
    duration: '4 Days',
    difficulty: 'Moderate',
    bestTime: 'April - May, September - November',
    estimatedCost: '$800 - $1,400',
    heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
    places: [
      {
        id: 'gc-south-rim',
        name: 'South Rim',
        description: 'Most popular viewpoint with year-round access and stunning panoramic views of the canyon.',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        coordinates: { lat: 36.0544, lng: -112.1401 },
        activities: ['Rim Trail walk', 'Visitor center', 'IMAX theater', 'Multiple viewpoints'],
        bestTimeToVisit: 'Sunrise and sunset'
      },
      {
        id: 'gc-north-rim',
        name: 'North Rim',
        description: 'Less crowded rim with different perspectives and cooler temperatures (seasonal access).',
        image: 'https://images.unsplash.com/photo-1539635278303-dd5c92632f4d?w=400&h=300&fit=crop',
        coordinates: { lat: 36.2078, lng: -112.0576 },
        activities: ['Bright Angel Point', 'Lodge activities', 'Hiking trails', 'Photography'],
        bestTimeToVisit: 'May - October only'
      },
      {
        id: 'gc-bright-angel',
        name: 'Bright Angel Trail',
        description: 'Well-maintained trail descending into the canyon with rest houses and water stations.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        coordinates: { lat: 36.0544, lng: -112.1401 },
        activities: ['Day hiking', 'Rest house stops', 'Mule rides', 'Photography'],
        bestTimeToVisit: 'Early morning start'
      },
      {
        id: 'gc-desert-view',
        name: 'Desert View',
        description: 'Eastern viewpoint featuring the historic Desert View Watchtower and Colorado River views.',
        image: 'https://images.unsplash.com/photo-1469474968133-88c9c0ceadeb?w=400&h=300&fit=crop',
        coordinates: { lat: 36.0419, lng: -111.8261 },
        activities: ['Watchtower climb', 'River views', 'Native American exhibits', 'Sunset viewing'],
        bestTimeToVisit: 'Late afternoon'
      },
      {
        id: 'gc-hermits-rest',
        name: 'Hermit\'s Rest',
        description: 'Western end of Hermit Road with unique stone architecture and canyon views.',
        image: 'https://images.unsplash.com/photo-1539635278303-dd5c92632f4d?w=400&h=300&fit=crop',
        coordinates: { lat: 36.0644, lng: -112.2114 },
        activities: ['Historic building tour', 'Gift shop', 'Trail access', 'Bus tours'],
        bestTimeToVisit: 'Afternoon'
      }
    ],
    itinerary: [
      {
        day: 1,
        title: 'South Rim Arrival',
        location: 'Grand Canyon Village',
        activities: ['Park entry and orientation', 'Visitor center exploration', 'Rim Trail walk', 'Sunset at Hopi Point'],
        highlights: ['First canyon views', 'Park orientation', 'Spectacular sunset'],
        drivingTime: 'Varies by origin'
      },
      {
        day: 2,
        title: 'Canyon Exploration',
        location: 'South Rim Viewpoints',
        activities: ['Sunrise at Mather Point', 'Desert View Drive', 'Watchtower climb', 'Bright Angel Trail hike'],
        highlights: ['Golden hour photography', 'Historical watchtower', 'Canyon descent'],
        drivingTime: '1 hour scenic drive'
      },
      {
        day: 3,
        title: 'Western Views',
        location: 'Hermit Road',
        activities: ['Hermit Road shuttle tour', 'Multiple viewpoint stops', 'Hermit\'s Rest visit', 'Photography workshop'],
        highlights: ['Varied canyon perspectives', 'Historic architecture', 'Photography skills'],
        estimatedTime: 'Full day shuttle tour'
      },
      {
        day: 4,
        title: 'Adventure Day',
        location: 'Choose Your Adventure',
        activities: ['Options: helicopter tour, river rafting, extended hiking, or mule ride', 'Final viewpoint visits'],
        highlights: ['Unique canyon experience', 'Personal adventure choice', 'Final memories'],
        estimatedTime: 'Full or half day'
      }
    ],
    tips: [
      'Start hiking early to avoid heat',
      'Bring plenty of water and snacks',
      'Wear layers - temperature varies by elevation',
      'Book helicopter tours in advance',
      'Respect wildlife and stay on trails'
    ],
    tags: ['National Park', 'Hiking', 'Photography', 'Geology', 'Adventure']
  }
};

// Helper function to get trip by slug
export const getTripBySlug = (slug: string): TripData | null => {
  return SUGGESTED_TRIPS[slug] || null;
};

// Helper function to get all trips
export const getAllTrips = (): TripData[] => {
  return Object.values(SUGGESTED_TRIPS);
};

// Helper function to get trip by ID  
export const getTripById = (id: string): TripData | null => {
  return Object.values(SUGGESTED_TRIPS).find(trip => trip.id === id) || null;
};