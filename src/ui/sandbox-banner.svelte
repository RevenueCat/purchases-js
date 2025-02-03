<script lang="ts">
  import { fly } from "svelte/transition";
  import CloseButton from "./close-button.svelte";
  export let style = "";
  let showBanner = true;

  function closeBanner() {
    console.log("closeBanner");
    showBanner = false;
  }
</script>

{#if showBanner}
  <div
    class="rcb-ui-sandbox-banner"
    {style}
    out:fly={{ y: -100, duration: 300 }}
  >
    <span class="banner-text">Sandbox</span>
    <div class="close-button-wrapper">
      <CloseButton on:click={closeBanner} />
    </div>
  </div>
{/if}

<style>
  .rcb-ui-sandbox-banner {
    position: relative;
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

  .close-button-wrapper {
    position: absolute;
    right: var(--rc-spacing-gapSmall-mobile);
    top: 50%;
    transform: translateY(-50%);
  }

  :global(.close-button-icon) {
    color: black;
    height: var(--rc-text-caption-mobile-font-size);
  }

  @media screen and (min-width: 768px) {
    :global(.close-button-icon) {
      height: var(--rc-text-caption-desktop-font-size);
    }
    .rcb-ui-sandbox-banner {
      padding: var(--rc-spacing-gapMedium-desktop);
      font: var(--rc-text-caption-desktop);
      font-weight: bold;
    }
    .close-button-wrapper {
      right: var(--rc-spacing-gapMedium-desktop);
    }
  }
</style>
