<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { StripeBillingParams } from "../../networking/responses/checkout-start-response";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../../helpers/purchase-operation-helper";
  import { StripeService } from "../../stripe/stripe-service";
  import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";

  interface Props {
    stripeBillingParams: StripeBillingParams;
    onContinue: () => void;
    onError: (error: PurchaseFlowError) => void;
  }

  const { stripeBillingParams, onContinue, onError }: Props = $props();

  let checkoutContainer: HTMLDivElement;
  let embeddedCheckout: StripeEmbeddedCheckout | null = null;

  async function handleCheckoutComplete() {
    try {
      onContinue();
    } catch (error) {
      onError(
        error instanceof PurchaseFlowError
          ? error
          : new PurchaseFlowError(
              PurchaseFlowErrorCode.ErrorSettingUpPurchase,
              error instanceof Error
                ? error.message
                : "Failed to complete checkout",
            ),
      );
    }
  }

  onMount(async () => {
    try {
      const publishableApiKey = stripeBillingParams.publishable_api_key;
      const stripeAccountId = stripeBillingParams.stripe_account_id;

      const { embeddedCheckout: checkout } =
        await StripeService.initializeStripeCheckout(
          stripeAccountId,
          publishableApiKey,
          stripeBillingParams,
          handleCheckoutComplete,
        );

      embeddedCheckout = checkout;

      if (checkoutContainer) {
        checkout.mount(checkoutContainer);
      }
    } catch (error) {
      onError(
        error instanceof Error
          ? new PurchaseFlowError(
              PurchaseFlowErrorCode.ErrorSettingUpPurchase,
              error.message,
            )
          : new PurchaseFlowError(
              PurchaseFlowErrorCode.ErrorSettingUpPurchase,
              "Failed to initialize Stripe Checkout",
            ),
      );
    }
  });

  onDestroy(() => {
    if (embeddedCheckout) {
      embeddedCheckout.destroy();
      embeddedCheckout = null;
    }
  });
</script>

<div class="stripe-checkout-container">
  <div bind:this={checkoutContainer} class="stripe-checkout-mount"></div>
</div>

<style>
  .stripe-checkout-container {
    width: 100%;
    min-height: 400px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .stripe-checkout-mount {
    width: 100%;
    flex: 1;
  }
</style>
