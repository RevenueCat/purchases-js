<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import PricingSummary from "../../ui/molecules/pricing-summary.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    subscriptionOptionWithIntroPricePaidUpfront,
    subscriptionOptionWithIntroPriceRecurring,
    subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    subscriptionOptionWithTrialAndIntroPriceRecurring,
    nonSubscriptionOption,
    consumableProduct,
    priceBreakdownTaxDisabled,
    priceBreakdownTaxDisabledIntroPriceRecurring,
    priceBreakdownTaxDisabledIntroPricePaidUpfront,
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
  name="Intro Price - Paid Upfront"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPricePaidUpfront,
    basePhase: subscriptionOptionWithIntroPricePaidUpfront.base,
    introPricePhase: subscriptionOptionWithIntroPricePaidUpfront.introPrice,
  }}
/>

<Story
  name="Intro Price - Recurring"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPriceRecurring,
    basePhase: subscriptionOptionWithIntroPriceRecurring.base,
    introPricePhase: subscriptionOptionWithIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Trial + Intro Price - Paid Upfront"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPricePaidUpfront,
    basePhase: subscriptionOptionWithTrialAndIntroPricePaidUpfront.base,
    trialPhase: subscriptionOptionWithTrialAndIntroPricePaidUpfront.trial,
    introPricePhase:
      subscriptionOptionWithTrialAndIntroPricePaidUpfront.introPrice,
  }}
/>

<Story
  name="Trial + Intro Price - Recurring"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPriceRecurring,
    basePhase: subscriptionOptionWithTrialAndIntroPriceRecurring.base,
    trialPhase: subscriptionOptionWithTrialAndIntroPriceRecurring.trial,
    introPricePhase:
      subscriptionOptionWithTrialAndIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Non Subscription"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
  }}
/>
