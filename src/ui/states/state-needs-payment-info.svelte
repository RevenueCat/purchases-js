<script lang="ts">
  import { getContext, onMount } from "svelte";
  import Button from "../atoms/button.svelte";
  import type {
    Stripe,
    StripeElementLocale,
    StripeElements,
    StripeError,
  } from "@stripe/stripe-js";
  import type { Product, PurchaseOption } from "../../entities/offerings";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import IconError from "../atoms/icons/icon-error.svelte";
  import MessageLayout from "../layout/message-layout.svelte";

  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import Localized from "../localization/localized.svelte";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import SecureCheckoutRc from "../molecules/secure-checkout-rc.svelte";
  import { type CheckoutStartResponse } from "../../networking/responses/checkout-start-response";
  import {
    PurchaseFlowError,
    PurchaseOperationHelper,
  } from "../../helpers/purchase-operation-helper";
  import { StripeService } from "../../stripe/stripe-service";
  import { type ContinueHandlerParams } from "../ui-types";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "../constants";
  import {
    createCheckoutPaymentFormSubmitEvent,
    createCheckoutPaymentGatewayErrorEvent,
  } from "../../behavioural-events/sdk-event-helpers";
  import { SDKEventName } from "../../behavioural-events/sdk-events";
  import StateLoading from "./state-loading.svelte";
  import { getNextRenewalDate } from "../../helpers/duration-helper";
  import { formatPrice } from "../../helpers/price-labels";
  import { type Writable } from "svelte/store";
  import StripePaymentElements from "../molecules/stripe-payment-elements.svelte";

  export let onContinue: (params?: ContinueHandlerParams) => void;
  export let paymentInfoCollectionMetadata: CheckoutStartResponse;
  export let processing = false;
  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingInfo: BrandingInfoResponse | null;
  export let purchaseOperationHelper: PurchaseOperationHelper;

  const gatewayParams = paymentInfoCollectionMetadata.gateway_params;

  let isStripeLoading = true;
  let stripe: Stripe | null = null;
  let elements: StripeElements | undefined;
  let stripeLocale: StripeElementLocale | undefined;
  let isPaymentInfoComplete = false;
  let selectedPaymentMethod: string | undefined = undefined;
  let modalErrorMessage: string | undefined = undefined;
  let clientSecret: string | undefined = undefined;

  const subscriptionOption =
    productDetails.subscriptionOptions?.[purchaseOption.id];

  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;
  const translator = getContext<Writable<Translator>>(translatorContextKey);

  onMount(() => {
    eventsTracker.trackSDKEvent({
      eventName: SDKEventName.CheckoutPaymentFormImpression,
    });
  });

  function handleStripeReady() {
    isStripeLoading = false;
  }

  function handleStripeLoadingError(error: PurchaseFlowError) {
    isStripeLoading = false;
    handlePaymentError(error);
  }

  function handlePaymentInfoChange({
    complete,
    paymentMethod,
  }: {
    complete: boolean;
    paymentMethod: string | undefined;
  }) {
    selectedPaymentMethod = paymentMethod;
    isPaymentInfoComplete = complete;
  }

  const handleContinue = async () => {
    if (processing || !stripe || !elements) return;

    const event = createCheckoutPaymentFormSubmitEvent({
      selectedPaymentMethod: selectedPaymentMethod ?? null,
    });
    eventsTracker.trackSDKEvent(event);

    processing = true;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      handlePaymentError(submitError);
    } else {
      const checkoutError = await completeCheckout(stripe);

      if (checkoutError) {
        handlePaymentError(checkoutError);
      } else {
        onContinue();
      }
    }
  };

  function handlePaymentError(error: StripeError | PurchaseFlowError) {
    processing = false;

    const event = createCheckoutPaymentGatewayErrorEvent({
      errorCode:
        error instanceof PurchaseFlowError
          ? error.errorCode?.toString()
          : (error.code ?? null),
      errorMessage: error.message ?? "",
    });
    eventsTracker.trackSDKEvent(event);

    if (error instanceof PurchaseFlowError) {
      if (error.isRecoverable()) {
        modalErrorMessage = error.getPublicErrorMessage(productDetails);
      } else {
        onContinue({ error: error });
      }
    } else if (!StripeService.isStripeHandledCardError(error)) {
      modalErrorMessage = error.message;
    }
  }

  const completeCheckout = async (stripe: Stripe) => {
    // Get client secret if not already present
    if (!clientSecret) {
      try {
        const response = await purchaseOperationHelper.checkoutComplete();
        clientSecret = response?.gateway_params?.client_secret;
        if (!clientSecret) {
          throw new Error("Failed to complete checkout");
        }
      } catch (error) {
        return error as PurchaseFlowError;
      }
    }

    // Confirm payment or setup intent with Stripe
    const isSetupIntent = clientSecret.startsWith("seti_");
    const result = await stripe[
      isSetupIntent ? "confirmSetup" : "confirmPayment"
    ]({
      elements: elements,
      clientSecret,
      redirect: "if_required",
    });

    return result.error;
  };

  const handleErrorTryAgain = () => {
    modalErrorMessage = undefined;
  };
</script>

<div class="rc-checkout-container">
  {#if isStripeLoading || processing}
    <StateLoading />
  {/if}
  <!-- <TextSeparator text="Pay by card" /> -->
  <form
    on:submit|preventDefault={handleContinue}
    data-testid="payment-form"
    class="rc-checkout-form"
    class:hidden={isStripeLoading || processing}
  >
    <div class="rc-checkout-form-container" hidden={!!modalErrorMessage}>
      <div class="rc-payment-element-container">
        <StripePaymentElements
          {gatewayParams}
          {brandingInfo}
          onStripeReady={handleStripeReady}
          onStripeLoadingError={handleStripeLoadingError}
          onPaymentInfoChange={handlePaymentInfoChange}
          bind:stripe
          bind:elements
          bind:stripeLocale
        />
      </div>

      <div class="rc-checkout-pay-container">
        {#if !modalErrorMessage}
          <Button
            disabled={processing || !isPaymentInfoComplete}
            testId="PayButton"
          >
            {#if subscriptionOption?.trial}
              <Localized
                key={LocalizationKeys.StateNeedsPaymentInfoButtonStartTrial}
              />
            {:else}
              <Localized
                key={LocalizationKeys.StateNeedsPaymentInfoButtonPay}
              />
            {/if}
          </Button>
        {/if}

        <div class="rc-checkout-secure-container">
          <SecureCheckoutRc
            termsInfo={$translator.translate(
              LocalizationKeys.StateNeedsPaymentInfoTermsInfo,
              {
                appName: brandingInfo?.app_name,
              },
            )}
            trialInfo={subscriptionOption?.base?.price &&
            subscriptionOption?.trial?.period &&
            subscriptionOption?.base?.period &&
            subscriptionOption?.base?.period?.unit
              ? $translator.translate(
                  LocalizationKeys.StateNeedsPaymentInfoTrialInfo,
                  {
                    price: formatPrice(
                      subscriptionOption?.base?.price.amountMicros,
                      subscriptionOption?.base?.price.currency,
                      stripeLocale,
                    ),
                    perFrequency: $translator.translatePeriodFrequency(
                      subscriptionOption?.base?.period?.number || 1,
                      subscriptionOption?.base?.period?.unit,
                      { useMultipleWords: true },
                    ),
                    renewalDate: $translator.translateDate(
                      getNextRenewalDate(
                        new Date(),
                        subscriptionOption.trial.period ||
                          subscriptionOption.base.period,
                        true,
                      ) as Date,
                      { year: "numeric", month: "long", day: "numeric" },
                    ),
                  },
                )
              : null}
          />
        </div>
      </div>
    </div>

    {#if modalErrorMessage}
      <MessageLayout
        title={null}
        type="error"
        closeButtonTitle={$translator.translate(
          LocalizationKeys.StateErrorButtonTryAgain,
        )}
        onContinue={handleErrorTryAgain}
      >
        {#snippet icon()}
          <IconError />
        {/snippet}
        {#snippet message()}
          {modalErrorMessage}
        {/snippet}
      </MessageLayout>
    {/if}
  </form>
</div>

<style>
  .rc-checkout-secure-container {
    margin-top: var(--rc-spacing-gapXLarge-mobile);
  }

  .rc-checkout-container {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXLarge-mobile);
    user-select: none;
  }

  .rc-checkout-pay-container {
    display: flex;
    flex-direction: column;
    margin-top: var(--rc-spacing-gapXLarge-mobile);
  }

  .rc-checkout-form-container {
    width: 100%;
  }

  .rc-payment-element-container {
    /* The standard height of the payment form from Stripe */
    /* Added to avoid the card getting smaller while loading */
    min-height: 210px;
  }

  .hidden {
    visibility: hidden;
  }

  @container layout-query-container (width <= 767px) {
    .rc-checkout-pay-container {
      flex-grow: 1;
      justify-content: flex-end;
    }
    .rc-checkout-form {
      flex-grow: 1;
    }

    .rc-checkout-form-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .rc-checkout-container {
      flex-grow: 1;
    }
  }

  @container layout-query-container (width >= 768px) {
    .rc-checkout-secure-container {
      margin-top: var(--rc-spacing-gapXLarge-desktop);
    }

    .rc-checkout-container {
      gap: var(--rc-spacing-gapXLarge-desktop);
    }

    .rc-checkout-pay-container {
      margin-top: var(--rc-spacing-gapXLarge-desktop);
    }
  }
</style>
