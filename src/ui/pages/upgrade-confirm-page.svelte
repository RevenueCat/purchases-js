<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import type { SubscriptionChangeCheckoutStartResponse } from "../../networking/responses/subscription-change-response";
  import type { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import SubscriptionChangeConfirmButton from "../molecules/subscription-change-confirm-button.svelte";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    startData: SubscriptionChangeCheckoutStartResponse;
    confirming: boolean;
    confirmError: string | null;
    onConfirm: () => void;
  }

  const { startData, confirming, confirmError, onConfirm }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const formattedPrice = $derived.by(() => {
    const breakdown = startData.price_breakdown;
    if (!breakdown) {
      return null;
    }
    return $translator.formatPrice(
      breakdown.total_amount_in_micros,
      breakdown.currency,
    );
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

    {#if startData.change_type === "deferred"}
      <div class="rcb-upgrade-section rcb-upgrade-section-label">
        <Typography size="body-small">
          This change will take effect at the end of your current billing
          period. You will not be charged now.
        </Typography>
      </div>
    {/if}
  </div>

  {#if confirmError}
    <Typography size="body-base">{confirmError}</Typography>
  {/if}

  <div class="rcb-upgrade-actions">
    <SubscriptionChangeConfirmButton
      changeType={startData.change_type}
      {formattedPrice}
      {confirming}
      onclick={onConfirm}
    />
  </div>
</div>

<style>
  .rcb-upgrade-checkout {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXXLarge-mobile);
    user-select: none;
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
  }

  @container layout-query-container (width >= 768px) {
    .rcb-upgrade-checkout {
      gap: var(--rc-spacing-gapXXLarge-desktop);
    }

    .rcb-upgrade-details {
      gap: var(--rc-spacing-gapXLarge-desktop);
    }
  }
</style>
