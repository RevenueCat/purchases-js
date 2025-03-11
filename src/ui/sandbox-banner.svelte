<script lang="ts">
  import { fly } from "svelte/transition";
  import CloseButton from "./close-button.svelte";
  import { Logger } from "../helpers/logger";

  export let style = "";
  export let isInElement = false;

  let showBanner = true;

  function closeBanner() {
    Logger.debugLog("closeBanner");
    showBanner = false;
  }
</script>

{#if showBanner}
  <div
    class="rcb-ui-sandbox-banner"
    {style}
    out:fly={{ y: -100, duration: 300 }}
    class:isInElement
  >
    <span class="rcb-sandbox-banner-text">Sandbox</span>
    <div class="rcb-sandbox-banner-close-button-wrapper">
      <CloseButton on:click={closeBanner} />
    </div>
  </div>
{/if}

<style>
  .rcb-ui-sandbox-banner {
    position: fixed;
    top: 0;
    z-index: 1000002;
    left: 0;
    width: 100%;
    background-color: var(--rc-color-warning);
    color: rgba(0, 0, 0, 1);
    font: var(--rc-text-caption-mobile);
    font-weight: bold;
    text-transform: uppercase;
    padding: var(--rc-spacing-gapSmall-mobile);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .rcb-ui-sandbox-banner.isInElement {
    position: absolute;
  }

  .rcb-sandbox-banner-close-button-wrapper {
    position: absolute;
    right: var(--rc-spacing-gapMedium-mobile);
    top: 50%;
    transform: translateY(-50%);
    color: inherit;
  }

  :global(.rcb-sandbox-banner-close-button-icon) {
    color: black;
    height: var(--rc-text-caption-mobile-font-size);
  }

  @container layout-query-container (width >= 768px) {
    :global(.rcb-sandbox-banner-close-button-icon) {
      height: var(--rc-text-caption-desktop-font-size);
    }

    .rcb-ui-sandbox-banner {
      padding: var(--rc-spacing-gapMedium-desktop);
      font: var(--rc-text-caption-desktop);
      font-weight: bold;
    }

    .rcb-sandbox-banner-close-button-wrapper {
      right: var(--rc-spacing-gapMedium-desktop);
    }
  }
</style>
