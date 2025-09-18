<script module lang="ts">
  import { default as Icon } from "../../ui/atoms/icon.svelte";
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: Icon,
    title: "Atoms/Icon",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideMain],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    render: (args: Args, context: Context) => template(args, context),
  });
  type Args = ComponentProps<typeof Icon>;
  type Context = StoryContext<typeof Icon>;
</script>

{#snippet template(args: Args, _context: Context)}
  <Icon name={args.name ?? "cart"} />
{/snippet}

<Story name="Cart" args={{ name: "cart" }} />
<Story name="Error" args={{ name: "error" }} />
<Story name="Lock" args={{ name: "lock" }} />
<Story name="Success" args={{ name: "success" }} />
<Story name="Back" args={{ name: "back" }} />
<Story name="Close" args={{ name: "close" }} />
<Story name="Chevron Up" args={{ name: "chevron-up" }} />
<Story name="Chevron Down" args={{ name: "chevron-down" }} />
<Story name="Chevron Left" args={{ name: "chevron-left" }} />
<Story name="Chevron Right" args={{ name: "chevron-right" }} />
<Story name="Info" args={{ name: "info" }} />
