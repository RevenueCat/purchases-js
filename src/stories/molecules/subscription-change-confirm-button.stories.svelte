<script module lang="ts">
  import SubscriptionChangeConfirmButton from "../../ui/molecules/subscription-change-confirm-button.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import type { ComponentProps } from "svelte";
  import type { StoryContext } from "@storybook/svelte";

  let { Story } = defineMeta({
    component: SubscriptionChangeConfirmButton,
    title: "Molecules/SubscriptionChangeConfirmButton",
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
  type Args = ComponentProps<typeof SubscriptionChangeConfirmButton>;
  type Context = StoryContext<typeof SubscriptionChangeConfirmButton>;
</script>

{#snippet template(args: Args, _context: Context)}
  <SubscriptionChangeConfirmButton {...args} />
{/snippet}

<Story
  name="Immediate Upgrade"
  args={{
    changeType: "immediate",
    formattedPrice: "£11.99",
  }}
></Story>

<Story
  name="Immediate Upgrade Confirming"
  args={{
    changeType: "immediate",
    formattedPrice: "£11.99",
    confirming: true,
  }}
></Story>

<Story
  name="Deferred Schedule Change"
  args={{
    changeType: "deferred",
  }}
></Story>

<Story
  name="Deferred Schedule Change Confirming"
  args={{
    changeType: "deferred",
    confirming: true,
  }}
></Story>
