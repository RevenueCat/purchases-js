<script module>
  import { default as Icon } from "../../ui/atoms/icon.svelte";
  import { brandingModes } from "../../../.storybook/modes";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import { withLayout } from "../decorators/with-layout";

  const { Story } = defineMeta({
    component: Icon,
    title: "Atoms/Icon",
    // @ts-expect-error ignore typing of decorator
    decorators: [withLayout],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template({ name }: Args<typeof Story>)}
  <Icon name={name ?? "cart"} />
{/snippet}

<Story name="Cart" args={{ name: "cart" }} />
<Story name="Error" args={{ name: "error" }} />
<Story name="Lock" args={{ name: "lock" }} />
<Story name="Success" args={{ name: "success" }} />
<Story name="Chevron Up" args={{ name: "chevron-up" }} />
<Story name="Chevron Down" args={{ name: "chevron-down" }} />
<Story name="Chevron Left" args={{ name: "chevron-left" }} />
<Story name="Chevron Right" args={{ name: "chevron-right" }} />
<Story name="Info" args={{ name: "info" }} />
