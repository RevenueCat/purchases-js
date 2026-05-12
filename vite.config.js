import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import process from "node:process";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isPureBuild = process.env.BUILD_VARIANT === "pure";

export default defineConfig({
  build: {
    emptyOutDir: !isPureBuild,
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "Purchases",
      fileName: (format) =>
        isPureBuild ? `Purchases-pure.${format}.js` : `Purchases.${format}.js`,
    },
  },
  resolve: isPureBuild
    ? {
        alias: {
          "@stripe/stripe-js": "@stripe/stripe-js/pure",
        },
      }
    : undefined,
  plugins: [
    ...(isPureBuild
      ? []
      : [
          dts({
            rollupTypes: true,
          }),
        ]),
    svelte({ compilerOptions: { css: "injected" } }),
  ],
});
