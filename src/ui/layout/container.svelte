<script lang="ts">
  import { type Snippet } from "svelte";
  import { Theme } from "../theme/theme";

  import type { BrandingAppearance } from "../../entities/branding";

  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  let textStyle = new Theme(brandingAppearance).textStyleVars;
  let spacingStyle = new Theme(brandingAppearance).spacingStyleVars;
  let style = [textStyle, spacingStyle].join("; ");

  export let children: Snippet;
</script>

<div class="rcb-ui-container" {style}>
  {@render children?.()}
</div>

<style>
  .rcb-ui-container {
    display: flex;
    z-index: 1000001;
    flex-direction: column;
    position: absolute;
    top: 0;
    left: 0;
    inset: 0;
    width: 100%;
    min-height: 100%;
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
    overflow: auto;
  }
</style>
