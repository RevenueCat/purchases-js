<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbar } from "../decorators/with-navbar";
  import ProductInfoPricingWithTaxSupport from "../../ui/molecules/product-pricing-with-tax-support.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    nonSubscriptionOption,
    consumableProduct,
  } from "../fixtures";

  const { Story } = defineMeta({
    component: ProductInfoPricingWithTaxSupport,
    title: "Molecules/ProductPricingWithTaxSupport",
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbar],
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
    productDetails: product,
    purchaseOption: subscriptionOption,
  }}
/>

<Story
  name="Trial"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithTrial,
  }}
/>

<Story
  name="Non Subscription"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOption,
  }}
/>
