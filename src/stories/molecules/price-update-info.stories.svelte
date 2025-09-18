<script module lang="ts">
  import PriceUpdateInfo from "../../ui/molecules/price-update-info.svelte";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import { subscriptionOption, subscriptionOptionWithTrial } from "../fixtures";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: PriceUpdateInfo,
    title: "Molecules/InfoMessage",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideMain],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    render: (args: Args, context: Context) => template(args, context),
  });
  type Args = ComponentProps<typeof PriceUpdateInfo>;
  type Context = StoryContext<typeof PriceUpdateInfo>;
</script>

{#snippet template(args: Args, _context: Context)}
  <PriceUpdateInfo
    subscriptionOption={args.subscriptionOption ?? subscriptionOption}
  />
{/snippet}

<Story name="Price Update" args={{ subscriptionOption: subscriptionOption }} />

<Story
  name="Price Update (Free Trial)"
  args={{ subscriptionOption: subscriptionOptionWithTrial }}
/>
