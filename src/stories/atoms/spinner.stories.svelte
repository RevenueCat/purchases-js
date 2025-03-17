<script module>
  import { default as Spinner } from "../../ui/atoms/spinner.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import { withLayout } from "../decorators/with-layout";
  import { brandingModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: Spinner,
    title: "Atoms/Spinner",
    decorators: [withLayout],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });

  const args = {};
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template({ ...args }: Args<typeof Story>)}
  <Spinner {...args} />
{/snippet}

<Story name="Default" {args} />
