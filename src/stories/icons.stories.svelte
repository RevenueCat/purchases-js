<script module>
  import { default as Icon } from "../ui/components/icon.svelte";
  import { brandingModes } from "../../.storybook/modes";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import { withLayoutDecorator } from "./utils/decorators";

  const { Story } = defineMeta({
    component: Icon,
    title: "Components/Icons",
    // @ts-expect-error ignore typing of decorator
    decorators: [withLayoutDecorator],
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
  <Icon name={name ?? "arrow"} />
{/snippet}

<Story name="Arrow" args={{ name: "arrow" }} />
<Story name="Cart" args={{ name: "cart" }} />
<Story name="Error" args={{ name: "error" }} />
<Story name="Lock" args={{ name: "lock" }} />
<Story name="Success" args={{ name: "success" }} />
