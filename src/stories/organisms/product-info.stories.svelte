<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import ProductInfo from "../../ui/organisms/product-info.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    subscriptionOptionWithIntroPricePaidUpfront,
    subscriptionOptionWithIntroPriceRecurring,
    subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    subscriptionOptionWithTrialAndIntroPriceRecurring,
    subscriptionOptionWithDiscountForever,
    subscriptionOptionWithDiscount,
    subscriptionOptionWithWeeklyBillingAndThreeMonthDiscount,
    subscriptionOptionWithYearlyBillingAndSixMonthDiscount,
    subscriptionOptionWithFixedAmountDiscount,
    nonSubscriptionOption,
    nonSubscriptionOptionWithDiscount,
    nonSubscriptionOptionWithFixedAmountDiscount,
    nonSubscriptionOptionWithTimeWindowDiscount,
    consumableProduct,
    subscriptionOptionWithDiscountOneTime,
  } from "../fixtures";
  import {
    getPriceBreakdownTaxDisabled,
    getPriceBreakdownTaxInclusive,
    getPriceBreakdownTaxExclusive,
  } from "../helpers/get-price-breakdown";

  const { Story } = defineMeta({
    component: ProductInfo,
    title: "Organisms/ProductInfo",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideNavbarBody],
    args: {
      productDetails: product,
      showProductDescription: true,
    },
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
    purchaseOption: subscriptionOption,
    priceBreakdown: getPriceBreakdownTaxDisabled(subscriptionOption),
  }}
/>

<Story
  name="Subscription with One-time Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountOneTime,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountOneTime,
    ),
  }}
/>

<Story
  name="Subscription with Time Window Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscount,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscount,
    ),
  }}
/>

<Story
  name="Subscription with Time Window Discount longer than the billing cycle"
  args={{
    purchaseOption: subscriptionOptionWithWeeklyBillingAndThreeMonthDiscount,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithWeeklyBillingAndThreeMonthDiscount,
    ),
  }}
/>

<Story
  name="Subscription with Time Window Discount shorter than the billing cycle"
  args={{
    purchaseOption: subscriptionOptionWithYearlyBillingAndSixMonthDiscount,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithYearlyBillingAndSixMonthDiscount,
    ),
  }}
/>

<Story
  name="Subscription with Fixed Amount Discount"
  args={{
    purchaseOption: subscriptionOptionWithFixedAmountDiscount,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithFixedAmountDiscount,
    ),
  }}
/>

<Story
  name="Subscription with Forever Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountForever,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountForever,
    ),
  }}
/>

<Story
  name="Trial"
  args={{
    purchaseOption: subscriptionOptionWithTrial,
    priceBreakdown: getPriceBreakdownTaxDisabled(subscriptionOptionWithTrial),
  }}
/>

<Story
  name="Intro Price - Paid Upfront"
  args={{
    purchaseOption: subscriptionOptionWithIntroPricePaidUpfront,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithIntroPricePaidUpfront,
    ),
  }}
/>

<Story
  name="Intro Price - Recurring"
  args={{
    purchaseOption: subscriptionOptionWithIntroPriceRecurring,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithIntroPriceRecurring,
    ),
  }}
/>

<Story
  name="Trial + Intro Price - Paid Upfront"
  args={{
    purchaseOption: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    ),
  }}
/>

<Story
  name="Trial + Intro Price - Recurring"
  args={{
    purchaseOption: subscriptionOptionWithTrialAndIntroPriceRecurring,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithTrialAndIntroPriceRecurring,
    ),
  }}
/>

<Story
  name="Non-subscription"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOption,
    priceBreakdown: getPriceBreakdownTaxDisabled(nonSubscriptionOption),
  }}
/>

<Story
  name="Non-subscription with Discount"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOptionWithDiscount,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      nonSubscriptionOptionWithDiscount,
    ),
  }}
/>

<Story
  name="Non-subscription with Fixed Amount Discount"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOptionWithFixedAmountDiscount,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      nonSubscriptionOptionWithFixedAmountDiscount,
    ),
  }}
/>

<Story
  name="Non-subscription with Time Window Discount"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOptionWithTimeWindowDiscount,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      nonSubscriptionOptionWithTimeWindowDiscount,
    ),
  }}
/>

<Story
  name="Tax Inclusive"
  args={{
    purchaseOption: subscriptionOption,
    priceBreakdown: getPriceBreakdownTaxInclusive(subscriptionOption),
  }}
/>

<Story
  name="Tax Inclusive with Trial + Intro Price - Paid Upfront"
  args={{
    purchaseOption: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    ),
  }}
/>

<Story
  name="Tax Inclusive with Intro Price - Paid Upfront"
  args={{
    purchaseOption: subscriptionOptionWithIntroPricePaidUpfront,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithIntroPricePaidUpfront,
    ),
  }}
/>

<Story
  name="Tax Inclusive with Intro Price - Recurring"
  args={{
    purchaseOption: subscriptionOptionWithIntroPriceRecurring,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithIntroPriceRecurring,
    ),
  }}
/>

<Story
  name="Tax Inclusive with with One-time Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountOneTime,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithDiscountOneTime,
    ),
  }}
/>

<Story
  name="Tax Inclusive with Time Window Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscount,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithDiscount,
    ),
  }}
/>

<Story
  name="Tax Inclusive with Forever Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountForever,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithDiscountForever,
    ),
  }}
/>

<Story
  name="Tax Inclusive with Non-subscription"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOption,
    priceBreakdown: getPriceBreakdownTaxInclusive(nonSubscriptionOption),
  }}
/>

<Story
  name="Tax Inclusive with Non-subscription with Discount"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOptionWithDiscount,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      nonSubscriptionOptionWithDiscount,
    ),
  }}
/>

<Story
  name="Tax Exclusive"
  args={{
    purchaseOption: subscriptionOption,
    priceBreakdown: getPriceBreakdownTaxExclusive(subscriptionOption),
  }}
/>

<Story
  name="Tax Exclusive with trial"
  args={{
    purchaseOption: subscriptionOptionWithTrial,
    priceBreakdown: getPriceBreakdownTaxExclusive(subscriptionOptionWithTrial),
  }}
/>

<Story
  name="Tax Exclusive with Trial + Intro Price - Paid Upfront"
  args={{
    purchaseOption: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    priceBreakdown: getPriceBreakdownTaxExclusive(
      subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    ),
  }}
/>

<Story
  name="Tax Exclusive with Intro Price - Recurring"
  args={{
    purchaseOption: subscriptionOptionWithIntroPriceRecurring,
    priceBreakdown: getPriceBreakdownTaxExclusive(
      subscriptionOptionWithIntroPriceRecurring,
    ),
  }}
/>

<Story
  name="Tax Exclusive with with One-time Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountOneTime,
    priceBreakdown: getPriceBreakdownTaxExclusive(
      subscriptionOptionWithDiscountOneTime,
    ),
  }}
/>

<Story
  name="Tax Exclusive with Time Window Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscount,
    priceBreakdown: getPriceBreakdownTaxExclusive(
      subscriptionOptionWithDiscount,
    ),
  }}
/>

<Story
  name="Tax Exclusive with Forever Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountForever,
    priceBreakdown: getPriceBreakdownTaxExclusive(
      subscriptionOptionWithDiscountForever,
    ),
  }}
/>

<Story
  name="Tax Exclusive with Non-subscription"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOption,
    priceBreakdown: getPriceBreakdownTaxExclusive(nonSubscriptionOption),
  }}
/>

<Story
  name="Tax Exclusive with Non-subscription with Discount"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOptionWithDiscount,
    priceBreakdown: getPriceBreakdownTaxExclusive(
      nonSubscriptionOptionWithDiscount,
    ),
  }}
/>
