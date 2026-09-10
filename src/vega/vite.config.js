import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  envDir: resolve(__dirname, "../.."),
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "index.ts"),
      name: "Purchases",
      fileName: (format) => `Purchases.vega.${format}.js`,
    },
    rollupOptions: {
      external: [
        "@amazon-devices/kepler-compatibility",
        "@amazon-devices/kepler-file-system",
        "@amazon-devices/keplerscript-appstore-iap-lib",
        "react-native",
      ],
    },
  },
  plugins: [
    svelte({ compilerOptions: { css: "injected" } }),
    dts({
      tsconfigPath: resolve(__dirname, "tsconfig.json"),
      rollupTypes: true,
    }),
  ],
});
