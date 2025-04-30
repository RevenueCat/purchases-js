<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import ProductHeader from "../../ui/molecules/product-header.svelte";
  import { product, colorfulBrandingAppearance } from "../fixtures";

  const { Story } = defineMeta({
    component: ProductHeader,
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
  <ProductHeader productDetails={product} showProductDescription={false} />
</Story>

<Story name="With description">
  <ProductHeader productDetails={product} showProductDescription={true} />
</Story>
