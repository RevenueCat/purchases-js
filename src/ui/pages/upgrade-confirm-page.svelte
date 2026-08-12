<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import { Button } from "@revenuecat/purchases-ui-js";
  import type { SubscriptionChangeCheckoutStartResponse } from "../../networking/responses/subscription-change-response";
  import type { BrandingAppearance } from "../../entities/branding";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
  import type { PurchaseOption } from "../../entities/offerings";
  import type { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import SecureCheckoutRc from "../molecules/secure-checkout-rc.svelte";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    startData: SubscriptionChangeCheckoutStartResponse;
    confirming: boolean;
    confirmError: string | null;
    brandingAppearance?: BrandingAppearance;
    brandingInfo?: BrandingInfoResponse | null;
    purchaseOption?: PurchaseOption | null;
    termsAndConditionsUrl?: string | null;
    onConfirm: () => void;
  }

  const {
    startData,
    confirming,
    confirmError,
    brandingAppearance = undefined,
    brandingInfo = null,
    purchaseOption = null,
    termsAndConditionsUrl = null,
    onConfirm,
  }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const isDeferred = $derived(startData.change_type === "deferred");

  const pageTitle = "Confirm payment";
  const pageSubtitle = $derived(
    isDeferred
      ? "Review your payment details and schedule change"
      : "Review your payment details and confirm upgrade",
  );

  const dueAmountLabel = $derived.by(() => {
    const breakdown = startData.price_breakdown;
    if (!breakdown) {
      return null;
    }
    return $translator.formatPrice(
      breakdown.total_amount_in_micros,
      breakdown.currency,
    );
  });

  const ctaLabel = $derived.by(() => {
    if (confirming) {
      return "Confirming…";
    }
    if (isDeferred) {
      return "Confirm schedule";
    }
    return dueAmountLabel
      ? `Confirm upgrade ∙ ${dueAmountLabel}`
      : "Confirm upgrade";
  });

  const paymentMethodLabel = $derived.by(() => {
    const paymentMethod = startData.payment_method;
    if (!paymentMethod) {
      return null;
    }
    const brandOrType = paymentMethod.brand ?? paymentMethod.type;
    return paymentMethod.last_4
      ? `${brandOrType} •••• ${paymentMethod.last_4}`
      : brandOrType;
  });

  const billingAddressLabel = $derived.by(() => {
    const address = startData.billing_address;
    if (!address) {
      return null;
    }
    return (
      [address.postal_code, address.country_code].filter(Boolean).join(", ") ||
      "On file"
    );
  });
</script>

<div class="rcb-upgrade-checkout">
  <div class="rcb-upgrade-header">
    <div class="rcb-upgrade-header-title">
      <Typography size="heading-lg" branded>{pageTitle}</Typography>
    </div>
    <div class="rcb-upgrade-header-subtitle">
      <Typography size="body-base">{pageSubtitle}</Typography>
    </div>
  </div>

  <div class="rcb-upgrade-details">
    <div class="rcb-upgrade-section">
      <div class="rcb-upgrade-section-label">
        <Typography size="body-small">Email</Typography>
      </div>
      <Typography size="body-base">{startData.email}</Typography>
    </div>

    {#if paymentMethodLabel}
      <div class="rcb-upgrade-section">
        <div class="rcb-upgrade-section-label">
          <Typography size="body-small">Payment method</Typography>
        </div>
        <Typography size="body-base">{paymentMethodLabel}</Typography>
      </div>
    {/if}

    {#if billingAddressLabel}
      <div class="rcb-upgrade-section">
        <div class="rcb-upgrade-section-label">
          <Typography size="body-small">Billing address</Typography>
        </div>
        <Typography size="body-base">{billingAddressLabel}</Typography>
      </div>
    {/if}
  </div>

  {#if confirmError}
    <Typography size="body-base">{confirmError}</Typography>
  {/if}

  <div class="rcb-upgrade-actions">
    <Button disabled={confirming} onclick={onConfirm} {brandingAppearance}>
      {ctaLabel}
    </Button>

    <SecureCheckoutRc {brandingInfo} {purchaseOption} {termsAndConditionsUrl} />
  </div>
</div>

<style>
  .rcb-upgrade-checkout {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXXLarge-mobile);
    user-select: none;
  }

  .rcb-upgrade-header {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-upgrade-header-title {
    color: var(--rc-color-grey-text-dark);
  }

  .rcb-upgrade-header-subtitle {
    color: var(--rc-color-grey-text-light);
  }

  .rcb-upgrade-details {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXLarge-mobile);
  }

  .rcb-upgrade-section {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  .rcb-upgrade-section-label {
    color: var(--rc-color-grey-text-light);
  }

  .rcb-upgrade-actions {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXLarge-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-upgrade-checkout {
      gap: var(--rc-spacing-gapXXLarge-desktop);
    }

    .rcb-upgrade-header {
      gap: var(--rc-spacing-gapMedium-desktop);
    }

    .rcb-upgrade-details {
      gap: var(--rc-spacing-gapXLarge-desktop);
    }

    .rcb-upgrade-actions {
      gap: var(--rc-spacing-gapXLarge-desktop);
    }
  }
</style>
