<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import ProductHeader from "../../ui/molecules/product-header.svelte";
  import { product } from "../fixtures";
  import type { ComponentProps } from "svelte";

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
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type Args = ComponentProps<typeof ProductHeader>;
  type Context = StoryContext<typeof ProductHeader>;
</script>

{#snippet template(args: Args, _context: Context)}
  <ProductHeader
    productDetails={args.productDetails}
    showProductDescription={args.showProductDescription}
  />
{/snippet}

<Story
  name="Without description"
  args={{ productDetails: product, showProductDescription: false }}
/>

<Story
  name="With description"
  args={{ productDetails: product, showProductDescription: true }}
/>
