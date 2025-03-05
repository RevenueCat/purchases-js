<script lang="ts">
  import Localized from "./localization/localized.svelte";
  import { LocalizationKeys } from "./localization/supportedLanguages";

  export let termsInfo: string | null = null;
  export let trialInfo: string | null = null;
</script>

<div class="footer-caption-container">
  {#if termsInfo}
    <p class="footer-caption">
      {termsInfo}
    </p>
  {/if}
  {#if trialInfo}
    <p class="footer-caption">
      {trialInfo}
    </p>
  {/if}
  <p class="footer-caption">
    <Localized key={LocalizationKeys.StateNeedsPaymentInfoPaymentStepTitle} />
  </p>
</div>

<style>
  .footer-caption-container {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXLarge-mobile);
  }

  .footer-caption {
    font: var(--rc-text-caption-mobile);
    color: var(--rc-color-grey-text-light);
    text-align: center;
    font-weight: 500;
    margin: 0;
  }

  @container layout-query-container (width >= 768px) {
    .footer-caption {
      font: var(--rc-text-caption-desktop);
    }

    .footer-caption-container {
      gap: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
