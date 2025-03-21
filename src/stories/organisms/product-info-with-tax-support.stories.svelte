<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbar } from "../decorators/with-navbar";
  import ProductInfoWithTaxSupport from "../../ui/organisms/product-info-with-tax-support.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    nonSubscriptionOption,
    consumableProduct,
  } from "../fixtures";

  const { Story } = defineMeta({
    component: ProductInfoWithTaxSupport,
    title: "Organisms/ProductInfoWithTaxSupport",
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
  name="Default"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    showProductDescription: true,
  }}
/>

<Story
  name="Trial"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithTrial,
    showProductDescription: true,
  }}
/>
