<script module lang="ts">
  import PricingTable from "../../ui/molecules/pricing-table.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import {
    priceBreakdownNotCollectingTax,
    priceBreakdownTaxExclusiveWithMultipleTaxItems,
    priceBreakdownTaxLoading,
    priceBreakdownTaxPending,
    subscriptionOption,
    subscriptionOptionWithDiscount,
    subscriptionOptionWithDiscountOneTime,
    subscriptionOptionWithDiscountForever,
    subscriptionOptionWithTrial,
    subscriptionOptionWithYearlyBillingAndSixMonthDiscount,
  } from "../fixtures";
  import {
    getPriceBreakdownTaxDisabled,
    getPriceBreakdownTaxExclusive,
    getPriceBreakdownTaxInclusive,
  } from "../helpers/get-price-breakdown";

  const sampleAppliedDiscountCode = "SAVE20";

  let { Story } = defineMeta({
    component: PricingTable,
    title: "Molecules/PricingTable",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideNavbarBody],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    args: {
      priceBreakdown: getPriceBreakdownTaxDisabled(subscriptionOption),
      trialPhase: null,
      basePhase: null,
      promotionalPricePhase: null,
      hasDiscount: false,
      showDiscountCodeField: false,
      appliedDiscountCode: null,
      appliedDiscountPercentage: null,
      isDiscountCodeControlsEnabled: false,
    },
  });
</script>

<Story name="Disabled Tax" />
<Story
  name="Disabled Tax Trial"
  args={{
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>
<Story
  name="Not collecting tax"
  args={{ priceBreakdown: priceBreakdownNotCollectingTax }}
/>
<Story
  name="Not collecting tax Trial"
  args={{
    priceBreakdown: priceBreakdownNotCollectingTax,
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>
<Story
  name="Pending Tax"
  args={{
    priceBreakdown: priceBreakdownTaxPending,
  }}
/>
<Story
  name="Loading Tax"
  args={{
    priceBreakdown: priceBreakdownTaxLoading,
  }}
/>
<Story
  name="Tax Inclusive"
  args={{
    priceBreakdown: getPriceBreakdownTaxInclusive(subscriptionOption),
  }}
/>
<Story
  name="Tax Inclusive Trial"
  args={{
    priceBreakdown: getPriceBreakdownTaxInclusive(subscriptionOptionWithTrial),
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>
<Story
  name="Tax Exclusive"
  args={{
    priceBreakdown: getPriceBreakdownTaxExclusive(subscriptionOption),
  }}
/>
<Story
  name="Tax Exclusive Trial"
  args={{
    priceBreakdown: getPriceBreakdownTaxExclusive(subscriptionOptionWithTrial),
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>
<Story
  name="Multiple Tax Items (Exclusive)"
  args={{
    priceBreakdown: priceBreakdownTaxExclusiveWithMultipleTaxItems,
  }}
/>
<Story
  name="Multiple Tax Items Trial (Exclusive)"
  args={{
    priceBreakdown: priceBreakdownTaxExclusiveWithMultipleTaxItems,
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>
<Story
  name="Disabled Tax One-time Discount"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountOneTime,
    ),
    basePhase: subscriptionOptionWithDiscountOneTime.base,
    promotionalPricePhase: subscriptionOptionWithDiscountOneTime.discount,
    hasDiscount: true,
    appliedDiscountPercentage:
      subscriptionOptionWithDiscountOneTime.discount?.percentage,
  }}
/>
<Story
  name="Disabled Tax Short Discount Window"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithYearlyBillingAndSixMonthDiscount,
    ),
    basePhase: subscriptionOptionWithYearlyBillingAndSixMonthDiscount.base,
    promotionalPricePhase:
      subscriptionOptionWithYearlyBillingAndSixMonthDiscount.discount,
    hasDiscount: true,
    appliedDiscountPercentage:
      subscriptionOptionWithYearlyBillingAndSixMonthDiscount.discount
        ?.percentage,
  }}
/>
<Story
  name="Disabled Tax Discount"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscount,
    ),
    basePhase: subscriptionOptionWithDiscount.base,
    promotionalPricePhase: subscriptionOptionWithDiscount.discount,
    hasDiscount: true,
    appliedDiscountPercentage:
      subscriptionOptionWithDiscount.discount?.percentage,
  }}
/>
<Story
  name="Disabled Tax Forever Discount"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountForever,
    ),
    basePhase: subscriptionOptionWithDiscountForever.base,
    promotionalPricePhase: subscriptionOptionWithDiscountForever.discount,
    hasDiscount: true,
    appliedDiscountPercentage:
      subscriptionOptionWithDiscountForever.discount?.percentage,
  }}
/>
<Story
  name="Disabled Tax One-time Applied Discount Code"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountOneTime,
    ),
    basePhase: subscriptionOptionWithDiscountOneTime.base,
    promotionalPricePhase: subscriptionOptionWithDiscountOneTime.discount,
    hasDiscount: true,
    showDiscountCodeField: true,
    appliedDiscountCode: sampleAppliedDiscountCode,
    appliedDiscountPercentage:
      subscriptionOptionWithDiscountOneTime.discount?.percentage,
    isDiscountCodeControlsEnabled: true,
  }}
/>
<Story
  name="Disabled Tax Short Window Applied Discount Code"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithYearlyBillingAndSixMonthDiscount,
    ),
    basePhase: subscriptionOptionWithYearlyBillingAndSixMonthDiscount.base,
    promotionalPricePhase:
      subscriptionOptionWithYearlyBillingAndSixMonthDiscount.discount,
    hasDiscount: true,
    showDiscountCodeField: true,
    appliedDiscountCode: sampleAppliedDiscountCode,
    appliedDiscountPercentage:
      subscriptionOptionWithYearlyBillingAndSixMonthDiscount.discount
        ?.percentage,
    isDiscountCodeControlsEnabled: true,
  }}
/>
<Story
  name="Disabled Tax Long Window Applied Discount Code"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscount,
    ),
    basePhase: subscriptionOptionWithDiscount.base,
    promotionalPricePhase: subscriptionOptionWithDiscount.discount,
    hasDiscount: true,
    showDiscountCodeField: true,
    appliedDiscountCode: sampleAppliedDiscountCode,
    appliedDiscountPercentage:
      subscriptionOptionWithDiscount.discount?.percentage,
    isDiscountCodeControlsEnabled: true,
  }}
/>
<Story
  name="Disabled Tax Forever Applied Discount Code"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountForever,
    ),
    basePhase: subscriptionOptionWithDiscountForever.base,
    promotionalPricePhase: subscriptionOptionWithDiscountForever.discount,
    hasDiscount: true,
    showDiscountCodeField: true,
    appliedDiscountCode: sampleAppliedDiscountCode,
    appliedDiscountPercentage:
      subscriptionOptionWithDiscountForever.discount?.percentage,
    isDiscountCodeControlsEnabled: true,
  }}
/>
<Story
  name="Tax Inclusive Discount"
  args={{
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithDiscount,
    ),
    basePhase: subscriptionOptionWithDiscount.base,
    promotionalPricePhase: subscriptionOptionWithDiscount.discount,
    hasDiscount: true,
    appliedDiscountPercentage:
      subscriptionOptionWithDiscount.discount?.percentage,
  }}
/>
<Story
  name="Tax Inclusive Forever Discount"
  args={{
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithDiscountForever,
    ),
    basePhase: subscriptionOptionWithDiscountForever.base,
    promotionalPricePhase: subscriptionOptionWithDiscountForever.discount,
    hasDiscount: true,
    appliedDiscountPercentage:
      subscriptionOptionWithDiscountForever.discount?.percentage,
  }}
/>
<Story
  name="Tax Exclusive Discount"
  args={{
    priceBreakdown: getPriceBreakdownTaxExclusive(
      subscriptionOptionWithDiscount,
    ),
    basePhase: subscriptionOptionWithDiscount.base,
    promotionalPricePhase: subscriptionOptionWithDiscount.discount,
    hasDiscount: true,
    appliedDiscountPercentage:
      subscriptionOptionWithDiscount.discount?.percentage,
  }}
/>
<Story
  name="Tax Exclusive Forever Discount"
  args={{
    priceBreakdown: getPriceBreakdownTaxExclusive(
      subscriptionOptionWithDiscountForever,
    ),
    basePhase: subscriptionOptionWithDiscountForever.base,
    promotionalPricePhase: subscriptionOptionWithDiscountForever.discount,
    hasDiscount: true,
    appliedDiscountPercentage:
      subscriptionOptionWithDiscountForever.discount?.percentage,
  }}
/>
