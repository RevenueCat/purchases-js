<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
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
    priceBreakdownTaxDisabled,
    priceBreakdownTaxDisabledIntroPrice,
    priceBreakdownTaxInclusive,
    priceBreakdownTaxInclusiveWithIntroPricePaidUpfront,
    priceBreakdownTaxExclusive,
    priceBreakdownTaxExclusiveWithIntroPricePaidUpfront,
  } from "../fixtures";

  const { Story } = defineMeta({
    component: ProductInfo,
    title: "Organisms/ProductInfo",
    decorators: [renderInsideNavbarBody],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story
  name="Default"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxDisabled,
  }}
/>

<Story
  name="Trial"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithTrial,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxDisabled,
  }}
/>

<Story
  name="Intro Price - Paid Upfront"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithIntroPricePaidUpfront,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxDisabledIntroPrice,
  }}
/>

<Story
  name="Intro Price - Recurring"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithIntroPriceRecurring,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxDisabledIntroPrice,
  }}
/>

<Story
  name="Trial + Intro Price - Paid Upfront"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxDisabledIntroPrice,
  }}
/>

<Story
  name="Trial + Intro Price - Recurring"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithTrialAndIntroPriceRecurring,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxDisabledIntroPrice,
  }}
/>

<Story
  name="Non-subscription"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOption,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxDisabled,
  }}
/>

<Story
  name="Tax Inclusive"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxInclusive,
  }}
/>

<Story
  name="Tax Inclusive with Trial + Intro Price - Paid Upfront"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxInclusiveWithIntroPricePaidUpfront,
  }}
/>

<Story
  name="Tax Inclusive with Intro Price - Paid Upfront"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithIntroPricePaidUpfront,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxInclusiveWithIntroPricePaidUpfront,
  }}
/>

<Story
  name="Tax Inclusive with Intro Price - Recurring"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithIntroPriceRecurring,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxInclusiveWithIntroPricePaidUpfront,
  }}
/>

<Story
  name="Tax Exclusive"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxExclusive,
  }}
/>

<Story
  name="Tax Exclusive with trial"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithTrial,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxExclusive,
  }}
/>

<Story
  name="Tax Exclusive with Trial + Intro Price - Paid Upfront"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxExclusiveWithIntroPricePaidUpfront,
  }}
/>

<Story
  name="Tax Exclusive with Intro Price - Recurring"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithIntroPriceRecurring,
    showProductDescription: true,
    priceBreakdown: priceBreakdownTaxExclusiveWithIntroPricePaidUpfront,
  }}
/>
