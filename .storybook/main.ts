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
        legacyTemplate: true,
      },
    },
  ],
  framework: "@storybook/svelte-vite",
  docs: {
    autodocs: "tag",
  },
};
export default config;
