<script lang="ts">
  import { getContext, onDestroy, onMount } from "svelte";
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
    TaxCalculationError,
  } from "../../helpers/purchase-operation-helper";
  import type {
    PriceBreakdown,
    TaxCalculationStatus,
    TaxCalculationPendingReason,
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
  import PaymentButton from "../molecules/payment-button.svelte";
  import type {
    StripeElementsConfiguration,
    GatewayParams,
  } from "../../networking/responses/stripe-elements";
  import { ALLOW_TAX_CALCULATION_FF } from "../../helpers/constants";
  import type { TaxBreakdown } from "../../networking/responses/checkout-calculate-tax-response";
  import type { Stripe, StripeElements } from "@stripe/stripe-js";
  import {
    StripeService,
    type StripeServiceError,
    StripeServiceErrorCode,
    type TaxCustomerDetails,
  } from "../../stripe/stripe-service";
  import StripeElementsComponent from "../molecules/stripe-elements.svelte";
  interface Props {
    gatewayParams: GatewayParams;
    processing: boolean;
    productDetails: Product;
    purchaseOption: PurchaseOption;
    brandingInfo: BrandingInfoResponse | null;
    purchaseOperationHelper: PurchaseOperationHelper;
    customerEmail: string | null;
    onContinue: () => void;
    onError: (error: PurchaseFlowError) => void;
    onPriceBreakdownUpdated: (priceBreakdown: PriceBreakdown) => void;
  }

  const {
    gatewayParams,
    productDetails,
    purchaseOption,
    brandingInfo,
    purchaseOperationHelper,
    customerEmail,
    onContinue,
    onError,
    onPriceBreakdownUpdated,
  }: Props = $props();

  const subscriptionOption =
    productDetails.subscriptionOptions?.[purchaseOption.id];

  let taxCalculationStatus: TaxCalculationStatus =
    $state<TaxCalculationStatus>("disabled");
  let pendingReason: TaxCalculationPendingReason | null = $state(null);
  let taxAmountInMicros: number | null = $state(null);
  let taxBreakdown: TaxBreakdown[] | null = $state(null);
  let totalExcludingTaxInMicros: number | null = $state(
    productDetails.currentPrice.amountMicros,
  );
  let totalAmountInMicros: number | null = $state(
    productDetails.currentPrice.amountMicros,
  );

  let priceBreakdown: PriceBreakdown = $derived({
    currency: productDetails.currentPrice.currency,
    totalAmountInMicros,
    totalExcludingTaxInMicros,
    taxCalculationStatus,
    pendingReason,
    taxAmountInMicros,
    taxBreakdown,
  });

  let elementsConfiguration: StripeElementsConfiguration | undefined = $state(
    gatewayParams.elements_configuration,
  );

  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;
  const translator = getContext<Writable<Translator>>(translatorContextKey);

  let initialTaxCalculationSucceeded: boolean | null = $state(null);
  let lastTaxCustomerDetails: TaxCustomerDetails | null = $state(null);

  let stripe: Stripe | null = $state(null);
  let elements: StripeElements | null = $state(null);

  let email: string | undefined = $state(customerEmail ?? undefined);
  let isEmailComplete = $state(customerEmail ? true : false);
  let isStripeLoading = $state(true);
  let isPaymentInfoComplete = $state(false);
  let selectedPaymentMethod: string | undefined = $state(undefined);
  let modalErrorMessage: string | undefined = $state(undefined);
  let clientSecret: string | undefined = $state(undefined);
  let processing = $state(false);
  let abortController: AbortController | null = $state(null);

  let elementsComplete = $derived(isPaymentInfoComplete && isEmailComplete);

  let calculatingTaxes = $state(false);
  let taxNeedingRefresh = $state(false);

  let isFormReady = $derived(
    !processing &&
      elementsComplete &&
      initialTaxCalculationSucceeded !== null &&
      !calculatingTaxes,
  );

  onMount(() => {
    eventsTracker.trackSDKEvent({
      eventName: SDKEventName.CheckoutPaymentFormImpression,
    });
  });

  onMount(async () => {
    // If tax collection is enabled, we start in the state `disabled`
    if (
      ALLOW_TAX_CALCULATION_FF &&
      brandingInfo?.gateway_tax_collection_enabled
    ) {
      await recalculatePriceBreakdown(null);
      initialTaxCalculationSucceeded = taxCalculationStatus !== "disabled";
    } else {
      initialTaxCalculationSucceeded = false;
    }
  });

  onDestroy(() => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  });

  const refreshTaxCalculation = async () => {
    if (!initialTaxCalculationSucceeded) {
      return;
    }

    if (selectedPaymentMethod !== "card" || !elementsComplete) {
      return;
    }

    calculatingTaxes = true;

    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    const signal = abortController.signal;

    await extractNewTaxCustomerDetails()
      .then(async (newTaxCustomerDetails) => {
        signal.throwIfAborted();

        if (newTaxCustomerDetails) {
          await recalculatePriceBreakdown(newTaxCustomerDetails, signal);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Silently handle cancellation
          return;
        }
        throw error;
      })
      .finally(() => {
        calculatingTaxes = false;
      });
  };

  const extractNewTaxCustomerDetails =
    async (): Promise<TaxCustomerDetails | null> => {
      if (!elements || !stripe) return null;

      const taxCustomerDetails = await StripeService.extractTaxCustomerDetails(
        elements,
        stripe,
      );

      const sameDetails =
        taxCustomerDetails.postalCode === lastTaxCustomerDetails?.postalCode &&
        taxCustomerDetails.countryCode === lastTaxCustomerDetails?.countryCode;

      if (sameDetails) {
        return null;
      }
      return taxCustomerDetails;
    };

  async function recalculatePriceBreakdown(
    taxCustomerDetails: TaxCustomerDetails | null,
    signal?: AbortSignal,
  ) {
    // Skip loading spinner on first load
    if (initialTaxCalculationSucceeded) {
      taxCalculationStatus = "loading";
      onPriceBreakdownUpdated(priceBreakdown);
    }

    await purchaseOperationHelper
      .checkoutCalculateTax(
        taxCustomerDetails?.countryCode,
        taxCustomerDetails?.postalCode,
      )
      .then((taxCalculation) => {
        signal?.throwIfAborted();

        if (taxCalculation.error) {
          switch (taxCalculation.error) {
            case TaxCalculationError.Pending:
              taxCalculationStatus = "pending";
              pendingReason = null;
              break;
            case TaxCalculationError.Disabled:
              taxCalculationStatus = "disabled";
              pendingReason = null;
              break;
            case TaxCalculationError.InvalidLocation:
              taxCalculationStatus = "pending";
              pendingReason = "invalid_postal_code";
              break;
            default:
              throw new PurchaseFlowError(
                PurchaseFlowErrorCode.ErrorSettingUpPurchase,
                "Unknown error without state set.",
              );
          }
        } else {
          const { data } = taxCalculation;

          taxCalculationStatus = "calculated";
          taxAmountInMicros = data.tax_amount_in_micros;
          totalExcludingTaxInMicros = data.total_excluding_tax_in_micros;
          totalAmountInMicros = data.total_amount_in_micros;
          taxBreakdown = data.pricing_phases.base.tax_breakdown;
          pendingReason = null;

          elementsConfiguration = data.gateway_params.elements_configuration;
        }

        lastTaxCustomerDetails = taxCustomerDetails;
        onPriceBreakdownUpdated(priceBreakdown);
      })
      .catch((error) => {
        onError(error as PurchaseFlowError);
      });
  }

  function handleStripeLoadingComplete() {
    isStripeLoading = false;
  }

  async function handleEmailChange(complete: boolean, emailValue: string) {
    email = emailValue;
    isEmailComplete = complete;
    if (taxNeedingRefresh && isEmailComplete) {
      taxNeedingRefresh = false;
      await refreshTaxCalculation();
    }
  }

  async function handlePaymentInfoChange({
    complete,
    paymentMethod,
  }: {
    complete: boolean;
    paymentMethod: string | undefined;
  }) {
    selectedPaymentMethod = paymentMethod;
    isPaymentInfoComplete = complete;
    if (isEmailComplete) {
      await refreshTaxCalculation();
    } else {
      taxNeedingRefresh = true;
    }
  }

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (processing || !elements || !stripe) return;

    processing = true;

    const event = createCheckoutPaymentFormSubmitEvent({
      selectedPaymentMethod: selectedPaymentMethod ?? null,
    });
    eventsTracker.trackSDKEvent(event);

    await StripeService.submitElements(elements)
      .then(async () => {
        return purchaseOperationHelper.checkoutComplete(email);
      })
      .then(async (response) => {
        const newClientSecret = response?.gateway_params?.client_secret;

        if (newClientSecret) {
          clientSecret = newClientSecret;
        }
      })
      .then(async () => {
        if (!stripe || !elements || !clientSecret) return; // TODO: Handle this
        await StripeService.confirmElements(stripe, elements, clientSecret);
      })
      .then(async () => {
        onContinue();
      })
      .catch(async (error) => {
        if (error instanceof PurchaseFlowError) {
          const event = createCheckoutPaymentFormErrorEvent({
            errorCode: error.errorCode.toString(),
            errorMessage: error.message,
          });
          eventsTracker.trackSDKEvent(event);

          if (error.errorCode === PurchaseFlowErrorCode.MissingEmailError) {
            modalErrorMessage = $translator.translate(
              LocalizationKeys.ErrorPageErrorMessageInvalidEmailError,
              { email: email },
            );
            processing = false;
          } else {
            onError(error);
          }
        } else {
          await handleStripeElementError(error);
        }
      });
  }

  async function handleStripeElementError(error: StripeServiceError) {
    const event = createCheckoutPaymentGatewayErrorEvent({
      errorCode: error.gatewayErrorCode ?? "",
      errorMessage: error.message ?? "",
    });
    eventsTracker.trackSDKEvent(event);

    if (error.code === StripeServiceErrorCode.HandledFormError) {
      processing = false;
    } else if (error.code === StripeServiceErrorCode.UnhandledFormError) {
      processing = false;
      modalErrorMessage = error.message;
    } else {
      onError(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          "Failed to initialize payment form",
          error.message,
        ),
      );
    }
  }

  $effect(() => {
    if (pendingReason === "invalid_postal_code") {
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
        <StripeElementsComponent
          bind:stripe
          bind:elements
          stripeAccountId={gatewayParams.stripe_account_id}
          publishableApiKey={gatewayParams.publishable_api_key}
          {elementsConfiguration}
          {brandingInfo}
          skipEmail={!!customerEmail}
          onLoadingComplete={handleStripeLoadingComplete}
          onError={handleStripeElementError}
          onEmailChange={handleEmailChange}
          onPaymentInfoChange={handlePaymentInfoChange}
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
        onDismiss={handleErrorTryAgain}
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
