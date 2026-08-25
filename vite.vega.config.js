import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Produces the Vega-only build exposed as `@revenuecat/purchases-js/vega`.
 *
 * This configuration is intentionally separate from the default build: Vite
 * accepts one build configuration at a time, and the two entry points have
 * different dependency boundaries. The Amazon package stays external here so
 * the Vega bundle keeps a static module import that the Vega runtime resolves.
 */
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/vega.ts"),
      name: "Purchases",
      fileName: (format) => `Purchases.vega.${format}.js`,
    },
    rollupOptions: {
      external: [
        "@amazon-devices/kepler-file-system",
        "@amazon-devices/keplerscript-appstore-iap-lib",
        "react-native",
      ],
    },
  },
  plugins: [svelte({ compilerOptions: { css: "injected" } })],
});
