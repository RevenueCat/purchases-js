import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
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
  ],
});
