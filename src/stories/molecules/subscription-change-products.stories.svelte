<script module lang="ts">
  import SubscriptionChangeProducts from "../../ui/molecules/subscription-change-products.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import type { ComponentProps } from "svelte";
  import type { StoryContext } from "@storybook/svelte";

  let { Story } = defineMeta({
    component: SubscriptionChangeProducts,
    title: "Molecules/SubscriptionChangeProducts",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideMain],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type Args = ComponentProps<typeof SubscriptionChangeProducts>;
  type Context = StoryContext<typeof SubscriptionChangeProducts>;
</script>

{#snippet template(args: Args, _context: Context)}
  <SubscriptionChangeProducts {...args} />
{/snippet}

<Story
  name="Default"
  args={{
    fromTitle: "Radio Plus",
    fromPrice: "£9.99",
    toTitle: "Classic FM",
    toPrice: "£3.99",
  }}
></Story>
