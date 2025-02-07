<script module>
  import { default as ButtonComponent } from "../ui/button.svelte";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { toProductInfoStyleVar } from "../ui/theme/utils";
  import { colorfulBrandingAppearance } from "./fixtures";
  import { Theme } from "../ui/theme/theme";
  const defaultArgs = {};

  let generateStyle = (appearance: any) => {
    let textStyle = new Theme(appearance).textStyleVars;
    let spacingStyle = new Theme(appearance).spacingStyleVars;
    let storyStyle = toProductInfoStyleVar(appearance);

    return [textStyle, spacingStyle, storyStyle].join("; ");
  };

  let defaultStyle = generateStyle(colorfulBrandingAppearance);

  let { Story } = defineMeta({
    title: "Components",
    args: defaultArgs,
    parameters: {},
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template({ component, children, style = defaultStyle, ...args }: any)}
  <div {style} class="story-container">
    <svelte:component this={component} {...args}>
      {#if children}
        {children}
      {/if}
    </svelte:component>
  </div>
{/snippet}

<Story
  name="Button (Dark, White text, Primary)"
  args={{
    component: ButtonComponent,
    children: "Click me",
    intent: "primary",
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>

<Story
  name="Button (Light, Black text, Pill, Primary)"
  args={{
    component: ButtonComponent,
    children: "Click me",
    intent: "primary",
    style: generateStyle({
      shapes: "pill",
      color_form_bg: "#313131", // dark grey
      color_error: "#E79462", // orange
      color_product_info_bg: "#ffffff", // white
      color_buttons_primary: "#EBE3F9", // light purple
      color_accent: "#99BB37", // green
      color_page_bg: "#ffffff", // white
      font: "sans-serif",
      show_product_description: true,
    }),
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

<style>
  .story-container {
    margin: 0 5vw;
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
</style>
