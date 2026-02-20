<script lang="ts">
  export let productIdentifier: string;
  export let productType: string;
  export let basePrice: string;
  export let freeTrialPeriod: string | undefined = undefined;
  export let introPriceFormatted: string | undefined = undefined;
  export let onValidPurchase: () => void;
  export let onFailedPurchase: () => void;
  export let onCancel: () => void;

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }
</script>

<!--svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions-->
<div class="rc-simulated-store-modal-overlay" on:click={handleOverlayClick}>
  <div class="rc-simulated-store-modal">
    <div class="rc-simulated-store-modal-content">
      <h2 class="rc-simulated-store-modal-title">Test Store Purchase</h2>

      <div class="rc-simulated-store-modal-details">
        <div>
          <p><strong>Product:</strong> {productIdentifier}</p>
          <p><strong>Type:</strong> {productType}</p>
          <p><strong>Price:</strong> {basePrice}</p>
          {#if freeTrialPeriod}
            <p><strong>Free Trial:</strong> {freeTrialPeriod}</p>
          {/if}
          {#if introPriceFormatted}
            <p><strong>Intro Price:</strong> {introPriceFormatted}</p>
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
    /** One more than the paywall */
    z-index: 1000002;
  }

  .rc-simulated-store-modal {
    background: white;
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

  .rc-simulated-store-modal-title {
    margin: 0 0 20px 0;
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }

  .rc-simulated-store-modal-details {
    margin-bottom: 24px;
  }

  .rc-simulated-store-modal-details p {
    margin: 8px 0;
    color: #666;
    line-height: 1.5;
  }

  .rc-simulated-store-modal-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rc-simulated-store-modal-button {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .rc-simulated-store-modal-button-primary {
    background-color: #007aff;
    color: white;
  }

  .rc-simulated-store-modal-button-primary:hover {
    background-color: #0056cc;
  }

  .rc-simulated-store-modal-button-secondary {
    background-color: #ff3b30;
    color: white;
  }

  .rc-simulated-store-modal-button-secondary:hover {
    background-color: #cc2e24;
  }

  .rc-simulated-store-modal-button-cancel {
    background-color: #f2f2f7;
    color: #333;
  }

  .rc-simulated-store-modal-button-cancel:hover {
    background-color: #e5e5ea;
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
