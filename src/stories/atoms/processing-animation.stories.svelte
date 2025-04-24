<script module>
  import { default as ProcessingAnimation } from "../../ui/atoms/processing-animation.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: ProcessingAnimation,
    title: "Atoms/ProcessingAnimation",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideMain],
    argTypes: {
      size: {
        control: "radio",
        options: ["small", "medium", "large"],
      },
    },
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });

  const args = {
    size: "medium" as const,
  };
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template({ ...args }: Args<typeof Story>)}
  <ProcessingAnimation {...args} />
{/snippet}

<Story name="Small" args={{ ...args, size: "small" }} />
<Story name="Medium" args={{ ...args, size: "medium" }} />
<Story name="Large" args={{ ...args, size: "large" }} />
