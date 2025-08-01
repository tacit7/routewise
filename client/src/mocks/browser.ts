import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers);

// Check if MSW should be disabled via environment variable
const isMswDisabled = import.meta.env.VITE_MSW_DISABLED === 'true' || 
                      globalThis.MSW_DISABLED === 'true';

// Start the worker in development mode (unless explicitly disabled)
if (import.meta.env.DEV && !isMswDisabled) {
  worker.start({
    onUnhandledRequest: 'warn',
    serviceWorker: {
      url: '/mockServiceWorker.js'
    },
    // Quiet mode - only log intercepted requests, not setup messages
    quiet: false,
  }).then(() => {
    console.log('🚀 MSW: Mock Service Worker started successfully');
    console.log('🎭 MSW: Now intercepting and mocking these API endpoints:');
    console.log('   • /api/health - Server health status');
    console.log('   • /api/maps-key - Google Maps API key');
    console.log('   • /api/places/autocomplete - City search (free)');
    console.log('   • /api/places/autocomplete/google - City search (premium)');
    console.log('   • /api/pois - Points of interest (all variants)');
    console.log('   • /api/pois/:id - Individual POI details');
    console.log('   • https://maps.googleapis.com/.../GeocodeService.Search - Google Maps geocoding');
    console.log('   • https://maps.googleapis.com/maps/vt - Google Maps tiles (images)');
    console.log('💡 MSW: Use "npm run dev:no-msw" to disable mocking and use real APIs');
  }).catch((error) => {
    console.error('❌ MSW: Failed to start Mock Service Worker:', error);
  });
} else if (import.meta.env.DEV && isMswDisabled) {
  console.log('🚫 MSW: Mock Service Worker disabled via MSW_DISABLED flag');
  console.log('🌐 MSW: Using real backend APIs with caching enabled');
  console.log('💡 MSW: Use "npm run dev" to enable mocking');
}
