<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import PricingSummary from "../../ui/molecules/pricing-summary.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    nonSubscriptionOption,
    consumableProduct,
    priceBreakdownTaxDisabled,
  } from "../fixtures";

  const { Story } = defineMeta({
    component: PricingSummary,
    title: "Molecules/PricingSummary",
    decorators: [renderInsideNavbarBody],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story
  name="Subscription"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
    basePhase: subscriptionOption.base,
  }}
/>

<Story
  name="Trial"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
    basePhase: subscriptionOption.base,
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>

<Story
  name="Non Subscription"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
  }}
/>
