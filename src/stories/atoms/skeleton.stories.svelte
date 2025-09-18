<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import Skeleton from "../../ui/atoms/skeleton.svelte";
  import type { ComponentProps } from "svelte";

  const { Story } = defineMeta({
    component: Skeleton,
    title: "Atoms/Skeleton",
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
  type Args = ComponentProps<typeof Skeleton>;
  type Context = StoryContext<typeof Skeleton>;
</script>

{#snippet template(args: Args, _context: Context)}
  <div style="display: flex; align-items: flex-start;">
    <Skeleton>
      {@render args.children?.()}
    </Skeleton>
  </div>
{/snippet}

{#snippet loading()}
  Loading
{/snippet}

{#snippet priceUsd()}
  $12.34
{/snippet}

{#snippet priceSek()}
  12.34 SEK
{/snippet}

<Story name="Loading" args={{ children: loading }} />
<Story name="Price USD" args={{ children: priceUsd }} />
<Story name="Price SEK" args={{ children: priceSek }} />
