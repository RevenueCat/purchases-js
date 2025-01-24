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
    font-family: -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu,
      Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  @media screen and (min-width: 768px) {
    .rcb-ui-container {
      flex-direction: row;
    }
  }
</style>
