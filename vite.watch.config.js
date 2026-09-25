import { defineConfig, mergeConfig } from "vite";
import defaultConfig from "./vite.config.js";

// Preserve existing web artifacts while rebuilding in watch mode.
export default mergeConfig(
  defaultConfig,
  defineConfig({
    build: {
      emptyOutDir: false,
    },
  }),
);
