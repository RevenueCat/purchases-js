<script lang="ts">
  import { Theme } from "../theme/theme";
  import type { BrandingAppearance } from "../../entities/branding";
  import type { Snippet } from "svelte";

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
  <div class="layout-wrapper-outer" style="justify-content: flex-end;">
    <div class="layout-wrapper">
      <div class="layout-content">
        <div class="navbar-header">
          {@render headerContent?.()}
        </div>
        {#if bodyContent}
          <div class="navbar-body" class:rcb-with-header={!!headerContent}>
            {@render bodyContent?.()}
          </div>
        {/if}
      </div>
    </div>
  </div>
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

  .layout-wrapper-outer {
    flex: 1;
    display: flex;
    background-color: var(--rc-color-background);
  }

  .layout-wrapper {
    width: 100%;
  }

  .layout-content {
    box-sizing: border-box;
    background-color: var(--rc-color-background);
    color: var(--rc-color-grey-text-dark);
    display: flex;
    flex-direction: column;
  }

  @container layout-query-container (width < 768px) {
    .layout-wrapper {
      width: 100%;
      min-width: 300px;
      display: flex;
      flex-grow: 1;
    }

    .layout-content {
      flex-grow: 1;
      height: 100%;
    }

    .navbar-body {
      padding: var(--rc-spacing-outerPadding-mobile);
    }

    .navbar-body.rcb-with-header {
      padding-top: 0;
    }
  }

  @container layout-query-container (width >= 768px) {
    .layout-wrapper {
      min-height: 100vh;
      flex-basis: 600px;
    }

    .layout-content {
      padding: var(--rc-spacing-outerPadding-desktop);
    }
  }
</style>
