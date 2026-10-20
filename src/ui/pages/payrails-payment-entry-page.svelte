<script lang="ts">
  import { getContext, onDestroy } from "svelte";
  import { get, type Writable } from "svelte/store";
  import type { PayrailsGatewayParams } from "../../networking/responses/payrails-gateway-params";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
  import type { Product } from "../../entities/offerings";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../../helpers/purchase-operation-helper";
  import { isCheckoutConsentRequired } from "../../helpers/checkout-consent-helper";
  import {
    PAYRAILS_DROPIN_CONTAINER_ID,
    PayrailsService,
  } from "../../payrails/payrails-service";
  import { eventsTrackerContextKey } from "../constants";
  import type { IEventsTracker } from "../../behavioural-events/events-tracker";
  import { createCheckoutPaymentGatewayErrorEvent } from "../../behavioural-events/sdk-event-helpers";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import Loading from "../molecules/loading.svelte";
  import CheckoutConsent from "../molecules/checkout-consent.svelte";
  import Icon from "../atoms/icon.svelte";

  interface Props {
    payrailsGatewayParams: PayrailsGatewayParams;
    brandingInfo: BrandingInfoResponse | null;
    productDetails: Product;
    termsAndConditionsUrl?: string | null;
    onContinue: () => void;
    onError: (error: PurchaseFlowError) => void;
    onProcessingStateChange?: (isProcessing: boolean) => void;
  }

  let {
    payrailsGatewayParams,
    brandingInfo,
    productDetails,
    termsAndConditionsUrl,
    onContinue,
    onError,
    onProcessingStateChange = undefined,
  }: Props = $props();

  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;
  const translator = getContext<Writable<Translator>>(translatorContextKey);
  const service = new PayrailsService();

  let initializing = $state(true);
  let processing = $state(false);
  let paymentErrorMessage = $state<string | undefined>(undefined);
  let checkoutConsentAccepted = $state(false);

  const checkoutConsentRequired = $derived(
    isCheckoutConsentRequired({
      brandingInfo,
      termsAndConditionsUrl,
      productDetails,
    }),
  );
  const canMountDropin = $derived(
    !checkoutConsentRequired || checkoutConsentAccepted,
  );

  $effect(() => {
    if (!canMountDropin) {
      initializing = false;
      return;
    }

    const gatewayParams = payrailsGatewayParams;
    let cancelled = false;
    initializing = true;
    paymentErrorMessage = undefined;

    void service
      .mountDropin(gatewayParams, {
        onSuccess: () => {
          if (cancelled) return;
          processing = true;
          onProcessingStateChange?.(true);
          onContinue();
        },
        onFailed: (event) => {
          if (cancelled) return;
          processing = false;
          onProcessingStateChange?.(false);
          const message =
            event.data?.message ||
            get(translator).translate(
              LocalizationKeys.PaymentEntryPagePaymentMethodError,
            );
          paymentErrorMessage = message;
          eventsTracker.trackSDKEvent(
            createCheckoutPaymentGatewayErrorEvent({
              errorCode: event.data?.code ?? "",
              errorMessage: message,
            }),
          );
        },
        onPending: () => {
          if (cancelled) return;
          onProcessingStateChange?.(true);
        },
        onSessionExpired: () => {
          if (cancelled) return;
          onError(
            new PurchaseFlowError(
              PurchaseFlowErrorCode.ErrorSettingUpPurchase,
              "Payment session expired",
            ),
          );
        },
      })
      .then(() => {
        if (!cancelled) {
          initializing = false;
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        onError(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            "Failed to initialize payment form",
            error instanceof Error ? error.message : String(error),
          ),
        );
      });

    return () => {
      cancelled = true;
      service.unmount();
    };
  });

  onDestroy(() => {
    service.unmount();
  });
</script>

<div class="rc-payrails-checkout" data-testid="payrails-checkout">
  {#if checkoutConsentRequired && termsAndConditionsUrl}
    <CheckoutConsent
      appName={brandingInfo?.app_name}
      {termsAndConditionsUrl}
      bind:checked={checkoutConsentAccepted}
      onChange={(accepted) => (checkoutConsentAccepted = accepted)}
    />
  {/if}

  {#if initializing || processing}
    <div class="rc-loading" data-testid="payrails-loading">
      <Loading />
    </div>
  {/if}

  {#if paymentErrorMessage}
    <div class="rcb-payment-method-error" role="alert">
      <span class="rcb-payment-method-error-icon" aria-hidden="true">
        <Icon name="warning" />
      </span>
      <span>{paymentErrorMessage}</span>
    </div>
  {/if}

  <div
    id={PAYRAILS_DROPIN_CONTAINER_ID}
    data-testid="payrails-dropin"
    class:rc-payrails-dropin-hidden={!canMountDropin ||
      initializing ||
      processing}
  ></div>
</div>

<style>
  .rc-payrails-checkout {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXLarge-mobile);
    width: 100%;
  }

  .rc-payrails-dropin-hidden {
    display: none;
  }

  .rc-loading {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .rcb-payment-method-error {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--rc-color-error);
    font: var(--rc-text-bodySmall-mobile);
  }

  .rcb-payment-method-error-icon {
    display: block;
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
  }
</style>
