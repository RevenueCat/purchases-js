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
    color: var(--rc-color-text-secondary);
    margin: var(--rc-spacing-gapSmall-desktop);
    text-align: center;
    font-weight: 400;
  }

  @media screen and (min-width: 768px) {
    .footer-caption {
      font: var(--rc-text-caption-desktop);
    }
  }
</style>
