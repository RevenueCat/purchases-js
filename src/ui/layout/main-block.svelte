<script lang="ts">
  import { Theme } from "../theme/theme";
  import { onMount } from "svelte";
  import type { BrandingAppearance } from "../../entities/branding";
  import type { Snippet } from "svelte";
  import { fade } from "svelte/transition";

  export let children: Snippet;
  export let brandingAppearance: BrandingAppearance | null | undefined =
    undefined;
  // Make style reactive to changes in brandingAppearance
  $: style = new Theme(brandingAppearance).formStyleVars;

  let showContent = true;
  // This makes the tests fail
  onMount(() => {
    setTimeout(() => (showContent = true), 10);
  });
</script>

<div class="rcb-ui-main" {style}>
  <div class="layout-wrapper-outer" style="">
    {#if showContent}
      <div class="layout-wrapper">
        <div
          class="layout-content"
          transition:fade={{ duration: 500, delay: 50 }}
        >
          {@render children?.()}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .rcb-ui-main {
    flex: 1;
    display: flex;
    background-color: var(--rc-color-background);
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
      flex-basis: 600px;
    }

    .layout-content {
      padding: var(--rc-spacing-outerPadding-desktop);
    }
  }
</style>
