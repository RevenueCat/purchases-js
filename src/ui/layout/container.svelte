<script lang="ts">
  import { type Snippet } from "svelte";
  import { Theme } from "../theme/theme";
  import { type BrandingAppearance } from "../../networking/responses/branding-response";

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
    flex-direction: column;
    height: 100vh;
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
  }

  @media screen and (min-width: 768px) {
    .rcb-ui-container {
      flex-direction: row;
    }
  }
</style>
