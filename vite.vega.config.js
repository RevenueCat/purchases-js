import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import {
  vegaOnlyModules,
  verifyEntryPointBoundaries,
} from "./vite.entry-point-boundaries.plugin.js";

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
export default defineConfig(({ mode }) => {
  const shouldVerifyEntryPointBoundaries =
    loadEnv(mode, __dirname, "VERIFY_ENTRY_POINT_BOUNDARIES")
      .VERIFY_ENTRY_POINT_BOUNDARIES === "true";

  return {
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, "src/vega.ts"),
        name: "Purchases",
        fileName: (format) => `Purchases.vega.${format}.js`,
      },
      rollupOptions: {
        external: vegaOnlyModules,
      },
    },
    plugins: [
      svelte({ compilerOptions: { css: "injected" } }),
      ...(shouldVerifyEntryPointBoundaries
        ? [verifyEntryPointBoundaries({ isVegaBuild: true })]
        : []),
    ],
  };
});
