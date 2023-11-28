import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  build: {
    target: "es2015",
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "Purchases",
      formats: ["es"],
    },
  },
  plugins: [dts(), svelte()],
});
