<script lang="ts">
  import { Theme } from "../theme/theme";
  import NavBarHeader from "../navbar-header.svelte";
  import SectionLayout from "./section-layout.svelte";
  import type { BrandingAppearance } from "../../entities/branding";

  export let brandingAppearance: BrandingAppearance | null | undefined =
    undefined;
  let style = new Theme(brandingAppearance).productInfoStyleVars;

  export let headerContent;
  export let bodyContent: (expanded: boolean) => any;

  let expanded = false;

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<div class="rcb-ui-navbar" {style}>
  <SectionLayout layoutStyle="justify-content: flex-end;">
    {#snippet header()}
      <NavBarHeader {expanded} toggle={toggleExpanded}>
        {@render headerContent?.()}
      </NavBarHeader>
    {/snippet}
    {#snippet body()}
      {@render bodyContent?.(expanded)}
    {/snippet}
  </SectionLayout>
</div>

<style>
  .rcb-ui-navbar {
    width: 100%;
    max-width: none;
    flex-shrink: 0;
    background-color: var(--rc-color-background);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-ui-navbar {
      width: 50vw;
      display: flex;
      justify-content: flex-end;
    }
  }
</style>
