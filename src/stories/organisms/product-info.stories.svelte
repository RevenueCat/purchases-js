<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import ProductInfo from "../../ui/organisms/product-info.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    nonSubscriptionOption,
    consumableProduct,
    priceBreakdownTaxDisabled,
    priceBreakdownTaxInclusive,
    priceBreakdownTaxExclusive,
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
