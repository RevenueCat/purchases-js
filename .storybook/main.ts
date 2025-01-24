import type { StorybookConfig } from "@storybook/svelte-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx|svelte)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    {
      name: "@storybook/addon-svelte-csf",
      options: {
        legacyTemplate: false,
      },
    },
  ],
  framework: "@storybook/svelte-vite",
  docs: {
    autodocs: "tag",
  },
  env: (config) => ({
    ...config,
    VITE_STORYBOOK_PUBLISHABLE_API_KEY:
      process.env.VITE_STORYBOOK_PUBLISHABLE_API_KEY || "",
    VITE_STORYBOOK_RESTRICTED_SECRET:
      process.env.VITE_STORYBOOK_RESTRICTED_SECRET || "",
    VITE_STORYBOOK_ACCOUNT_ID: process.env.VITE_STORYBOOK_ACCOUNT_ID || "",
  }),
};
export default config;
