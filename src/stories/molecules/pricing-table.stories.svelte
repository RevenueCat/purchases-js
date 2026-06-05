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
  import { resolveDiscountBreakdown } from "../../helpers/discount-breakdown-helper";
  import { LocalizationKeys } from "../../ui/localization/supportedLanguages";
  import type { SubscriptionOption } from "../../entities/offerings";
  import type { PriceBreakdown } from "../../ui/ui-types";
  import { Translator } from "../../ui/localization/translator";

  const sampleAppliedDiscountCode = "SAVE20";
  const storyTranslator = new Translator();

  const discountStoryArgs = (
    option: SubscriptionOption,
    priceBreakdown: PriceBreakdown,
    extra: Record<string, unknown> = {},
  ) => ({
    priceBreakdown,
    basePhase: option.base,
    resolvedDiscount: resolveDiscountBreakdown({
      priceBreakdown,
      purchaseOptionDiscount: option.discount,
      fullPriceMicros:
        priceBreakdown.originalAmountInMicros ??
        option.base.price?.amountMicros ??
        priceBreakdown.totalAmountInMicros,
      basePeriod: option.base.period ?? null,
      translator: storyTranslator,
      fallbackDiscountName: storyTranslator.translate(
        LocalizationKeys.PricingTableDiscount,
      ),
    }),
    ...extra,
  });

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
      resolvedDiscount: null,
      showDiscountCodeField: false,
      appliedDiscountCode: null,
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
  args={discountStoryArgs(
    subscriptionOptionWithDiscountOneTime,
    getPriceBreakdownTaxDisabled(subscriptionOptionWithDiscountOneTime),
  )}
/>
<Story
  name="Disabled Tax Short Discount Window"
  args={discountStoryArgs(
    subscriptionOptionWithYearlyBillingAndSixMonthDiscount,
    getPriceBreakdownTaxDisabled(
      subscriptionOptionWithYearlyBillingAndSixMonthDiscount,
    ),
  )}
/>
<Story
  name="Disabled Tax Discount"
  args={discountStoryArgs(
    subscriptionOptionWithDiscount,
    getPriceBreakdownTaxDisabled(subscriptionOptionWithDiscount),
  )}
/>
<Story
  name="Disabled Tax Forever Discount"
  args={discountStoryArgs(
    subscriptionOptionWithDiscountForever,
    getPriceBreakdownTaxDisabled(subscriptionOptionWithDiscountForever),
  )}
/>
<Story
  name="Disabled Tax One-time Applied Discount Code"
  args={discountStoryArgs(
    subscriptionOptionWithDiscountOneTime,
    getPriceBreakdownTaxDisabled(subscriptionOptionWithDiscountOneTime),
    {
      showDiscountCodeField: true,
      appliedDiscountCode: sampleAppliedDiscountCode,
      isDiscountCodeControlsEnabled: true,
    },
  )}
/>
<Story
  name="Disabled Tax Short Window Applied Discount Code"
  args={discountStoryArgs(
    subscriptionOptionWithYearlyBillingAndSixMonthDiscount,
    getPriceBreakdownTaxDisabled(
      subscriptionOptionWithYearlyBillingAndSixMonthDiscount,
    ),
    {
      showDiscountCodeField: true,
      appliedDiscountCode: sampleAppliedDiscountCode,
      isDiscountCodeControlsEnabled: true,
    },
  )}
/>
<Story
  name="Disabled Tax Long Window Applied Discount Code"
  args={discountStoryArgs(
    subscriptionOptionWithDiscount,
    getPriceBreakdownTaxDisabled(subscriptionOptionWithDiscount),
    {
      showDiscountCodeField: true,
      appliedDiscountCode: sampleAppliedDiscountCode,
      isDiscountCodeControlsEnabled: true,
    },
  )}
/>
<Story
  name="Disabled Tax Forever Applied Discount Code"
  args={discountStoryArgs(
    subscriptionOptionWithDiscountForever,
    getPriceBreakdownTaxDisabled(subscriptionOptionWithDiscountForever),
    {
      showDiscountCodeField: true,
      appliedDiscountCode: sampleAppliedDiscountCode,
      isDiscountCodeControlsEnabled: true,
    },
  )}
/>
<Story
  name="Tax Inclusive Discount"
  args={discountStoryArgs(
    subscriptionOptionWithDiscount,
    getPriceBreakdownTaxInclusive(subscriptionOptionWithDiscount),
  )}
/>
<Story
  name="Tax Inclusive Forever Discount"
  args={discountStoryArgs(
    subscriptionOptionWithDiscountForever,
    getPriceBreakdownTaxInclusive(subscriptionOptionWithDiscountForever),
  )}
/>
<Story
  name="Tax Exclusive Discount"
  args={discountStoryArgs(
    subscriptionOptionWithDiscount,
    getPriceBreakdownTaxExclusive(subscriptionOptionWithDiscount),
  )}
/>
<Story
  name="Tax Exclusive Forever Discount"
  args={discountStoryArgs(
    subscriptionOptionWithDiscountForever,
    getPriceBreakdownTaxExclusive(subscriptionOptionWithDiscountForever),
  )}
/>
