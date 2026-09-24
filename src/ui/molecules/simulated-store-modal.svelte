<script lang="ts">
  import AppLogo from "../atoms/app-logo.svelte";
  import AppWordmark from "../atoms/app-wordmark.svelte";
  import { buildBrandingSources } from "../../helpers/build-branding-sources";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { toSimulatedStoreModalStyleVars } from "../theme/simulated-store-modal";

  export let productIdentifier: string;
  export let productTitle: string | undefined = undefined;
  export let productType: string;
  export let basePrice: string;
  export let freeTrialPeriod: string | undefined = undefined;
  export let introPriceFormatted: string | undefined = undefined;
  export let discountFormatted: string | undefined = undefined;
  export let brandingInfo: BrandingInfoResponse | null = null;
  export let onValidPurchase: () => void;
  export let onFailedPurchase: () => void;
  export let onCancel: () => void;

  $: brandingSources = buildBrandingSources(brandingInfo);
  $: appName = brandingInfo?.app_name?.trim() || null;
  $: hasBrandingHeader =
    brandingSources.wordmarkSrc !== null ||
    brandingSources.src !== null ||
    appName !== null;
  $: styleVars = toSimulatedStoreModalStyleVars(brandingInfo?.appearance);
  $: isBranded = hasBrandingHeader || styleVars !== "";
  $: showProductIdentifier =
    !!productTitle && productTitle !== productIdentifier;

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }
</script>

<!--svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
<div class="rc-simulated-store-modal-overlay" on:click={handleOverlayClick}>
  <div
    class="rc-simulated-store-modal"
    class:rc-simulated-store-modal-branded={isBranded}
    style={styleVars}
  >
    <div class="rc-simulated-store-modal-content">
      {#if hasBrandingHeader}
        <div class="rc-simulated-store-modal-header">
          {#if brandingSources.wordmarkSrc}
            <AppWordmark
              src={brandingSources.wordmarkSrc}
              srcWebp={brandingSources.wordmarkSrcWebp}
            />
          {:else}
            {#if brandingSources.src}
              <AppLogo
                src={brandingSources.src}
                srcWebp={brandingSources.srcWebp}
              />
            {/if}
            {#if appName}
              <span class="rc-simulated-store-modal-app-name">{appName}</span>
            {/if}
          {/if}
        </div>
      {/if}

      <h2 class="rc-simulated-store-modal-title">Test Store Purchase</h2>
      {#if isBranded}
        <p class="rc-simulated-store-modal-subtitle">
          This is a test purchase. You won't be charged.
        </p>
      {/if}

      <div class="rc-simulated-store-modal-details">
        <div>
          <p><strong>Product:</strong> {productTitle || productIdentifier}</p>
          {#if showProductIdentifier}
            <p class="rc-simulated-store-modal-product-identifier">
              {productIdentifier}
            </p>
          {/if}
          <p><strong>Type:</strong> {productType}</p>
          <p><strong>Price:</strong> {basePrice}</p>
          {#if freeTrialPeriod}
            <p><strong>Free Trial:</strong> {freeTrialPeriod}</p>
          {/if}
          {#if introPriceFormatted}
            <p><strong>Intro Price:</strong> {introPriceFormatted}</p>
          {/if}
          {#if discountFormatted}
            <p><strong>Discount Price:</strong> {discountFormatted}</p>
          {/if}
        </div>
      </div>

      <div class="rc-simulated-store-modal-buttons">
        <button
          type="button"
          class="rc-simulated-store-modal-button rc-simulated-store-modal-button-primary"
          on:click={onValidPurchase}
        >
          Test valid purchase
        </button>

        <button
          type="button"
          class="rc-simulated-store-modal-button rc-simulated-store-modal-button-secondary"
          on:click={onFailedPurchase}
        >
          Test failed purchase
        </button>

        <button
          type="button"
          class="rc-simulated-store-modal-button rc-simulated-store-modal-button-cancel"
          on:click={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .rc-simulated-store-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      avenir next,
      avenir,
      segoe ui,
      helvetica neue,
      helvetica,
      Cantarell,
      Ubuntu,
      roboto,
      noto,
      arial,
      sans-serif;
    /** One more than the paywall */
    z-index: 1000002;
  }

  .rc-simulated-store-modal {
    background: var(--rc-simulated-store-card-bg, white);
    border-radius: 8px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 90%;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .rc-simulated-store-modal-content {
    padding: 24px;
  }

  .rc-simulated-store-modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 32px;
    margin-bottom: 20px;
  }

  .rc-simulated-store-modal-app-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--rc-simulated-store-card-text, #333);
  }

  .rc-simulated-store-modal-title {
    margin: 0 0 20px 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--rc-simulated-store-card-text, #333);
  }

  .rc-simulated-store-modal-subtitle {
    margin: -12px 0 20px 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--rc-simulated-store-card-text-secondary, #666);
  }

  .rc-simulated-store-modal-details {
    margin-bottom: 24px;
  }

  .rc-simulated-store-modal-branded .rc-simulated-store-modal-details {
    padding: 8px 16px;
    border-radius: var(--rc-simulated-store-details-radius, 8px);
    background-color: var(--rc-simulated-store-details-bg, #eff3fa);
  }

  .rc-simulated-store-modal-details p {
    margin: 8px 0;
    color: var(--rc-simulated-store-details-text-secondary, #666);
    line-height: 1.5;
  }

  .rc-simulated-store-modal-details strong {
    color: var(--rc-simulated-store-details-text, inherit);
  }

  .rc-simulated-store-modal-details
    .rc-simulated-store-modal-product-identifier {
    margin-top: -8px;
    font-size: 13px;
  }

  .rc-simulated-store-modal-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rc-simulated-store-modal-button {
    padding: 12px 24px;
    border: none;
    border-radius: var(--rc-simulated-store-button-radius, 6px);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .rc-simulated-store-modal-button-primary {
    background-color: var(--rc-simulated-store-primary, #007aff);
    color: var(--rc-simulated-store-primary-text, white);
  }

  .rc-simulated-store-modal-button-primary:hover {
    background-color: var(--rc-simulated-store-primary-hover, #0056cc);
  }

  .rc-simulated-store-modal-button-secondary {
    background-color: var(--rc-simulated-store-error, #ff3b30);
    color: var(--rc-simulated-store-error-text, white);
  }

  .rc-simulated-store-modal-button-secondary:hover {
    background-color: var(--rc-simulated-store-error-hover, #cc2e24);
  }

  .rc-simulated-store-modal-button-cancel {
    background-color: var(--rc-simulated-store-cancel-bg, #f2f2f7);
    color: var(--rc-simulated-store-card-text, #333);
  }

  .rc-simulated-store-modal-button-cancel:hover {
    background-color: var(--rc-simulated-store-cancel-hover, #e5e5ea);
  }

  /* Mobile responsive - full screen on small screens */
  @media (max-width: 768px) {
    .rc-simulated-store-modal-overlay {
      padding: 0;
    }

    .rc-simulated-store-modal {
      width: 100%;
      height: 100%;
      border-radius: 0;
      max-width: none;
      max-height: none;
    }

    .rc-simulated-store-modal-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }
</style>
