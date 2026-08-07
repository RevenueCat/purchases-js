<script lang="ts">
  import { Button } from "@revenuecat/purchases-ui-js";
  import type { SubscriptionChangeCheckoutStartResponse } from "../../networking/responses/subscription-change-response";
  import type { BrandingAppearance } from "../../entities/branding";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    startData: SubscriptionChangeCheckoutStartResponse;
    confirming: boolean;
    confirmError: string | null;
    brandingAppearance?: BrandingAppearance;
    onConfirm: () => void;
  }

  const {
    startData,
    confirming,
    confirmError,
    brandingAppearance = undefined,
    onConfirm,
  }: Props = $props();

  const ctaLabel = $derived(
    startData.change_type === "deferred" ? "Confirm schedule" : "Pay now",
  );

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
    <Button disabled={confirming} onclick={onConfirm} {brandingAppearance}>
      {confirming ? "Confirming…" : ctaLabel}
    </Button>
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
