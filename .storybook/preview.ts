import type { Preview } from "@storybook/svelte";

const INITIAL_VIEWPORTS = {
  options: {
    viewports: {
      mobile: {
        name: "Mobile",
        styles: {
          width: "375px",
          height: "667px",
        },
      },
      tablet: {
        name: "Tablet",
        styles: {
          width: "1024px",
          height: "768px",
        },
      },
      desktop: {
        name: "Desktop",
        styles: {
          width: "1440px",
          height: "900px",
        },
      },
    },
  },
};

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: INITIAL_VIEWPORTS,
  },
  initialGlobals: {
    viewport: { value: "mobile", isRotated: false },
  },
};

export default preview;
