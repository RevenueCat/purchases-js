<script module>
  import { brandingLanguageViewportModes } from "../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbarDecorator } from "./utils/decorators";
  import ProductInfoHeader from "../ui/components/product-info/header.svelte";
  import { product, colorfulBrandingAppearance } from "./fixtures";

  const { Story } = defineMeta({
    component: ProductInfoHeader,
    title: "Components/ProductInfoHeader",
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbarDecorator],
    parameters: {
      chromatic: {
        modes: brandingLanguageViewportModes,
      },
    },
  });
</script>

<Story name="With description">
  <ProductInfoHeader productDetails={product} showProductDescription={false} />
</Story>

<Story name="Without description">
  <ProductInfoHeader productDetails={product} showProductDescription={true} />
</Story>
