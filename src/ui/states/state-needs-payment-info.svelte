<script lang="ts">
  import { getContext, onMount } from "svelte";
  import Button from "../atoms/button.svelte";
  import type { StripeElementLocale } from "@stripe/stripe-js";
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
    PurchaseFlowErrorCode,
    PurchaseOperationHelper,
  } from "../../helpers/purchase-operation-helper";
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
  import {
    type PaymentElementError,
    PaymentElementErrorCode,
  } from "../types/payment-element-error";

  export let onContinue: (params?: ContinueHandlerParams) => void;
  export let paymentInfoCollectionMetadata: CheckoutStartResponse;
  export let processing = false;
  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingInfo: BrandingInfoResponse | null;
  export let purchaseOperationHelper: PurchaseOperationHelper;

  const gatewayParams = paymentInfoCollectionMetadata.gateway_params;

  let isStripeLoading = true;
  let stripeLocale: StripeElementLocale | undefined;

  let stripeSubmit: () => Promise<void>;
  let stripeConfirm: (clientSecret: string) => Promise<void>;

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

  function handleStripeLoadingComplete() {
    isStripeLoading = false;
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

  async function handleSubmit(): Promise<void> {
    if (processing) return;

    const event = createCheckoutPaymentFormSubmitEvent({
      selectedPaymentMethod: selectedPaymentMethod ?? null,
    });
    eventsTracker.trackSDKEvent(event);

    processing = true;

    await stripeSubmit();
  }

  async function handlePaymentSubmissionSuccess(): Promise<void> {
    // Get client secret if not already present
    if (!clientSecret) {
      try {
        const response = await purchaseOperationHelper.checkoutComplete();
        clientSecret = response?.gateway_params?.client_secret;
        if (!clientSecret) {
          throw new Error("Failed to complete checkout");
        }
      } catch (error) {
        handleStripeElementError(error as PaymentElementError);
        return;
      }
    }

    await stripeConfirm(clientSecret);
  }

  function handleStripeElementError(error: PaymentElementError) {
    processing = false;

    const event = createCheckoutPaymentGatewayErrorEvent({
      errorCode: error.gatewayErrorCode ?? "",
      errorMessage: error.message ?? "",
    });
    eventsTracker.trackSDKEvent(event);

    if (error.code === PaymentElementErrorCode.HandledFormSubmissionError) {
      return;
    }

    if (error.code === PaymentElementErrorCode.UnhandledFormSubmissionError) {
      modalErrorMessage = error.message;
    } else {
      onContinue({
        error: new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          "Failed to initialize payment form",
          error.message,
        ),
      });
    }
  }

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
    on:submit|preventDefault={handleSubmit}
    data-testid="payment-form"
    class="rc-checkout-form"
    class:hidden={isStripeLoading || processing}
  >
    <div class="rc-checkout-form-container" hidden={!!modalErrorMessage}>
      <div class="rc-payment-element-container">
        <StripePaymentElements
          bind:submit={stripeSubmit}
          bind:confirm={stripeConfirm}
          bind:stripeLocale
          {gatewayParams}
          {brandingInfo}
          onLoadingComplete={handleStripeLoadingComplete}
          onError={handleStripeElementError}
          onPaymentInfoChange={handlePaymentInfoChange}
          onSubmissionSuccess={handlePaymentSubmissionSuccess}
          onConfirmationSuccess={onContinue}
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
