import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

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
        target: process.env.VITE_API_URL || 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: process.env.VITE_API_URL || 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    // Pass MSW_DISABLED environment variable to client
    "import.meta.env.VITE_MSW_DISABLED": JSON.stringify(
      process.env.MSW_DISABLED || "false"
    ),
  },
});
