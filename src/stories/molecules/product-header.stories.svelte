<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import ProductInfoHeader from "../../ui/molecules/product-header.svelte";
  import { product, colorfulBrandingAppearance } from "../fixtures";

  const { Story } = defineMeta({
    component: ProductInfoHeader,
    title: "Molecules/ProductHeader",
    decorators: [renderInsideNavbarBody],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story name="Without description">
  <ProductInfoHeader productDetails={product} showProductDescription={false} />
</Story>

<Story name="With description">
  <ProductInfoHeader productDetails={product} showProductDescription={true} />
</Story>
