<script lang="ts">
  import { type BrandingAppearance } from "../../networking/responses/branding-response";
  import { Theme } from "../theme/theme";
  import NavBarHeader from "../navbar-header.svelte";
  import { onMount } from "svelte";
  import SectionLayout from "./section-layout.svelte";

  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  let style = new Theme(brandingAppearance).productInfoStyleVars;

  export let headerContent;
  export let bodyContent: (expanded: boolean) => any;

  let expanded = false;
  let showContent = false;
  onMount(() => {
    setTimeout(() => (showContent = true), 10);
  });

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<div class="rcb-ui-navbar" {style}>
  <SectionLayout show={showContent} layoutStyle="justify-content: flex-end;">
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
