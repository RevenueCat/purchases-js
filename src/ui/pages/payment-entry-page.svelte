<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type { StripeElementLocale } from "@stripe/stripe-js";
  import type { Product, PurchaseOption } from "../../entities/offerings";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import IconError from "../atoms/icons/icon-error.svelte";
  import MessageLayout from "../layout/message-layout.svelte";

  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import SecureCheckoutRc from "../molecules/secure-checkout-rc.svelte";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
    PurchaseOperationHelper,
  } from "../../helpers/purchase-operation-helper";
  import {
    type TaxCustomerDetails,
    type ContinueHandlerParams,
    type PriceBreakdown,
  } from "../ui-types";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "../constants";
  import {
    createCheckoutPaymentFormSubmitEvent,
    createCheckoutPaymentGatewayErrorEvent,
  } from "../../behavioural-events/sdk-event-helpers";
  import { SDKEventName } from "../../behavioural-events/sdk-events";
  import Loading from "../molecules/loading.svelte";
  import { type Writable } from "svelte/store";
  import {
    type PaymentElementError,
    PaymentElementErrorCode,
  } from "../types/payment-element-error";
  import PaymentButton from "../molecules/payment-button.svelte";
  import StripePaymentElements from "../molecules/stripe-payment-elements.svelte";
  import { type GatewayParams } from "../../networking/responses/stripe-elements";

  export let onContinue: (params?: ContinueHandlerParams) => void;
  export let gatewayParams: GatewayParams = {};
  export let priceBreakdown: PriceBreakdown;
  export let processing = false;
  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingInfo: BrandingInfoResponse | null;
  export let purchaseOperationHelper: PurchaseOperationHelper;
  export let onTaxCustomerDetailsUpdated: (
    customerDetails: TaxCustomerDetails,
  ) => void;

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

  $: if (priceBreakdown.pendingReason === "invalid_postal_code") {
    priceBreakdown.pendingReason = null;
    modalErrorMessage = $translator.translate(
      LocalizationKeys.ErrorPageErrorMessageInvalidTaxLocation,
    );
  }

  const handleErrorTryAgain = () => {
    modalErrorMessage = undefined;
  };
</script>

<div class="rc-checkout-container">
  {#if isStripeLoading || processing}
    <Loading />
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
          taxCollectionEnabled={priceBreakdown.taxCollectionEnabled}
          {onTaxCustomerDetailsUpdated}
        />
      </div>

      <div class="rc-checkout-pay-container">
        {#if !modalErrorMessage}
          <PaymentButton
            disabled={processing ||
              !isPaymentInfoComplete ||
              priceBreakdown.taxCalculationStatus === "loading"}
            {subscriptionOption}
          />
        {/if}

        <div class="rc-checkout-secure-container">
          <SecureCheckoutRc {brandingInfo} {subscriptionOption} />
        </div>
      </div>
    </div>

    {#if modalErrorMessage}
      <MessageLayout
        title={null}
        type="error"
        closeButtonTitle={$translator.translate(
          LocalizationKeys.ErrorButtonTryAgain,
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
