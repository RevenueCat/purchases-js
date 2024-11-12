import { configDefaults, defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(({ mode }) => ({
  plugins: [svelte()],

  // This is needed to make test pass after adding decorators in Purchases.
  esbuild: { target: "es2022" },

  // Use the test field to define test-specific configurations
  test: {
    // Set the environment to 'jsdom' to simulate a browser environment
    environment: "jsdom",

    // Set globals that your tests might depend on
    globals: true,

    // If you're using TypeScript
    // You may need to set up Vite to handle TypeScript files
    // This will depend on your project's setup
    transformMode: {
      web: [/.[tj]sx?$/], // RegEx to transform TypeScript and JavaScript files
    },

    // Specify reporters if needed (e.g., verbose, dot, json)
    reporters: "default", // 'default' or an array of reporters

    // If you need to extend the default jsdom environment (e.g., with a URL)
    setupFiles: "./vitest.setup.js", // Path to the setup file

    // Coverage configuration if you are collecting test coverage
    coverage: {
      provider: "istanbul", // or 'c8'
      // Additional coverage configuration options...
    },

    // Other configurations like shims for APIs or polyfills can also be included
    // ...
    exclude: [...configDefaults.exclude, "examples/**"],
  },

  // The following configuration allows to avoid issues with Svelte's mount
  // function when running tests
  // Svelte error: lifecycle_function_unavailable
  // `mount(...)` is not available on the server
  resolve: {
    conditions: mode === "test" ? ["browser"] : [],
  },

  // If you need to define other Vite configurations, they can go here
  // ...
}));
