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
  import StripePaymentElements from "../molecules/stripe-payment-elements.svelte";
  import { type GatewayParams } from "../../networking/responses/stripe-elements";
  import { validateEmail } from "../../helpers/validators";

  export let onContinue: (params?: ContinueHandlerParams) => void;
  export let gatewayParams: GatewayParams = {};
  export let priceBreakdown: PriceBreakdown;
  export let processing = false;
  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingInfo: BrandingInfoResponse | null;
  export let purchaseOperationHelper: PurchaseOperationHelper;
  export let customerEmail: string | null;
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

  $: email = customerEmail ?? "";
  $: emailErrorMessage = "";
  $: emailInputClass = emailErrorMessage !== "" ? "error" : "";
  let hasEmailBeenValidated = false;

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

    if (customerEmail === null) {
      emailErrorMessage = validateEmail(email) ?? "";

      if (emailErrorMessage !== "") {
        const event = createCheckoutPaymentFormErrorEvent({
          errorCode: null,
          errorMessage: emailErrorMessage,
        });
        eventsTracker.trackSDKEvent(event);
        return;
      }
    }

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
          customerEmail ?? email,
        );
        clientSecret = response?.gateway_params?.client_secret;
        if (!clientSecret) {
          throw new Error("Failed to complete checkout");
        }
      } catch (error) {
        if (error instanceof PurchaseFlowError) {
          if (error.errorCode === PurchaseFlowErrorCode.MissingEmailError) {
            const event = createCheckoutPaymentFormErrorEvent({
              errorCode: error.errorCode.toString(),
              errorMessage: error.message,
            });
            eventsTracker.trackSDKEvent(event);

            processing = false;
            emailErrorMessage = error.message;
          }
        } else {
          handleStripeElementError(error as PaymentElementError);
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
    {#if customerEmail === null}
      <div class="rcb-form-container">
        <div class="rcb-form-input {emailInputClass}">
          <input
            id="email"
            name="email"
            inputmode="email"
            placeholder={$translator.translate(
              LocalizationKeys.EmailEntryPageEmailInputPlaceholder,
            )}
            autocapitalize="off"
            autocomplete="email"
            data-testid="email"
            bind:value={email}
            on:change={() => {
              emailErrorMessage = validateEmail(email) ?? "";
              hasEmailBeenValidated = true;
            }}
          />
        </div>
        {#if emailErrorMessage !== ""}
          <div class="rcb-form-error">{emailErrorMessage}</div>
        {/if}
      </div>
    {/if}

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
              (!customerEmail &&
                (!hasEmailBeenValidated || emailErrorMessage !== "")) ||
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

  .rcb-auth-info-title {
    font: var(--rc-text-titleLarge-mobile);
  }

  .secure-checkout-container {
    margin-top: var(--rc-spacing-gapXXLarge-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-auth-info-title {
      font: var(--rc-text-titleLarge-desktop);
    }

    .secure-checkout-container {
      margin-top: var(--rc-spacing-gapXXLarge-desktop);
    }
  }

  .rcb-state-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    user-select: none;
  }

  form {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .rcb-form-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: var(--rc-spacing-gapXLarge-desktop);
    margin-bottom: var(--rc-spacing-gapXLarge-desktop);
  }

  @media screen and (max-width: 767px) {
    .rcb-form-container {
      margin-top: var(--rc-spacing-gapXLarge-mobile);
      margin-bottom: var(--rc-spacing-gapXLarge-mobile);
    }
  }

  .rcb-form-label {
    margin-top: var(--rc-spacing-gapSmall-desktop);
    margin-bottom: var(--rc-spacing-gapSmall-desktop);
    font: var(--rc-text-body1-mobile);
    display: block;
  }

  @container layout-query-container (width >= 768px) {
    .rcb-form-label {
      font: var(--rc-text-body1-desktop);
    }
  }

  .rcb-form-input.error input {
    border-color: var(--rc-color-error);
  }

  .rcb-form-error {
    margin-top: var(--rc-spacing-gapSmall-desktop);
    font: var(--rc-text-body1-mobile);
    color: var(--rc-color-error);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-form-error {
      font: var(--rc-text-body1-desktop);
    }
  }

  input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--rc-color-grey-ui-dark);
    border-radius: var(--rc-shape-input-border-radius);
    font: var(--rc-text-body1-mobile);
    height: var(--rc-spacing-inputHeight-desktop);
    background: var(--rc-color-input-background);
    color: inherit;
  }

  @container layout-query-container (width < 768px) {
    input {
      padding-left: var(--rc-spacing-gapLarge-mobile);
      height: var(--rc-spacing-inputHeight-mobile);
    }
  }

  @container layout-query-container (width >= 768px) {
    input {
      font: var(--rc-text-body1-desktop);
      padding-left: var(--rc-spacing-gapLarge-desktop);
    }

    .rcb-state-container {
      max-width: 50vw;
      flex-grow: 0;
    }
  }

  input:focus {
    outline: none;
    border: 1px solid var(--rc-color-focus);
  }

  input::placeholder {
    color: var(--rc-color-grey-ui-dark);
  }
</style>
