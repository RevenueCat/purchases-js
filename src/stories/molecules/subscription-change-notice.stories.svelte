<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  import { brandingModes } from "../../../.storybook/modes";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import SubscriptionChangeNotice from "../../ui/molecules/subscription-change-notice.svelte";

  let { Story } = defineMeta({
    component: SubscriptionChangeNotice,
    title: "Molecules/SubscriptionChangeNotice",
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

  type Args = ComponentProps<typeof SubscriptionChangeNotice>;
  type Context = StoryContext<typeof SubscriptionChangeNotice>;
</script>

{#snippet template(args: Args, _context: Context)}
  <SubscriptionChangeNotice {...args} />
{/snippet}

<Story
  name="Refund"
  args={{
    previousProductName: "Pro Monthly",
    productName: "Pro Yearly",
    variant: "refund",
  }}
/>

<Story
  name="Credit"
  args={{
    previousProductName: "Pro Monthly",
    productName: "Pro Yearly",
    variant: "credit",
  }}
/>

<Story
  name="Deferred"
  args={{
    previousProductName: "Pro Monthly",
    productName: "Pro Yearly",
    variant: "deferred",
  }}
/>
