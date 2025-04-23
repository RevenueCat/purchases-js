<script lang="ts">
  import { Theme } from "../theme/theme";
  import type { BrandingAppearance } from "../../entities/branding";
  import type { Snippet } from "svelte";
  import SectionLayout from "./section-layout.svelte";

  type Props = {
    children: Snippet;
    brandingAppearance: BrandingAppearance | null | undefined;
  };

  const { children, brandingAppearance }: Props = $props();
  const style = $derived(new Theme(brandingAppearance).formStyleVars);
</script>

<div class="rcb-ui-main" {style}>
  <SectionLayout location="main-block">
    {@render children?.()}
  </SectionLayout>
</div>

<style>
  .rcb-ui-main {
    flex: 1;
    display: flex;
    background-color: var(--rc-color-background);
  }
</style>
