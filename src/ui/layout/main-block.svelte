<script lang="ts">
  import { Theme } from "../theme/theme";
  import type { BrandingAppearance } from "../../entities/branding";
  import type { Snippet } from "svelte";
  import SectionLayout from "./section-layout.svelte";

  type Props = {
    children: Snippet;
    brandingAppearance: BrandingAppearance | null | undefined;
    isInElement: boolean;
  };

  const { children, brandingAppearance, isInElement }: Props = $props();
  const style = $derived(new Theme(brandingAppearance).formStyleVars);
</script>

<div class="rcb-ui-main" class:rcb-ui-main-in-element={isInElement} {style}>
  <SectionLayout location="main-block" {isInElement}>
    {@render children?.()}
  </SectionLayout>
</div>

<style>
  .rcb-ui-main {
    flex: 1;
    display: flex;
    background-color: var(--rc-color-background);
  }

  .rcb-ui-main.rcb-ui-main-in-element {
    flex: 1 1 0%;
  }
</style>
