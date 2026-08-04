<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { mobileAndDesktopBrandingModes } from "../../../.storybook/modes";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import CheckoutConsent from "../../ui/molecules/checkout-consent.svelte";

  const defaultArgs = {
    appName: "Igify",
    termsAndConditionsUrl: "https://example.com/terms",
    onChange: () => {},
  };

  const { Story } = defineMeta({
    component: CheckoutConsent,
    title: "Molecules/CheckoutConsent",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideMain],
    args: defaultArgs,
    parameters: {
      chromatic: {
        modes: mobileAndDesktopBrandingModes,
      },
    },
  });
</script>

<Story name="Unchecked" args={{ ...defaultArgs, checked: false }} />

<Story name="Checked" args={{ ...defaultArgs, checked: true }} />

<Story
  name="Long App Name"
  args={{
    ...defaultArgs,
    appName: "An Application With A Rather Long Name",
    checked: false,
  }}
/>
