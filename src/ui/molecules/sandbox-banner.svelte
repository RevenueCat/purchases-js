<script lang="ts">
  import { fly } from "svelte/transition";
  import CloseButton from "./close-button.svelte";
  import { Logger } from "../../helpers/logger";
  import Typography from "../atoms/typography.svelte";

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
    <Typography size="caption-default">
      <span class="rcb-sandbox-text">Sandbox</span>
    </Typography>
    <div
      class="rcb-sandbox-banner-close-button-wrapper"
      style="--arrow-fill-color: black"
    >
      <Typography size="caption-default">
        <CloseButton on:click={closeBanner} />
      </Typography>
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
    color: black;
  }

  .rcb-sandbox-text {
    font-weight: bold;
  }

  @container layout-query-container (width >= 768px) {
    .rcb-ui-sandbox-banner {
      padding: var(--rc-spacing-gapMedium-desktop);
    }

    .rcb-sandbox-banner-close-button-wrapper {
      right: var(--rc-spacing-gapMedium-desktop);
    }
  }
</style>
