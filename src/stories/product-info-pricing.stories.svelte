<script module>
  import { brandingLanguageViewportModes } from "../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbarDecorator } from "./utils/decorators";
  import ProductInfoPricing from "../ui/components/product-info/pricing.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    nonSubscriptionOption,
    consumableProduct,
    nonConsumableProduct,
    colorfulBrandingAppearance,
  } from "./fixtures";

  const { Story } = defineMeta({
    component: ProductInfoPricing,
    title: "Components/ProductInfoPricing",
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbarDecorator],
    parameters: {
      chromatic: {
        modes: brandingLanguageViewportModes,
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

<Story name="Subscription With Trial">
  <ProductInfoPricing
    productDetails={product}
    purchaseOption={subscriptionOptionWithTrial}
  />
</Story>

<Story name="Consumable">
  <ProductInfoPricing
    productDetails={consumableProduct}
    purchaseOption={nonSubscriptionOption}
  />
</Story>

<Story name="Consumable With Description">
  <ProductInfoPricing
    productDetails={consumableProduct}
    purchaseOption={nonSubscriptionOption}
    showProductDescription={true}
  />
</Story>

<Story name="Non Consumable">
  <ProductInfoPricing
    productDetails={nonConsumableProduct}
    purchaseOption={nonSubscriptionOption}
  />
</Story>

<Story name="Non Consumable With Description">
  <ProductInfoPricing
    productDetails={nonConsumableProduct}
    purchaseOption={nonSubscriptionOption}
    showProductDescription={true}
  />
</Story>
