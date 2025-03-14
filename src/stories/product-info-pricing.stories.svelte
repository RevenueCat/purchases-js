<script module>
  import { brandingModes } from "../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbarDecorator } from "./utils/decorators";
  import ProductInfoPricing from "../ui/components/product-info/pricing.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    nonSubscriptionOption,
    consumableProduct,
  } from "./fixtures";

  const { Story } = defineMeta({
    component: ProductInfoPricing,
    title: "Components/ProductInfoPricing",
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbarDecorator],
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
