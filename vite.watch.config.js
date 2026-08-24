import { defineConfig, mergeConfig } from "vite";
import defaultConfig from "./vite.config.js";

// The default build clears dist. Watch builds run alongside the Vega watcher,
// so they must preserve the other entry point's artifacts.
export default mergeConfig(
  defaultConfig,
  defineConfig({
    build: {
      emptyOutDir: false,
    },
  }),
);
