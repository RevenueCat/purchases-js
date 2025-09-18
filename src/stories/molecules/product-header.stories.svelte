<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import ProductHeader from "../../ui/molecules/product-header.svelte";
  import { product } from "../fixtures";

  const { Story } = defineMeta({
    component: ProductHeader,
    title: "Molecules/ProductHeader",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideNavbarBody],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story name="Without description">
  <ProductHeader productDetails={product} showProductDescription={false} />
</Story>

<Story name="With description">
  <ProductHeader productDetails={product} showProductDescription={true} />
</Story>
