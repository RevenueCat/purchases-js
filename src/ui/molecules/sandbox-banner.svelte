<script lang="ts">
  import { fly } from "svelte/transition";
  import CloseButton from "./close-button.svelte";
  import { Logger } from "../../helpers/logger";
  import Typography from "../atoms/typography.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import IconOpenExternal from "../atoms/icons/icon-open-external.svelte";
  export let style = "";
  export let isInElement = false;
  export let brandingInfo: BrandingInfoResponse | null = null;

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
    <div class="rcb-sandbox-banner-spacer"></div>
    <div class="rcb-sandbox-banner-title-wrapper">
      <Typography size="caption-default">
        <span class="rcb-sandbox-text">SANDBOX</span>
      </Typography>
    </div>

    <div
      class="rcb-sandbox-banner-actions-wrapper"
      style="--arrow-fill-color: black"
    >
      {#if brandingInfo?.sandbox_configuration}
        <a
          class="rcb-ui-sandbox-banner-link"
          href={brandingInfo.sandbox_configuration.checkout_feedback_form_url}
          target="_blank"
        >
          <IconOpenExternal />
          <Typography size="caption-link"
            ><span class="rcb-sandbox-text">Share feedback</span></Typography
          >
        </a>
      {/if}
      <CloseButton on:click={closeBanner} />
    </div>
  </div>
{/if}

<style>
  .rcb-ui-sandbox-banner {
    position: static;
    background-color: var(--rc-color-warning);
    color: black;
    padding: var(--rc-spacing-gapMedium-mobile) 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 24px;
  }

  .rcb-sandbox-text {
    font-weight: bold;
    color: black;
    line-height: 2;
  }

  .rcb-sandbox-banner-spacer {
    flex: 1;
  }

  .rcb-sandbox-banner-title-wrapper {
    flex: 0;
    text-align: center;
  }

  @media (max-width: 768px) {
    .rcb-sandbox-banner-spacer {
      flex: 0;
    }

    .rcb-sandbox-banner-title-wrapper {
      padding-left: var(--rc-spacing-gapXXLarge-mobile);
    }
  }

  .rcb-sandbox-banner-actions-wrapper {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .rcb-ui-sandbox-banner-link {
    display: flex;
    align-items: center;
    gap: var(--rc-spacing-gapSmall-mobile);
    line-height: 12px;
  }
</style>
