<script>
  import Localized from "./localization/localized.svelte";
  import { LocalizationKeys } from "./localization/supportedLanguages";
</script>

<p class="footer-caption">
  <Localized key={LocalizationKeys.StateNeedsPaymentInfoPaymentStepTitle} />
</p>

<style>
  .footer-caption {
    font: var(--rc-text-caption-mobile);
    color: var(--rc-color-grey-text-light);
    text-align: center;
    font-weight: 500;
    margin: 0;
  }

  @container layout-query-container (width > 768px) {
    .footer-caption {
      font: var(--rc-text-caption-desktop);
    }
  }
</style>
