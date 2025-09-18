<script module lang="ts">
  import Spinner from "../../ui/atoms/spinner.svelte";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: Spinner,
    title: "Atoms/Spinner",
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

  type Args = ComponentProps<typeof Spinner>;
  type Context = StoryContext<typeof Spinner>;
</script>

{#snippet template(_: Args, _context: Context)}
  <Spinner />
{/snippet}

<Story name="Default" />
