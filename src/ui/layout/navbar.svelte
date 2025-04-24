<script lang="ts">
  import { Theme } from "../theme/theme";
  import type { BrandingAppearance } from "../../entities/branding";
  import type { Snippet } from "svelte";
  import SectionLayout from "./section-layout.svelte";

  type Props = {
    headerContent?: Snippet<[]>;
    bodyContent?: Snippet<[]>;
    brandingAppearance?: BrandingAppearance | null;
  };

  const {
    headerContent,
    bodyContent,
    brandingAppearance = undefined,
  }: Props = $props();

  const style = $derived(new Theme(brandingAppearance).productInfoStyleVars);
</script>

<div class="rcb-ui-navbar" {style}>
  <SectionLayout location="navbar">
    <div class="navbar-header">
      {@render headerContent?.()}
    </div>
    {#if bodyContent}
      <div class="navbar-body" class:rcb-with-header={!!headerContent}>
        {@render bodyContent?.()}
      </div>
    {/if}
  </SectionLayout>
</div>

<style>
  .rcb-ui-navbar {
    width: 100%;
    max-width: none;
    flex-shrink: 0;
    background-color: var(--rc-color-background);
  }

  @container layout-query-container (width < 768px) {
    .navbar-body {
      padding: var(--rc-spacing-outerPadding-mobile);
    }

    .navbar-body.rcb-with-header {
      padding-top: var(--rc-spacing-gapLarge-desktop);
    }
  }

  @container layout-query-container (width >= 768px) {
    .rcb-ui-navbar {
      width: 50vw;
      display: flex;
      justify-content: flex-end;
    }

    .navbar-header {
      padding: var(--rc-spacing-outerPadding-desktop);
      padding-bottom: 0;
    }

    .navbar-body {
      padding: var(--rc-spacing-outerPadding-desktop);
      padding-top: var(--rc-spacing-gapXXLarge-desktop);
    }
  }
</style>
