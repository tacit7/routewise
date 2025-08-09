// Custom map icons matching the provided design language
// Clean pin/teardrop shapes with category-specific symbols

export interface MapIconConfig {
  category: string;
  color: string;
  symbol: string;
}

// Brand colors for different categories
export const ICON_COLORS = {
  // Primary brand teal (from your design)
  primary: '#20B2AA',
  // Category-specific colors while maintaining brand consistency
  restaurant: '#E74C3C',     // Warm red for dining
  attraction: '#20B2AA',     // Brand teal for main attractions
  park: '#27AE60',          // Fresh green for nature
  scenic: '#3498DB',        // Sky blue for scenic views
  market: '#F39C12',        // Warm orange for markets
  historic: '#8E44AD',      // Royal purple for history
  accommodation: '#2C3E50', // Deep blue-gray for hotels
  default: '#20B2AA',       // Brand teal as fallback
};

// Create custom map pin SVG with category symbol
export const createCustomMapPin = (
  category: string,
  isSelected = false,
  isHovered = false,
  size = 32
): string => {
  const baseColor = ICON_COLORS[category as keyof typeof ICON_COLORS] || ICON_COLORS.default;
  const pinColor = isSelected ? '#20B2AA' : baseColor; // Use brand color when selected
  const scale = isSelected || isHovered ? 1.1 : 1.0;
  const shadow = isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
  
  // Get category-specific symbol
  const symbol = getCategorySymbol(category);
  
  return `
    <svg width="${size * scale}" height="${size * scale * 1.2}" viewBox="0 0 100 120" 
         xmlns="http://www.w3.org/2000/svg" 
         style="filter: ${shadow}">
      
      <!-- Pin shadow -->
      <ellipse cx="50" cy="115" rx="12" ry="3" fill="rgba(0,0,0,0.15)" />
      
      <!-- Main pin body (teardrop shape) -->
      <path d="M50 10 
               C30 10, 15 25, 15 45 
               C15 65, 50 100, 50 100 
               C50 100, 85 65, 85 45 
               C85 25, 70 10, 50 10 Z"
            fill="${pinColor}" 
            stroke="white" 
            stroke-width="2"/>
      
      <!-- White circle background for symbol -->
      <circle cx="50" cy="42" r="18" fill="white" />
      
      <!-- Category symbol -->
      ${symbol}
      
    </svg>
  `;
};

// Category-specific symbols (matching your design aesthetic)
const getCategorySymbol = (category: string): string => {
  const symbolColor = '#20B2AA'; // Brand color for symbols
  
  switch (category) {
    case 'restaurant':
      return `
        <!-- Fork and knife -->
        <g fill="${symbolColor}">
          <rect x="42" y="32" width="2" height="20" />
          <path d="M41 30 L41 35 L43 35 L43 30 Z" />
          <rect x="56" y="32" width="2" height="20" />
          <path d="M55 30 C55 30, 59 30, 59 34 L59 36 L55 36 Z" />
        </g>
      `;
      
    case 'attraction':
    case 'scenic':
      return `
        <!-- Camera/viewfinder -->
        <g fill="${symbolColor}">
          <rect x="36" y="36" width="28" height="20" rx="3" stroke="${symbolColor}" stroke-width="2" fill="none" />
          <circle cx="50" cy="46" r="6" stroke="${symbolColor}" stroke-width="2" fill="none" />
          <rect x="58" y="32" width="4" height="4" rx="1" />
        </g>
      `;
      
    case 'park':
      return `
        <!-- Tree -->
        <g fill="${symbolColor}">
          <circle cx="50" cy="38" r="8" />
          <circle cx="46" cy="40" r="6" />
          <circle cx="54" cy="40" r="6" />
          <rect x="48" y="48" width="4" height="8" />
        </g>
      `;
      
    case 'market':
      return `
        <!-- Shopping bag -->
        <g fill="${symbolColor}">
          <rect x="40" y="38" width="20" height="16" rx="2" stroke="${symbolColor}" stroke-width="2" fill="none" />
          <path d="M44 38 C44 34, 48 32, 50 32 C52 32, 56 34, 56 38" 
                stroke="${symbolColor}" stroke-width="2" fill="none" />
        </g>
      `;
      
    case 'historic':
      return `
        <!-- Monument/column -->
        <g fill="${symbolColor}">
          <rect x="47" y="35" width="6" height="18" />
          <rect x="44" y="33" width="12" height="3" />
          <rect x="44" y="52" width="12" height="3" />
          <circle cx="50" cy="38" r="2" />
        </g>
      `;
      
    case 'accommodation':
      return `
        <!-- Bed -->
        <g fill="${symbolColor}">
          <rect x="38" y="42" width="24" height="10" rx="2" />
          <rect x="36" y="48" width="28" height="3" />
          <circle cx="44" cy="36" r="3" />
          <rect x="34" y="48" width="2" height="6" />
          <rect x="64" y="48" width="2" height="6" />
        </g>
      `;
      
    default:
      // Default compass/star symbol (like your brand)
      return `
        <!-- Four-pointed star/compass -->
        <g fill="${symbolColor}">
          <path d="M50 32 L52 40 L60 42 L52 44 L50 52 L48 44 L40 42 L48 40 Z" />
          <circle cx="50" cy="42" r="3" fill="white" />
        </g>
      `;
  }
};

// Create cluster marker (for multiple POIs)
export const createClusterMarker = (
  count: number,
  primaryCategory: string,
  size = 40
): string => {
  const baseColor = ICON_COLORS[primaryCategory as keyof typeof ICON_COLORS] || ICON_COLORS.primary;
  const displayCount = count > 99 ? '99+' : count.toString();
  const fontSize = count > 99 ? '12' : count > 9 ? '14' : '16';
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" 
         xmlns="http://www.w3.org/2000/svg"
         style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3))">
      
      <!-- Cluster circle -->
      <circle cx="50" cy="50" r="42" 
              fill="${baseColor}" 
              stroke="white" 
              stroke-width="4"/>
      
      <!-- Count text -->
      <text x="50" y="58" 
            text-anchor="middle" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${fontSize}" 
            font-weight="bold" 
            fill="white">
        ${displayCount}
      </text>
      
    </svg>
  `;
};

// Helper function to create marker element for Google Maps
export const createMarkerElement = (
  category: string,
  isSelected = false,
  isHovered = false,
  size = 32
): HTMLDivElement => {
  const div = document.createElement('div');
  div.style.cssText = `
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: ${isSelected ? 1000 : isHovered ? 999 : 1};
  `;
  div.innerHTML = createCustomMapPin(category, isSelected, isHovered, size);
  return div;
};

// Helper function to create cluster marker element
export const createClusterElement = (
  count: number,
  primaryCategory: string,
  size = 40
): HTMLDivElement => {
  const div = document.createElement('div');
  div.style.cssText = `
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 100;
  `;
  div.innerHTML = createClusterMarker(count, primaryCategory, size);
  return div;
};