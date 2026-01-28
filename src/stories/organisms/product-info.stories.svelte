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
    subscriptionOptionWithDiscountPriceForever,
    subscriptionOptionWithDiscountPrice,
    nonSubscriptionOption,
    nonSubscriptionOptionWithDiscountPrice,
    consumableProduct,
    subscriptionOptionWithDiscountPriceOneTime,
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
    purchaseOption: subscriptionOptionWithDiscountPriceOneTime,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountPriceOneTime,
    ),
  }}
/>

<Story
  name="Subscription with Time Window Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountPrice,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountPrice,
    ),
  }}
/>

<Story
  name="Subscription with Forever Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountPriceForever,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountPriceForever,
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
    purchaseOption: nonSubscriptionOptionWithDiscountPrice,
    priceBreakdown: getPriceBreakdownTaxDisabled(
      nonSubscriptionOptionWithDiscountPrice,
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
    purchaseOption: subscriptionOptionWithDiscountPriceOneTime,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithDiscountPriceOneTime,
    ),
  }}
/>

<Story
  name="Tax Inclusive with Time Window Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountPrice,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithDiscountPrice,
    ),
  }}
/>

<Story
  name="Tax Inclusive with Forever Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountPriceForever,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithDiscountPriceForever,
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
    purchaseOption: nonSubscriptionOptionWithDiscountPrice,
    priceBreakdown: getPriceBreakdownTaxInclusive(
      nonSubscriptionOptionWithDiscountPrice,
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
    purchaseOption: subscriptionOptionWithDiscountPriceOneTime,
    priceBreakdown: getPriceBreakdownTaxExclusive(
      subscriptionOptionWithDiscountPriceOneTime,
    ),
  }}
/>

<Story
  name="Tax Exclusive with Time Window Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountPrice,
    priceBreakdown: getPriceBreakdownTaxExclusive(
      subscriptionOptionWithDiscountPrice,
    ),
  }}
/>

<Story
  name="Tax Exclusive with Forever Discount"
  args={{
    purchaseOption: subscriptionOptionWithDiscountPriceForever,
    priceBreakdown: getPriceBreakdownTaxExclusive(
      subscriptionOptionWithDiscountPriceForever,
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
    purchaseOption: nonSubscriptionOptionWithDiscountPrice,
    priceBreakdown: getPriceBreakdownTaxExclusive(
      nonSubscriptionOptionWithDiscountPrice,
    ),
  }}
/>
