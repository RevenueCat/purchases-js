import type { Preview } from "@storybook/svelte";
import GlobalDecorator from "../src/stories/utils/global-decorator.svelte";
import { brandingInfos } from "../src/stories/fixtures";
import { allModes } from "./modes";

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
    viewport: {
      options: {
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
        embedded: {
          name: "Embedded",
          styles: {
            width: "100vw",
            height: "100vh",
          },
        },
      },
    },
    chromatic: {
      modes: {
        "mobile default": allModes["mobile default"],
        "desktop with branding": allModes["desktop with branding"],
      },
    },
  },
  decorators: [
    (Story, context) => {
      return {
        Component: GlobalDecorator,
        props: {
          globals: context.globals,
          children: () => ({
            Component: Story,
            props: context.args,
          }),
        },
      };
    },
  ],
  globalTypes: {
    locale: {
      description: "Pick an example locale",
      toolbar: {
        title: "Locale",
        icon: "globe",
        dynamicTitle: true,
        items: [
          {
            value: "en",
            title: "English",
          },
          {
            value: "fr",
            title: "French",
          },
          {
            value: "de",
            title: "German",
          },
          {
            value: "es",
            title: "Spanish",
          },
          {
            value: "it",
            title: "Italian",
          },
          {
            value: "ja",
            title: "Japanese",
          },
          {
            value: "ca",
            title: "Catalan",
          },
          {
            value: "ar",
            title: "Arabic",
          },
        ],
      },
    },
    brandingName: {
      description: "Pick an example branding",
      toolbar: {
        title: "Branding",
        icon: "paintbrush",
        dynamicTitle: true,
        items: Object.keys(brandingInfos).map((key) => ({
          value: key,
          title: key,
        })),
      },
    },
  },
  initialGlobals: {
    locale: "en",
    brandingName: "Igify",
    viewport: { value: "mobile", isRotated: false },
  },
};

export default preview;
