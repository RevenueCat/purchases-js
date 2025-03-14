import type { StorybookConfig } from "@storybook/svelte-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx|svelte)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-controls",
    "@storybook/sveltekit",
    "storybook-addon-pseudo-states",
    "storybook-addon-mock-date",
    {
      name: "@storybook/addon-svelte-csf",
      options: {
        legacyTemplate: false,
      },
    },
  ],
  features: {
    viewportStoryGlobals: true,
  },
  framework: "@storybook/svelte-vite",
  docs: {},
  env: (config) => ({
    ...config,
    VITE_STORYBOOK_PUBLISHABLE_API_KEY:
      process.env.VITE_STORYBOOK_PUBLISHABLE_API_KEY || "",
    VITE_STORYBOOK_ACCOUNT_ID: process.env.VITE_STORYBOOK_ACCOUNT_ID || "",
  }),
};
export default config;
