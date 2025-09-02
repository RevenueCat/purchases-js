import type { StorybookConfig } from "@storybook/svelte-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx|svelte)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/sveltekit",
    "storybook-addon-pseudo-states",
    "storybook-addon-mock-date",
    {
      name: "@storybook/addon-svelte-csf",
      options: {
        legacyTemplate: false,
      },
    },
    "@storybook/addon-docs",
  ],
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
