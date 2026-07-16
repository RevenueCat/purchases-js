<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import CheckoutConsent from "../../ui/molecules/checkout-consent.svelte";
  import {
    brandingInfo,
    subscriptionOption,
    subscriptionOptionWithTrial,
  } from "../fixtures";

  const { Story } = defineMeta({
    component: CheckoutConsent,
    title: "Molecules/CheckoutConsent",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideNavbarBody],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story
  name="Non-trial subscription"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOption,
    termsAndConditionsUrl: "https://www.revenuecat.com/terms",
    checked: false,
  }}
/>

<Story
  name="Trial subscription"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOptionWithTrial,
    termsAndConditionsUrl: "https://www.revenuecat.com/terms",
    checked: false,
  }}
/>

<Story
  name="Checked"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOption,
    termsAndConditionsUrl: "https://www.revenuecat.com/terms",
    checked: true,
  }}
/>

<Story
  name="Missing Terms URL"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOption,
    termsAndConditionsUrl: null,
    checked: false,
  }}
/>

<Story
  name="Narrow mobile width"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOptionWithTrial,
    termsAndConditionsUrl: "https://www.revenuecat.com/terms",
    checked: false,
  }}
  parameters={{
    viewport: {
      defaultViewport: "mobile",
    },
  }}
/>
