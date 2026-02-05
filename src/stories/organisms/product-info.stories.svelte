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
    nonSubscriptionOption,
    consumableProduct,
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
