import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    minify: false,
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
