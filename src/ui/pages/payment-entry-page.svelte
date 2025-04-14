<script lang="ts">
  import { getContext, onMount } from "svelte";
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
    createCheckoutPaymentFormErrorEvent,
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
  import StripeElements from "../molecules/stripe-elements.svelte";
  import { type GatewayParams } from "../../networking/responses/stripe-elements";

  interface Props {
    gatewayParams?: GatewayParams;
    priceBreakdown: PriceBreakdown;
    processing: boolean;
    productDetails: Product;
    purchaseOption: PurchaseOption;
    brandingInfo: BrandingInfoResponse | null;
    purchaseOperationHelper: PurchaseOperationHelper;
    customerEmail: string | null;
    onContinue: (params?: ContinueHandlerParams) => void;
    onTaxCustomerDetailsUpdated: (customerDetails: TaxCustomerDetails) => void;
  }

  const {
    gatewayParams = {},
    priceBreakdown,
    productDetails,
    purchaseOption,
    brandingInfo,
    purchaseOperationHelper,
    customerEmail,
    onContinue,
    onTaxCustomerDetailsUpdated,
  }: Props = $props();

  const subscriptionOption =
    productDetails.subscriptionOptions?.[purchaseOption.id];

  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;
  const translator = getContext<Writable<Translator>>(translatorContextKey);
  const taxCollectionEnabled = $derived(
    priceBreakdown.taxCalculationStatus !== "disabled",
  );

  let stripeSubmit: () => Promise<void> = $state(() => Promise.resolve());
  let stripeConfirm: (clientSecret: string) => Promise<void> = $state(() =>
    Promise.resolve(),
  );

  let email: string = $state(customerEmail ?? "");
  let isEmailComplete = $state(customerEmail ? true : false);
  let isStripeLoading = $state(true);
  let isPaymentInfoComplete = $state(false);
  let selectedPaymentMethod: string | undefined = $state(undefined);
  let modalErrorMessage: string | undefined = $state(undefined);
  let clientSecret: string | undefined = $state(undefined);
  let processing = $state(false);

  let isFormReady = $derived(
    !processing &&
      priceBreakdown.taxCalculationStatus !== "loading" &&
      isPaymentInfoComplete &&
      isEmailComplete,
  );

  onMount(() => {
    eventsTracker.trackSDKEvent({
      eventName: SDKEventName.CheckoutPaymentFormImpression,
    });
  });

  function handleStripeLoadingComplete() {
    isStripeLoading = false;
  }

  function handleEmailChange(complete: boolean, emailValue: string) {
    email = emailValue;
    isEmailComplete = complete;
  }

  function handlePaymentInfoChange({
    complete,
    paymentMethod,
    updatedTaxDetails,
  }: {
    complete: boolean;
    paymentMethod: string | undefined;
    updatedTaxDetails: TaxCustomerDetails | undefined;
  }) {
    selectedPaymentMethod = paymentMethod;
    isPaymentInfoComplete = complete;
    if (updatedTaxDetails) {
      onTaxCustomerDetailsUpdated(updatedTaxDetails);
    }
  }

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

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
        const response = await purchaseOperationHelper.checkoutComplete(
          customerEmail ? undefined : email,
        );
        clientSecret = response?.gateway_params?.client_secret;
        if (!clientSecret) {
          throw new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            "Failed to complete checkout",
          );
        }
      } catch (error) {
        if (!(error instanceof PurchaseFlowError)) {
          throw error;
        }

        const event = createCheckoutPaymentFormErrorEvent({
          errorCode: error.errorCode.toString(),
          errorMessage: error.message,
        });
        eventsTracker.trackSDKEvent(event);

        if (error.errorCode === PurchaseFlowErrorCode.MissingEmailError) {
          processing = false;
          modalErrorMessage = $translator.translate(
            LocalizationKeys.ErrorPageErrorMessageInvalidEmailError,
            { email: email },
          );
        } else {
          onContinue({
            error: error,
          });
        }
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

  $effect(() => {
    if (priceBreakdown.pendingReason === "invalid_postal_code") {
      priceBreakdown.pendingReason = null;
      modalErrorMessage = $translator.translate(
        LocalizationKeys.ErrorPageErrorMessageInvalidTaxLocation,
      );
    }
  });

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
    onsubmit={handleSubmit}
    data-testid="payment-form"
    class="rc-checkout-form"
    class:hidden={isStripeLoading || processing}
  >
    <div class="rc-checkout-form-container" hidden={!!modalErrorMessage}>
      <div class="rc-elements-container">
        <StripeElements
          bind:submit={stripeSubmit}
          bind:confirm={stripeConfirm}
          {gatewayParams}
          {brandingInfo}
          customerEmail={customerEmail ?? ""}
          {taxCollectionEnabled}
          onLoadingComplete={handleStripeLoadingComplete}
          onError={handleStripeElementError}
          onEmailChange={handleEmailChange}
          onPaymentInfoChange={handlePaymentInfoChange}
          onSubmissionSuccess={handlePaymentSubmissionSuccess}
          onConfirmationSuccess={onContinue}
        />
      </div>

      <div class="rc-checkout-pay-container">
        {#if !modalErrorMessage}
          <PaymentButton disabled={!isFormReady} {subscriptionOption} />
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

  .rc-elements-container {
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

  form {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
</style>
