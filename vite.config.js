import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import dts from "vite-plugin-dts";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { verifyEntryPointBoundaries } from "./vite.entry-point-boundaries.plugin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const shouldVerifyEntryPointBoundaries =
    loadEnv(mode, __dirname, "VERIFY_ENTRY_POINT_BOUNDARIES")
      .VERIFY_ENTRY_POINT_BOUNDARIES === "true";

  return {
    build: {
      lib: {
        entry: resolve(__dirname, "src/main.ts"),
        name: "Purchases",
        fileName: (format) => `Purchases.${format}.js`,
      },
      rollupOptions: {
        // This native-only dependency contains Flow syntax. It must be loaded by
        // the Vega runtime, rather than parsed and bundled into the web SDK.
        external: ["@amazon-devices/keplerscript-appstore-iap-lib"],
      },
    },
    plugins: [
      dts({
        rollupTypes: true,
      }),
      svelte({ compilerOptions: { css: "injected" } }),
      ...(shouldVerifyEntryPointBoundaries
        ? [verifyEntryPointBoundaries({ isVegaBuild: false })]
        : []),
    ],
  };
});
