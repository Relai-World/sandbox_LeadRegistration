import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  preview: {
    host: "::",
    port: 8080,
    // Add your custom domain to this list
    allowedHosts: [
      "relai-app-connect153.replit.app",
      "builder-onboarding.relai.world",
      "e18143b9-0036-43ea-8e6e-6fbd5c3fc96a-00-1w1nwc6wia34x.sisko.replit.dev"
    ],
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));