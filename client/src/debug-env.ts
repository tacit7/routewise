// Environment variables startup log - shows in terminal when dev server starts
console.log('\n🔧 ENVIRONMENT VARIABLES LOADED:');
console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Present ✅' : 'Missing ❌');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL || 'Not set (using default)');
console.log('VITE_MSW_DISABLED:', import.meta.env.VITE_MSW_DISABLED);

if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  console.log('Google Client ID Preview:', `${clientId.substring(0, 12)}...${clientId.substring(clientId.length - 12)}`);
} else {
  console.log('❌ Google OAuth will not work - missing VITE_GOOGLE_CLIENT_ID');
}
console.log('🔧 Environment check complete\n');