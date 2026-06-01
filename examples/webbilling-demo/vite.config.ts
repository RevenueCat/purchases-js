import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    fs: {
      allow: [".."],
    },
    watch: {
      ignored: [
        "**/node_modules/**",
        "!**/node_modules/@revenuecat/purchases-js/**",
      ],
    },
  },
  optimizeDeps: {
    exclude: ["@revenuecat/purchases-js"],
  },
  resolve: {
    // Helps avoid duplicate React copies when using linked/workspace deps.
    dedupe: ["react", "react-dom"],
  },
});
