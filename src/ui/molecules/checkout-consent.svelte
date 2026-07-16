<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
  import type { PurchaseOption } from "../../entities/offerings";
  import {
    buildCheckoutDisclosureContent,
    isSubscriptionOption,
  } from "../../helpers/checkout-disclosure-helper";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import Localized from "../localization/localized.svelte";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    brandingInfo: BrandingInfoResponse | null;
    purchaseOption: PurchaseOption | null;
    termsAndConditionsUrl?: string | null;
    checked?: boolean;
  }

  let {
    brandingInfo,
    purchaseOption,
    termsAndConditionsUrl = null,
    checked = $bindable(false),
  }: Props = $props();

  const translator = getContext<Writable<Translator>>(translatorContextKey);

  const checkboxId = `rc-checkout-consent-${Math.random().toString(36).slice(2, 10)}`;
  const disclosureId = `${checkboxId}-disclosure`;

  // Consent is subscription-only; OTP uses the footer helper path instead.
  const disclosure = $derived(
    isSubscriptionOption(purchaseOption)
      ? buildCheckoutDisclosureContent({
          brandingInfo,
          purchaseOption,
          translator: $translator,
        })
      : { disclosureText: null },
  );

  function handleChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    checked = target.checked;
  }
</script>

{#if disclosure.disclosureText}
  <div class="rc-checkout-consent" data-testid="checkout-consent">
    <input
      id={checkboxId}
      class="rc-checkout-consent-checkbox"
      type="checkbox"
      {checked}
      onchange={handleChange}
      aria-describedby={disclosureId}
      data-testid="checkout-consent-checkbox"
    />
    <label class="rc-checkout-consent-label" for={checkboxId}>
      <Typography size="caption-default">
        <span id={disclosureId} data-testid="checkout-consent-disclosure">
          {disclosure.disclosureText}
        </span>
        {#if termsAndConditionsUrl}
          <a
            class="rc-checkout-consent-terms-link"
            href={termsAndConditionsUrl}
            rel="noopener noreferrer"
            target="_blank"
            data-testid="checkout-consent-terms-link"
            onclick={(e) => e.stopPropagation()}
          >
            <Localized key={LocalizationKeys.PaymentEntryPageTermsLinkLabel} />
          </a>
        {/if}
      </Typography>
    </label>
  </div>
{/if}

<style>
  .rc-checkout-consent {
    display: flex;
    align-items: flex-start;
    gap: var(--rc-spacing-gapMedium-mobile);
    margin-bottom: var(--rc-spacing-gapLarge-mobile);
    text-align: start;
  }

  .rc-checkout-consent-checkbox {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.1rem;
    cursor: pointer;
    accent-color: var(--rc-color-primary);
  }

  .rc-checkout-consent-checkbox:focus-visible {
    outline: 2px solid var(--rc-color-primary);
    outline-offset: 2px;
  }

  .rc-checkout-consent-label {
    flex: 1;
    cursor: pointer;
    color: var(--rc-color-grey-text-light);
    min-height: 1.25rem;
  }

  .rc-checkout-consent-terms-link {
    color: inherit;
    margin-inline-start: 0.35em;
    text-decoration: underline;
  }

  @container layout-query-container (width >= 768px) {
    .rc-checkout-consent {
      gap: var(--rc-spacing-gapMedium-desktop);
      margin-bottom: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
