import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@amazon-devices/react-native-kepler": resolve(
        __dirname,
        "src/amazon-vega/react-native-kepler-shim.cjs",
      ),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "Purchases",
      fileName: (format) => `Purchases.${format}.js`,
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
    }),
    svelte({ compilerOptions: { css: "injected" } }),
  ],
});
