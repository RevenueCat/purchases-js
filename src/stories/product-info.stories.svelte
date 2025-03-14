<script module>
  import { brandingModes } from "../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbar } from "./decorators/with-navbar";
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
    decorators: [withNavbar],
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
