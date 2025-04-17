<script lang="ts">
  import { Theme } from "../theme/theme";
  import NavBarHeader from "./navbar-header.svelte";
  import type { BrandingAppearance } from "../../entities/branding";

  export let brandingAppearance: BrandingAppearance | null | undefined =
    undefined;
  $: style = new Theme(brandingAppearance).productInfoStyleVars;

  export let headerContent;
  export let bodyContent: () => any;
</script>

<div class="rcb-ui-navbar" {style}>
  <div class="layout-wrapper-outer" style="justify-content: flex-end;">
    <div class="layout-wrapper">
      <div class="layout-content">
        <NavBarHeader>
          {@render headerContent?.()}
        </NavBarHeader>
        <div class="rcb-ui-navbar-body">
          {@render bodyContent?.()}
        </div>
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
    padding: var(--rc-spacing-outerPadding-mobile);
    padding-top: var(--rc-spacing-outerPaddingTop-mobile);
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
  }

  @container layout-query-container (width >= 768px) {
    .layout-wrapper {
      min-height: 100vh;
      flex-basis: 544px;
    }

    .layout-content {
      padding: var(--rc-spacing-outerPadding-desktop);
      padding-top: var(--rc-spacing-outerPaddingTop-desktop);
    }
  }
</style>
