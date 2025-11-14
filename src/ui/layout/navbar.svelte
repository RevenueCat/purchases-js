<script lang="ts">
  import { Theme } from "../theme/theme";
  import type { BrandingAppearance } from "../../entities/branding";
  import type { Snippet } from "svelte";
  import SectionLayout from "./section-layout.svelte";

  type Props = {
    headerContent?: Snippet<[]>;
    bodyContent?: Snippet<[]>;
    brandingAppearance?: BrandingAppearance | null;
    isPaddle?: boolean;
  };

  const {
    headerContent,
    bodyContent,
    brandingAppearance = undefined,
    isPaddle = false,
  }: Props = $props();

  const style = $derived(
    new Theme(brandingAppearance).productInfoStyleVars(isPaddle),
  );
</script>

<div class="rcb-ui-navbar" {style}>
  <SectionLayout location="navbar">
    <div class="navbar-header">
      {@render headerContent?.()}
    </div>
    {#if bodyContent}
      <div class="navbar-body">
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
      padding-left: var(--rc-spacing-outerPadding-mobile);
      padding-right: var(--rc-spacing-outerPadding-mobile);
    }
  }

  @container layout-query-container (width >= 768px) {
    .rcb-ui-navbar {
      width: 50vw;
      display: flex;
      justify-content: flex-end;
    }

    .navbar-header {
      padding-left: var(--rc-spacing-outerPadding-desktop);
      padding-right: var(--rc-spacing-outerPadding-desktop);
    }

    .navbar-body {
      padding-left: var(--rc-spacing-outerPadding-desktop);
      padding-right: var(--rc-spacing-outerPadding-desktop);
    }
  }
</style>
