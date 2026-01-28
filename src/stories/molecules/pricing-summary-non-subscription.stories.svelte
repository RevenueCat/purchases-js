<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import PricingSummaryNonSubscription from "../../ui/molecules/pricing-summary-non-subscription.svelte";
  import {
    nonSubscriptionOptionWithDiscountPrice,
    nonSubscriptionOption,
    nonSubscriptionBasePricingPhase,
  } from "../fixtures";
  import { getPriceBreakdownTaxDisabled } from "../helpers/get-price-breakdown";

  let { Story } = defineMeta({
    component: PricingSummaryNonSubscription,
    title: "Molecules/PricingSummaryNonSubscription",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideNavbarBody],
    args: {
      basePhase: nonSubscriptionBasePricingPhase,
    },
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story
  name="Non Subscription"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(nonSubscriptionOption),
  }}
/>

<Story
  name="Non Subscription with Discount"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      nonSubscriptionOptionWithDiscountPrice,
    ),
    discountPricePhase: nonSubscriptionOptionWithDiscountPrice.discountPrice,
  }}
/>
