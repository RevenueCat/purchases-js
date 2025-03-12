<script module>
  import { default as Button } from "../ui/button.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import withLayoutDecorator from "./utils/with-layout-decorator";

  let { Story } = defineMeta({
    component: Button,
    title: "Components/Button",
    // @ts-expect-error ignore typing of decorator
    decorators: [withLayoutDecorator],
    argTypes: {
      intent: {
        control: "radio",
        options: ["primary", undefined],
      },
      children: {
        control: "text",
      },
    },
  });

  const args = {
    intent: "primary" as const,
    disabled: false,
    loading: false,
  };
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template({ ...args }: Args<typeof Story>)}
  <Button {...args}>
    {#snippet children()}
      Click Me
    {/snippet}
  </Button>
{/snippet}

<Story name="Default" {args} />
<Story name="Disabled" args={{ ...args, disabled: true }} />
<Story name="Loading" args={{ ...args, loading: true }} />
