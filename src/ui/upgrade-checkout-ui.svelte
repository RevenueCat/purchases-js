<script lang="ts">
  import { onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { Button } from "@revenuecat/purchases-ui-js";
  import type { BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { SubscriptionChangeCheckoutStartResponse } from "../networking/responses/subscription-change-response";
  import type { ProductChangeResult } from "../entities/product-change-params";
  import { ProductChangeOperationHelper } from "../helpers/product-change-operation-helper";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../helpers/purchase-operation-helper";
  import Template from "./layout/template.svelte";
  import BrandingHeader from "./molecules/branding-header.svelte";
  import Typography from "./atoms/typography.svelte";
  import UpgradeProductInfo from "./organisms/upgrade-product-info.svelte";
  import { Translator } from "./localization/translator";
  import { translatorContextKey } from "./localization/constants";

  interface Props {
    newProductId: string;
    subscriptionId?: string;
    productIdentifier?: string;
    subscriberToken: string;
    brandingInfo: BrandingInfoResponse | null;
    isInElement: boolean;
    isSandbox: boolean;
    productChangeOperationHelper: ProductChangeOperationHelper;
    onFinished: (result: ProductChangeResult) => void;
    onError: (error: PurchaseFlowError) => void;
    onClose: (() => void) | undefined;
  }

  const {
    newProductId,
    subscriptionId,
    productIdentifier,
    subscriberToken,
    brandingInfo,
    isInElement,
    isSandbox,
    productChangeOperationHelper,
    onFinished,
    onError,
    onClose,
  }: Props = $props();

  let loading = $state(true);
  let confirming = $state(false);
  let startData = $state<SubscriptionChangeCheckoutStartResponse | null>(null);
  let loadError = $state<string | null>(null);

  const brandingAppearance = $derived(brandingInfo?.appearance ?? undefined);

  const translatorStore = writable(new Translator());
  setContext(translatorContextKey, translatorStore);

  onMount(async () => {
    try {
      startData = await productChangeOperationHelper.start(
        newProductId,
        subscriptionId,
        productIdentifier,
        subscriberToken,
      );
    } catch (e) {
      const error =
        e instanceof PurchaseFlowError
          ? e
          : new PurchaseFlowError(
              PurchaseFlowErrorCode.ErrorSettingUpPurchase,
              "Failed to load upgrade checkout.",
              e instanceof Error ? e.message : String(e),
            );
      loadError = error.message;
      onError(error);
    } finally {
      loading = false;
    }
  });

  async function handleConfirm() {
    if (!startData || confirming) {
      return;
    }
    confirming = true;
    loadError = null;
    try {
      const result =
        await productChangeOperationHelper.confirm(subscriberToken);
      onFinished(result);
    } catch (e) {
      const error =
        e instanceof PurchaseFlowError
          ? e
          : new PurchaseFlowError(
              PurchaseFlowErrorCode.ErrorChargingPayment,
              "Failed to confirm product change.",
              e instanceof Error ? e.message : String(e),
            );
      loadError = error.message;
      onError(error);
    } finally {
      confirming = false;
    }
  }

  const ctaLabel = $derived(
    startData?.change_type === "deferred" ? "Confirm schedule" : "Pay now",
  );

  const paymentMethodLabel = $derived.by(() => {
    const paymentMethod = startData?.payment_method;
    if (!paymentMethod) {
      return null;
    }
    const brandOrType = paymentMethod.brand ?? paymentMethod.type;
    return paymentMethod.last_4
      ? `${brandOrType} •••• ${paymentMethod.last_4}`
      : brandOrType;
  });

  const billingAddressLabel = $derived.by(() => {
    const address = startData?.billing_address;
    if (!address) {
      return null;
    }
    return (
      [address.postal_code, address.country_code].filter(Boolean).join(", ") ||
      "On file"
    );
  });
</script>

<Template {brandingInfo} {isInElement} {isSandbox} {onClose}>
  {#snippet navbarHeaderContent()}
    <BrandingHeader {brandingInfo} showCloseButton={!isInElement} {onClose} />
  {/snippet}

  {#snippet navbarBodyContent()}
    {#if startData}
      <UpgradeProductInfo {startData} />
    {/if}
  {/snippet}

  {#snippet mainContent()}
    <div class="rcb-upgrade-checkout">
      {#if loading}
        <Typography size="body-base">Loading upgrade checkout…</Typography>
      {:else if startData}
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

        {#if loadError}
          <Typography size="body-base">{loadError}</Typography>
        {/if}

        <div class="rcb-upgrade-actions">
          <Button
            disabled={confirming}
            onclick={handleConfirm}
            {brandingAppearance}
          >
            {confirming ? "Confirming…" : ctaLabel}
          </Button>
        </div>
      {:else if loadError}
        <Typography size="body-base">{loadError}</Typography>
      {/if}
    </div>
  {/snippet}
</Template>

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
