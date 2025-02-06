<script module>
  import { default as ButtonComponent } from "../ui/button.svelte";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { toProductInfoStyleVar } from "../ui/theme/utils";
  import { colorfulBrandingAppearance } from "./fixtures";
  import { Theme } from "../ui/theme/theme";
  const defaultArgs = {};

  let textStyle = new Theme(colorfulBrandingAppearance).textStyleVars;
  let spacingStyle = new Theme(colorfulBrandingAppearance).spacingStyleVars;
  let storyStyle = toProductInfoStyleVar(colorfulBrandingAppearance);
  let style = [textStyle, spacingStyle, storyStyle].join("; ");

  let { Story } = defineMeta({
    title: "Components",
    args: defaultArgs,
    parameters: {},
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template({ component, children, ...args }: any)}
  <div {style} class="story-container">
    <svelte:component this={component} {...args}>
      {#if children}
        {children}
      {/if}
    </svelte:component>
  </div>
{/snippet}

<Story
  name="Button (Primary)"
  args={{
    component: ButtonComponent,
    children: "Click me",
    intent: "primary",
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>

<Story
  name="Button (Primary disabled)"
  args={{
    component: ButtonComponent,
    children: "Click me",
    intent: "primary",
    disabled: true,
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>

<Story
  name="Button (Secondary)"
  args={{
    component: ButtonComponent,
    children: "Click me",
    intent: "secondary",
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>

<Story
  name="Button (Secondary disabled)"
  args={{
    component: ButtonComponent,
    children: "Click me",
    intent: "secondary",
    disabled: true,
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>

<style>
  .story-container {
    margin: 0 5vw;
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
</style>
