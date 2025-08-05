import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
    hmr: {
      port: 3001,
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    // Disable MSW for Phoenix backend integration
    "import.meta.env.VITE_MSW_DISABLED": JSON.stringify("true"),
  },
});