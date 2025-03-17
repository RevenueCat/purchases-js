<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbar } from "../decorators/with-navbar";
  import ProductInfoPricing from "../../ui/molecules/product-pricing.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    nonSubscriptionOption,
    consumableProduct,
  } from "../fixtures";

  const { Story } = defineMeta({
    component: ProductInfoPricing,
    title: "Molecules/ProductPricing",
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbar],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story name="Subscription">
  <ProductInfoPricing
    productDetails={product}
    purchaseOption={subscriptionOption}
  />
</Story>

<Story name="Trial">
  <ProductInfoPricing
    productDetails={product}
    purchaseOption={subscriptionOptionWithTrial}
  />
</Story>

<Story name="Non Subscription">
  <ProductInfoPricing
    productDetails={consumableProduct}
    purchaseOption={nonSubscriptionOption}
  />
</Story>
