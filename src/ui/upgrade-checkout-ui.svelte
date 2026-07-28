<script lang="ts">
  import { onMount } from "svelte";
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

  interface Props {
    newProductId: string;
    subscriptionId: string;
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

  onMount(async () => {
    try {
      startData = await productChangeOperationHelper.start(
        newProductId,
        subscriptionId,
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

  function formatMoney(amountInMicros: number, currency: string): string {
    const amount = amountInMicros / 1_000_000;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  async function handleConfirm() {
    if (!startData || confirming) {
      return;
    }
    confirming = true;
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
      onError(error);
    } finally {
      confirming = false;
    }
  }

  const ctaLabel = $derived(
    startData?.change_type === "deferred" ? "Confirm schedule" : "Pay now",
  );
</script>

<Template {brandingInfo} {isInElement} {isSandbox} {onClose}>
  {#snippet navbarHeaderContent()}
    <BrandingHeader {brandingInfo} showCloseButton={!isInElement} {onClose} />
  {/snippet}

  {#snippet mainContent()}
    <div class="upgrade-checkout">
      {#if loading}
        <Typography size="body-base">Loading upgrade checkout…</Typography>
      {:else if loadError}
        <Typography size="body-base">{loadError}</Typography>
      {:else if startData}
        <Typography size="heading-md">Change subscription</Typography>

        <div class="section">
          <Typography size="body-small">From</Typography>
          <Typography size="body-base">
            {startData.from_product.display_name ??
              startData.from_product.product_id}
            — {formatMoney(
              startData.from_product.price_in_micros,
              startData.from_product.currency,
            )}
          </Typography>
        </div>

        <div class="section">
          <Typography size="body-small">To</Typography>
          <Typography size="body-base">
            {startData.to_product.display_name ??
              startData.to_product.product_id}
            — {formatMoney(
              startData.to_product.price_in_micros,
              startData.to_product.currency,
            )}
          </Typography>
        </div>

        {#if startData.price_breakdown}
          <div class="section">
            <Typography size="body-small">Due today</Typography>
            <Typography size="body-base">
              {formatMoney(
                startData.price_breakdown.total_amount_in_micros,
                startData.price_breakdown.currency,
              )}
            </Typography>
            {#if startData.price_breakdown.tax_amount_in_micros != null}
              <Typography size="body-small">
                Includes tax {formatMoney(
                  startData.price_breakdown.tax_amount_in_micros,
                  startData.price_breakdown.currency,
                )}
              </Typography>
            {/if}
          </div>
        {/if}

        {#if startData.estimated_credit_in_micros != null && startData.estimated_credit_in_micros > 0}
          <div class="section">
            <Typography size="body-small">
              Estimated credit for unused time: {formatMoney(
                startData.estimated_credit_in_micros,
                startData.to_product.currency,
              )}
            </Typography>
          </div>
        {/if}

        {#if startData.change_type === "deferred"}
          <div class="section">
            <Typography size="body-small">
              This change will take effect at the end of your current billing
              period. You will not be charged now.
            </Typography>
          </div>
        {/if}

        <div class="section">
          <Typography size="body-small">Email</Typography>
          <Typography size="body-base">{startData.email}</Typography>
        </div>

        {#if startData.payment_method}
          <div class="section">
            <Typography size="body-small">Payment method</Typography>
            <Typography size="body-base">
              {startData.payment_method.brand ?? startData.payment_method.type}
              {#if startData.payment_method.last_4}
                •••• {startData.payment_method.last_4}
              {/if}
            </Typography>
          </div>
        {/if}

        {#if startData.billing_address}
          <div class="section">
            <Typography size="body-small">Billing address</Typography>
            <Typography size="body-base">
              {[
                startData.billing_address.postal_code,
                startData.billing_address.country_code,
              ]
                .filter(Boolean)
                .join(", ") || "On file"}
            </Typography>
          </div>
        {/if}

        <button
          class="confirm-button"
          disabled={confirming}
          onclick={handleConfirm}
        >
          {confirming ? "Confirming…" : ctaLabel}
        </button>
      {/if}
    </div>
  {/snippet}
</Template>

<style>
  .upgrade-checkout {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 8px 0 24px;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .confirm-button {
    margin-top: 8px;
    border: none;
    border-radius: 8px;
    padding: 14px 16px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    background: var(--rc-color-accent, #000);
    color: var(--rc-color-accent-foreground, #fff);
  }

  .confirm-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
