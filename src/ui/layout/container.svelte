<script lang="ts">
  import { type Snippet } from "svelte";
  import { Theme } from "../theme/theme";

  import type { BrandingAppearance } from "../../entities/branding";

  export let brandingAppearance: BrandingAppearance | null | undefined =
    undefined;
  export let isInElement: boolean = false;

  // Make styles reactive to changes in brandingAppearance
  $: textStyle = new Theme(brandingAppearance).textStyleVars;
  $: spacingStyle = new Theme(brandingAppearance).spacingStyleVars;
  $: style = [textStyle, spacingStyle].join("; ");

  export let children: Snippet;
</script>

<div
  class="rcb-ui-container"
  class:fullscreen={!isInElement}
  class:inside={isInElement}
  {style}
>
  {@render children?.()}
</div>

<style>
  .rcb-ui-container {
    display: flex;
    flex-direction: column;
    inset: 0;
    color-scheme: none;
    font-size: 16px;
    line-height: 1.5em;
    font-weight: 400;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      avenir next,
      avenir,
      segoe ui,
      helvetica neue,
      helvetica,
      Cantarell,
      Ubuntu,
      roboto,
      noto,
      arial,
      sans-serif;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .rcb-ui-container.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overscroll-behavior: none;
    z-index: 1000001;
  }

  .rcb-ui-container.inside {
    position: relative;
    width: 100%;
    z-index: unset;
    height: 100%;
    top: 0;
    left: 0;
  }
</style>
