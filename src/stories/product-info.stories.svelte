<script module>
  import { brandingModes } from "../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbarDecorator } from "./utils/decorators";
  import ProductInfo from "../ui/components/product-info.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    nonSubscriptionOption,
    consumableProduct,
  } from "./fixtures";

  const { Story } = defineMeta({
    component: ProductInfo,
    title: "Components/ProductInfo",
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbarDecorator],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story name="Default">
  <ProductInfo
    productDetails={product}
    purchaseOption={subscriptionOption}
    showProductDescription={true}
  />
</Story>
