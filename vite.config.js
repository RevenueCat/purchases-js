import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const metaUrlDynamicImport = {
  name: "robust-dynamic-import",
  renderDynamicImport() {
    // To support JSPM and other CDNs that apply optimizations to our code, we need to make sure our dynamic imports are
    // using import.meta.url.
    return {
      left: "import(new URL(",
      right: ", import.meta.url).href)",
    };
  },
};

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "Purchases",
      fileName: (format) => `Purchases.${format}.js`,
    },
  },
  plugins: [
    metaUrlDynamicImport,
    dts({
      rollupTypes: true,
    }),
    svelte({ compilerOptions: { css: "injected" } }),
  ],
});
