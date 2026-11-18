import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const backendTarget = process.env.VITE_BACKEND_URL || 'https://swiftpay-backend-uvv9.onrender.com';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: true,
        // The live backend requires a whitelisted Origin
        headers: { Origin: 'https://www.swiftpayfinancial.com' },
      },
    },
  },
  preview: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: true,
        headers: { Origin: 'https://www.swiftpayfinancial.com' },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
