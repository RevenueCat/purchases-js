<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  import { brandingModes } from "../../../.storybook/modes";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import UnusedTimeAdjustment from "../../ui/molecules/unused-time-adjustment.svelte";

  let { Story } = defineMeta({
    component: UnusedTimeAdjustment,
    title: "Molecules/UnusedTimeAdjustment",
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

  type Args = ComponentProps<typeof UnusedTimeAdjustment>;
  type Context = StoryContext<typeof UnusedTimeAdjustment>;
</script>

{#snippet template(args: Args, _context: Context)}
  <UnusedTimeAdjustment {...args} />
{/snippet}

<Story
  name="Refund"
  args={{
    previousProductName: "Pro Monthly",
    variant: "refund",
  }}
/>

<Story
  name="Credit"
  args={{
    previousProductName: "Pro Monthly",
    variant: "credit",
  }}
/>
