<script lang="ts">
  import { Theme } from "../theme/theme";
  import { onMount } from "svelte";
  import SectionLayout from "./section-layout.svelte";
  import type { BrandingAppearance } from "../../entities/branding";

  export let brandingAppearance: BrandingAppearance | null | undefined =
    undefined;
  let style = new Theme(brandingAppearance).formStyleVars;

  export let body;
  export let header: (() => any) | null = null;

  let showContent = true;
  // This makes the tests fail
  onMount(() => {
    setTimeout(() => (showContent = true), 10);
  });
</script>

<div class="rcb-ui-main" {style}>
  <SectionLayout show={showContent} layoutStyle="" {header} {body} />
</div>

<style>
  .rcb-ui-main {
    flex: 1;
    display: flex;
    background-color: var(--rc-color-background);
  }
</style>
