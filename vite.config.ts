import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Environment checks are only shown in development
if (process.env.NODE_ENV !== 'production') {
  console.log('\n🔧 ENVIRONMENT VARIABLES CHECK:');
  console.log('VITE_GOOGLE_CLIENT_ID:', process.env.VITE_GOOGLE_CLIENT_ID ? 'Present ✅' : 'Missing ❌');
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present ✅' : 'Missing ❌');
  console.log('VITE_API_URL:', process.env.VITE_API_URL || 'Not set (using default)');
  console.log('MSW_DISABLED:', process.env.MSW_DISABLED);

  if (process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    console.log('Google Client ID Preview:', `${clientId?.substring(0, 12)}...${clientId?.substring(clientId.length - 12)}`);
  } else {
    console.log('❌ Google OAuth will fail - no client ID found');
  }
  console.log('🔧 Environment check complete\n');
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    host: '0.0.0.0', // Allow access from mobile devices on same network
    strictPort: false, // Allow port fallback if 3001 is busy
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        configure: (proxy, _options) => {
          const devLog = (...args: any[]) => process.env.NODE_ENV !== 'production' && console.log(...args);
          
          proxy.on('error', (err, _req, _res) => {
            devLog('🔴 Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            devLog('🔄 Proxying request:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            devLog('✅ Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
          });
        },
      }
    }
  },
  define: {
    // Pass MSW_DISABLED environment variable to client
    "import.meta.env.VITE_MSW_DISABLED": JSON.stringify(
      process.env.MSW_DISABLED || "false"
    ),
    // Pass Google Client ID from parent directory .env file
    "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(
      process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ""
    ),
  },
});
