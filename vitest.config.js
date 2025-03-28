import { configDefaults, defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";

export default defineConfig(() => ({
  plugins: [
    svelte({
      compilerOptions: {
        css: "injected",
      },
      preprocess: {
        style: ({ content }) => {
          return { code: content };
        },
      },
    }),
    svelteTesting(),
  ],

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

    // Set environment variables for tests
    env: {
      LC_ALL: "en_US.UTF-8",
      LANG: "en_US.UTF-8",
    },
  },
  define: {
    "process.env.VITEST": JSON.stringify(true),
  },
  // If you need to define other Vite configurations, they can go here
  // ...
}));
