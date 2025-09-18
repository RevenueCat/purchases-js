<script module lang="ts">
  import InfoMessage from "../../ui/molecules/info-message.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import type { ComponentProps } from "svelte";
  import type { StoryContext } from "@storybook/svelte";

  let { Story } = defineMeta({
    component: InfoMessage,
    title: "Molecules/InfoMessage",
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
  type Args = ComponentProps<typeof InfoMessage>;
  type Context = StoryContext<typeof InfoMessage>;
</script>

{#snippet template(args: Args, _context: Context)}
  <InfoMessage {...args} />
{/snippet}

<Story
  name="Default"
  args={{
    title: "Important Information",
    message:
      "This is an example of a custom info message that can be used throughout the application.",
  }}
></Story>
