import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Playwright owns src/tests; vitest runs only *.unit.test.ts so the two don't collide.
  test: {
    include: ["src/**/*.unit.test.ts"],
  },
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
