<script module lang="ts">
  import { getContext, onDestroy, onMount } from "svelte";
  import {
    ProductType,
    type Product,
    type PurchaseOption,
    type SubscriptionOption,
  } from "../../entities/offerings";
  import {
    type BrandingInfoResponse,
    shouldCollectFullAddress,
  } from "../../networking/responses/branding-response";
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
  import type { PriceBreakdown, TaxCalculationStatus } from "../ui-types";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "../constants";
  import {
    createCheckoutPaymentFormErrorEvent,
    createCheckoutPaymentFormSubmitEvent,
    createCheckoutPaymentGatewayErrorEvent,
    createCheckoutPaymentTaxCalculationEvent,
  } from "../../behavioural-events/sdk-event-helpers";
  import { SDKEventName } from "../../behavioural-events/sdk-events";
  import Loading from "../molecules/loading.svelte";
  import { writable, type Writable } from "svelte/store";
  import PaymentButton from "../molecules/payment-button.svelte";
  import type {
    GatewayParams,
    StripeElementsConfiguration,
  } from "../../networking/responses/stripe-elements";
  import {
    CheckoutPricingFailedReason,
    createPriceBreakdownFromCheckoutPricingResponse,
    type CheckoutPricingResponse,
    type TaxBreakdown,
  } from "../../networking/responses/checkout-pricing-response";
  import type {
    Stripe,
    StripeAddressElementChangeEvent,
    StripeElements,
  } from "@stripe/stripe-js";
  import {
    StripeService,
    StripeServiceError,
    StripeServiceErrorCode,
    type TaxCustomerDetails,
  } from "../../stripe/stripe-service";
  import StripeElementsComponent from "../molecules/stripe-elements.svelte";
  import PriceUpdateInfo from "../molecules/price-update-info.svelte";
  import { getInitialPriceFromPurchaseOption } from "../../helpers/purchase-option-price-helper";
  import { resolveDiscountBreakdownForPurchaseOption } from "../../helpers/discount-breakdown-helper";

  type View = "loading" | "form" | "error";

  interface Props {
    gatewayParams: GatewayParams;
    managementUrl: string | null;
    productDetails: Product;
    purchaseOption: PurchaseOption;
    brandingInfo: BrandingInfoResponse | null;
    purchaseOperationHelper: PurchaseOperationHelper;
    customerEmail: string | null;
    forceEnableWalletMethods: boolean;
    defaultPriceBreakdown?: PriceBreakdown;
    termsAndConditionsUrl?: string | null;
    onContinue: () => void;
    onError: (error: PurchaseFlowError) => void;
    onPriceBreakdownUpdated: (priceBreakdown: PriceBreakdown) => void;
    onSessionPricingUpdated?: (
      pricingResponse: CheckoutPricingResponse,
      priceBreakdown: PriceBreakdown,
    ) => void;
    onProcessingStateChange?: (isProcessing: boolean) => void;
    /**
     * Shared store holding the last known tax customer details. It is lifted to
     * the parent so that pricing refreshes triggered outside of this page (e.g.
     * discount-code refreshes) can also forward the latest known tax location.
     */
    lastTaxCustomerDetailsStore?: Writable<TaxCustomerDetails | null>;
  }

  class TaxCustomerDetailsMissMatchError extends Error {}

  /**
   * Delay applied before triggering a tax recalculation in response to form
   * changes. This debounces bursts of `change` events (e.g. while the customer
   * is typing the address line 1 or line 2) so we only recalculate taxes once
   * they pause, instead of firing a request on every keystroke.
   */
  const TAX_REFRESH_DEBOUNCE_MS = 500;
</script>

<script lang="ts">
  import { defaultPurchaseMode } from "../../behavioural-events/event";

  let {
    gatewayParams,
    managementUrl,
    productDetails,
    purchaseOption,
    brandingInfo,
    purchaseOperationHelper,
    customerEmail,
    forceEnableWalletMethods,
    defaultPriceBreakdown,
    termsAndConditionsUrl,
    onContinue,
    onError,
    onPriceBreakdownUpdated,
    onSessionPricingUpdated = undefined,
    onProcessingStateChange = undefined,
    lastTaxCustomerDetailsStore = writable<TaxCustomerDetails | null>(null),
  }: Props = $props();

  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;
  const translator = getContext<Writable<Translator>>(translatorContextKey);
  const subscriptionOption = $derived(
    "base" in purchaseOption ? (purchaseOption as SubscriptionOption) : null,
  );

  const initialPrice = $derived(
    getInitialPriceFromPurchaseOption(productDetails, purchaseOption),
  );

  let taxCalculationStatus: TaxCalculationStatus = $state<TaxCalculationStatus>(
    defaultPriceBreakdown?.taxCalculationStatus ??
      (brandingInfo?.gateway_tax_collection_enabled
        ? "unavailable"
        : "disabled"),
  );
  let originalAmountInMicros: number = $state(
    defaultPriceBreakdown?.originalAmountInMicros ?? initialPrice.amountMicros,
  );
  let taxAmountInMicros: number | null = $state(
    defaultPriceBreakdown?.taxAmountInMicros ?? null,
  );
  let taxBreakdown: TaxBreakdown[] | null = $state(
    defaultPriceBreakdown?.taxBreakdown ?? null,
  );
  let totalExcludingTaxInMicros: number | null = $state(
    defaultPriceBreakdown?.totalExcludingTaxInMicros ??
      initialPrice.amountMicros,
  );
  let totalAmountInMicros: number | null = $state(
    defaultPriceBreakdown?.totalAmountInMicros ?? initialPrice.amountMicros,
  );
  let appliedDiscounts = $state(defaultPriceBreakdown?.appliedDiscounts ?? []);

  let priceBreakdown: PriceBreakdown = $derived({
    currency: initialPrice.currency,
    originalAmountInMicros,
    totalAmountInMicros,
    totalExcludingTaxInMicros,
    taxCalculationStatus,
    taxAmountInMicros,
    taxBreakdown,
    appliedDiscounts,
  });

  let elementsConfiguration: StripeElementsConfiguration | undefined = $state(
    gatewayParams.elements_configuration,
  );

  let stripe: Stripe | null = $state(null);
  let elements: StripeElements | null = $state(null);

  let email: string | undefined = $state(customerEmail ?? undefined);
  let isEmailComplete = $state(customerEmail ? true : false);
  let isStripeLoading = $state(true);
  let isPaymentInfoComplete = $state(false);
  let isAddressComplete = $state(!shouldCollectFullAddress(brandingInfo));
  let selectedPaymentMethod: string | undefined = $state(undefined);
  let modalErrorMessage: string | undefined = $state(undefined);
  let clientSecret: string | undefined = $state(undefined);
  let processing = $state(false);
  let abortController: AbortController | null = $state(null);
  let refreshTaxesTimeout: ReturnType<typeof setTimeout> | null = null;
  let view: View = $derived(
    isStripeLoading || processing
      ? "loading"
      : modalErrorMessage
        ? "error"
        : "form",
  );

  let previousTaxCalculationStatus: TaxCalculationStatus =
    $state("unavailable");

  // The tax location the last calculation ran for, used to skip redundant
  // recalculations. Kept separate from `lastTaxCustomerDetailsStore` (which is
  // published eagerly as the address is typed) so those eager writes don't make
  // recalculateTaxes think nothing changed and skip the tax call.
  let lastCalculatedTaxCustomerDetails: TaxCustomerDetails | null = null;

  let isFormReady = $derived(
    !processing &&
      isPaymentInfoComplete &&
      isEmailComplete &&
      isAddressComplete &&
      (taxCalculationStatus === "disabled" ||
        taxCalculationStatus === "calculated" ||
        taxCalculationStatus === "miss-match"),
  );

  let resolvedDiscount = $derived(
    resolveDiscountBreakdownForPurchaseOption({
      priceBreakdown,
      productDetails,
      purchaseOption,
      translator: $translator,
    }),
  );

  let expressCheckoutOptions = $derived(
    priceBreakdown &&
      (productDetails.productType === ProductType.Subscription
        ? subscriptionOption && managementUrl
          ? StripeService.buildStripeExpressCheckoutOptionsForSubscription(
              productDetails,
              priceBreakdown,
              subscriptionOption,
              $translator,
              managementUrl,
              resolvedDiscount,
            )
          : undefined
        : productDetails.defaultNonSubscriptionOption
          ? StripeService.buildStripeExpressCheckoutOptionsForNonSubscription(
              productDetails,
              priceBreakdown,
              resolvedDiscount,
            )
          : undefined),
  );

  $effect(() => {
    onPriceBreakdownUpdated(priceBreakdown);
  });

  function applyLocalPriceBreakdown(nextPriceBreakdown: PriceBreakdown) {
    taxCalculationStatus = nextPriceBreakdown.taxCalculationStatus;
    originalAmountInMicros =
      nextPriceBreakdown.originalAmountInMicros ?? initialPrice.amountMicros;
    taxAmountInMicros = nextPriceBreakdown.taxAmountInMicros;
    taxBreakdown = nextPriceBreakdown.taxBreakdown;
    totalExcludingTaxInMicros = nextPriceBreakdown.totalExcludingTaxInMicros;
    totalAmountInMicros = nextPriceBreakdown.totalAmountInMicros;
    appliedDiscounts = nextPriceBreakdown.appliedDiscounts ?? [];
  }

  $effect(() => {
    if (defaultPriceBreakdown) {
      return;
    }

    originalAmountInMicros = initialPrice.amountMicros;
    taxAmountInMicros = null;
    taxBreakdown = null;
    totalExcludingTaxInMicros = initialPrice.amountMicros;
    totalAmountInMicros = initialPrice.amountMicros;
    appliedDiscounts = [];
  });

  $effect(() => {
    if (!defaultPriceBreakdown) {
      return;
    }

    applyLocalPriceBreakdown(defaultPriceBreakdown);
  });

  $effect(() => {
    elementsConfiguration = gatewayParams.elements_configuration;
  });

  $effect(() => {
    onProcessingStateChange?.(processing);
  });

  onMount(async () => {
    if (taxCalculationStatus === "unavailable") {
      await recalculatePriceBreakdown(null).catch(handleErrors);
    }
  });

  onDestroy(() => {
    if (refreshTaxesTimeout) {
      clearTimeout(refreshTaxesTimeout);
      refreshTaxesTimeout = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  });

  async function recalculatePriceBreakdown(
    taxCustomerDetails: TaxCustomerDetails | null,
    signal?: AbortSignal,
  ) {
    await purchaseOperationHelper
      .checkoutRefreshPricing({
        countryCode: taxCustomerDetails?.countryCode,
        postalCode: taxCustomerDetails?.postalCode,
        state: taxCustomerDetails?.state,
        city: taxCustomerDetails?.city,
        addressLine1: taxCustomerDetails?.addressLine1,
        addressLine2: taxCustomerDetails?.addressLine2,
        signal,
      })
      .then((taxCalculation) => {
        /*
         * The event will be tracked as soon as the request ends,
         * despite the fact that the recalculation may be aborted
         * if a new recalculation is triggered.
         */
        const event = createCheckoutPaymentTaxCalculationEvent({
          taxCalculation,
          taxCustomerDetails,
        });
        eventsTracker.trackSDKEvent(event);

        signal?.throwIfAborted();

        let nextTaxCalculationStatus: TaxCalculationStatus;
        if (taxCalculation.failed_reason) {
          const isInitialCalculation = !taxCustomerDetails;
          if (
            isInitialCalculation &&
            taxCalculation.failed_reason ===
              CheckoutPricingFailedReason.invalid_tax_location
          ) {
            nextTaxCalculationStatus = "pending";
          } else {
            nextTaxCalculationStatus = "disabled";
          }
        } else {
          nextTaxCalculationStatus = "calculated";
        }

        applyCheckoutPricingResponse(
          taxCalculation,
          nextTaxCalculationStatus,
          taxCustomerDetails,
        );
      });
  }

  function applyCheckoutPricingResponse(
    pricingResponse: CheckoutPricingResponse,
    nextTaxCalculationStatus: TaxCalculationStatus,
    taxCustomerDetails: TaxCustomerDetails | null,
  ) {
    const nextPriceBreakdown = createPriceBreakdownFromCheckoutPricingResponse(
      pricingResponse,
      nextTaxCalculationStatus,
    );

    // Apply the breakdown locally regardless of mode. In the checkout shell the
    // parent owns the canonical pricing (via onSessionPricingUpdated) and echoes
    // it back through defaultPriceBreakdown, but that round-trip is asynchronous.
    // Without an immediate local update, the page's taxCalculationStatus would
    // stay "loading" when refreshTaxes' finally handler runs, causing it to
    // revert to a stale previousTaxCalculationStatus (e.g. "pending") and briefly
    // disable the pay button / show stale tax UI until the parent sync lands.
    applyLocalPriceBreakdown(nextPriceBreakdown);

    if (onSessionPricingUpdated) {
      onSessionPricingUpdated(pricingResponse, nextPriceBreakdown);
    } else {
      elementsConfiguration =
        pricingResponse.gateway_params.elements_configuration;
    }

    lastCalculatedTaxCustomerDetails = taxCustomerDetails;
    publishTaxLocation(taxCustomerDetails);
  }

  // Publishes the entered tax location to the shared store so pricing refreshes
  // triggered outside this page (e.g. discount-code refreshes in the parent) use
  // the address on the form. Only publishes once a country is known, so we never
  // downgrade a set location back to the IP-based fallback (nor let the initial
  // recalculatePriceBreakdown(null) clobber an address already being typed).
  function publishTaxLocation(details: TaxCustomerDetails | null) {
    if (details?.countryCode) {
      $lastTaxCustomerDetailsStore = details;
    }
  }

  function handleStripeLoadingComplete() {
    eventsTracker.trackSDKEvent({
      eventName: SDKEventName.CheckoutPaymentFormImpression,
      properties: {
        mode: defaultPurchaseMode,
      },
    });
    isStripeLoading = false;
  }

  function handleEmailChange(complete: boolean, emailValue: string) {
    email = emailValue;
    isEmailComplete = complete;
    scheduleRefreshTaxes();
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
    scheduleRefreshTaxes();
  }

  function handleAddressInfoChange(
    complete: boolean,
    address: StripeAddressElementChangeEvent["value"]["address"],
  ) {
    isAddressComplete = complete;
    // Publish the address as it's typed so a discount refresh fired before the
    // debounced tax recalculation lands still carries it (instead of falling
    // back to IP geolocation).
    publishTaxLocation({
      countryCode: address.country ?? undefined,
      postalCode: address.postal_code ?? undefined,
      state: address.state ?? undefined,
      city: address.city ?? undefined,
      addressLine1: address.line1 ?? undefined,
      addressLine2: address.line2 ?? undefined,
    });
    scheduleRefreshTaxes();
  }

  /**
   * Debounces tax recalculations triggered by form `change` events. Successive
   * changes within {@link TAX_REFRESH_DEBOUNCE_MS} (e.g. while typing the
   * address) reset the timer, so the recalculation only runs once the customer
   * pauses, avoiding a burst of redundant tax calculations.
   *
   * The loading state is applied immediately (not debounced) so the UI reacts
   * as soon as the customer starts typing, while the actual calculation only
   * fires after the cooldown.
   */
  function scheduleRefreshTaxes(): void {
    if (canRefreshTaxes() && taxCalculationStatus !== "loading") {
      previousTaxCalculationStatus = taxCalculationStatus;
      taxCalculationStatus = "loading";
    }

    if (refreshTaxesTimeout) {
      clearTimeout(refreshTaxesTimeout);
    }
    refreshTaxesTimeout = setTimeout(() => {
      refreshTaxesTimeout = null;
      void refreshTaxes();
    }, TAX_REFRESH_DEBOUNCE_MS);
  }

  async function handleSubmit(e?: Event): Promise<void> {
    e?.preventDefault();

    if (processing) return;

    const event = createCheckoutPaymentFormSubmitEvent({
      selectedPaymentMethod: selectedPaymentMethod ?? null,
    });
    eventsTracker.trackSDKEvent(event);

    processing = true;
    const completed = await submitPayment();

    if (completed) {
      onContinue();
    } else {
      processing = false;
    }
  }

  async function handleExpressCheckoutElementSubmit(
    paymentMethod: string,
    emailValue: string,
  ) {
    selectedPaymentMethod = paymentMethod;
    // If the customerEmail parameter was provided when starting the purchase
    // flow, prefer that value over the email returned by the wallet
    email = customerEmail ?? emailValue;
    await handleSubmit();
  }

  /**
   * Whether a tax recalculation can run given the current form state. Tax
   * refreshes are only valid for card payments once the email, payment
   * information and billing address are complete and tax collection is enabled.
   *
   * The billing address must be complete so we never calculate (and display)
   * taxes from partial or missing address data while the customer is still
   * filling in the Address Element. When full address collection is not enabled,
   * `isAddressComplete` is always true, so this has no effect on that flow.
   */
  function canRefreshTaxes(): boolean {
    return (
      selectedPaymentMethod === "card" &&
      isEmailComplete &&
      isPaymentInfoComplete &&
      isAddressComplete &&
      !processing &&
      taxCalculationStatus !== "disabled"
    );
  }

  /**
   * Refreshes taxes in real-time as the customer enters payment details.
   *
   * This method can only be used for card payments, as it will trigger a native prompt
   * if wallet payment methods (like Apple Pay or Google Pay) are selected.
   *
   * It requires both email and payment information to be complete before execution,
   * otherwise it will trigger validation errors in the payment form.
   *
   * The method performs the following steps with abort protection:
   * 1. Submits the payment elements to get the latest billing details
   * 2. Recalculates taxes based on the extracted customer details
   * 3. Handles any errors that occur during the process
   *
   * The operation is protected with an AbortController to prevent race conditions
   * when multiple tax refresh requests are triggered in quick succession.
   */
  async function refreshTaxes(): Promise<void> {
    if (!canRefreshTaxes()) {
      // The form state may have changed between scheduling the debounced
      // refresh (which optimistically shows the loading skeleton) and this
      // timer firing. If a recalculation is no longer valid, restore the
      // previous status so the UI doesn't get stuck calculating taxes (which
      // would keep the pay button disabled).
      if (taxCalculationStatus === "loading") {
        taxCalculationStatus = previousTaxCalculationStatus;
      }
      return;
    }

    if (taxCalculationStatus !== "loading") {
      previousTaxCalculationStatus = taxCalculationStatus;
      taxCalculationStatus = "loading";
    }

    await withAbortProtection(async (signal) => {
      await submitElements()
        .then(() => signal.throwIfAborted())
        .then(() => recalculateTaxes(signal))
        .then(() => signal.throwIfAborted())
        .catch((e) => {
          if (!signal.aborted) {
            handleErrors(e);
          }
        })
        .finally(() => {
          if (taxCalculationStatus === "loading" && !signal.aborted) {
            taxCalculationStatus = previousTaxCalculationStatus;
          }
        });
    });
  }

  /**
   * Submits the payment process by performing a series of steps with abort protection.
   *
   * This function performs the following steps:
   * 1. Submits the payment elements.
   * 2. Recalculates the taxes if necessary extracting tax details from the payment elements.
   * 3. Ensures the totals match the previous total amount.
   * 4. Completes the checkout process.
   * 5. Confirms the payment elements.
   *
   * If any step is aborted or fails, the function will handle the errors accordingly.
   *
   * @returns {Promise<boolean>} - Returns true if the payment process completes successfully, otherwise false.
   */
  async function submitPayment(): Promise<boolean> {
    return await withAbortProtection(async (signal) => {
      const previousTotal = totalAmountInMicros;
      let confirmationTokenId: string | undefined;

      return await submitElements()
        .then(() => signal.throwIfAborted())
        .then(() => recalculateTaxes(signal))
        .then((newConfirmationTokenId) => {
          confirmationTokenId = newConfirmationTokenId;
        })
        .then(() => signal.throwIfAborted())
        .then(ensureMatchingTotals(previousTotal))
        .then(() => signal.throwIfAborted())
        .then(completeCheckout)
        .then(() => signal.throwIfAborted())
        .then(() => confirmElements(confirmationTokenId))
        .then(() => signal.throwIfAborted())
        .then(() => true)
        .catch((e) => {
          if (!signal.aborted) {
            handleErrors(e);
          }
          return false;
        });
    });
  }

  // Helper function to mitigate multiple calls from happening
  async function withAbortProtection<T>(
    operation: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    const signal = abortController.signal;

    try {
      return await operation(signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // Silently handle abortion
        return Promise.resolve(undefined as T);
      }

      throw error;
    }
  }

  // Helper function to submit the elements
  async function submitElements(): Promise<void> {
    if (!elements) return;
    await StripeService.submitElements(elements);
  }

  // Helper function to recalculate the taxes with customer details extracted from the elements
  async function recalculateTaxes(
    signal?: AbortSignal,
  ): Promise<string | undefined> {
    if (
      taxCalculationStatus === "unavailable" ||
      taxCalculationStatus === "disabled" ||
      !elements ||
      !stripe
    ) {
      return;
    }

    const {
      customerDetails: taxCustomerDetails,
      confirmationTokenId: newConfirmationTokenId,
    } = await StripeService.extractTaxCustomerDetails(elements, stripe);

    signal?.throwIfAborted();

    const lastTaxCustomerDetails = lastCalculatedTaxCustomerDetails;
    const sameDetails =
      taxCustomerDetails.postalCode === lastTaxCustomerDetails?.postalCode &&
      taxCustomerDetails.countryCode === lastTaxCustomerDetails?.countryCode &&
      taxCustomerDetails.state === lastTaxCustomerDetails?.state &&
      taxCustomerDetails.city === lastTaxCustomerDetails?.city &&
      taxCustomerDetails.addressLine1 ===
        lastTaxCustomerDetails?.addressLine1 &&
      taxCustomerDetails.addressLine2 === lastTaxCustomerDetails?.addressLine2;

    if (!sameDetails) {
      await recalculatePriceBreakdown(taxCustomerDetails, signal);
    }

    return newConfirmationTokenId && selectedPaymentMethod !== "card"
      ? newConfirmationTokenId
      : undefined;
  }

  // Helper function to ensure the totals match
  function ensureMatchingTotals(previousTotal: number | null): () => void {
    return () => {
      if (totalAmountInMicros !== previousTotal) {
        throw new TaxCustomerDetailsMissMatchError();
      }
    };
  }

  // Helper function to complete the checkout
  async function completeCheckout(): Promise<void> {
    const completeResponse = await purchaseOperationHelper.checkoutComplete(
      email,
      $translator.selectedLocale,
    );
    const newClientSecret = completeResponse?.gateway_params?.client_secret;
    if (newClientSecret) clientSecret = newClientSecret;
  }

  // Helper function to confirm the elements
  async function confirmElements(confirmationTokenId?: string): Promise<void> {
    if (!stripe || !elements || !clientSecret) return;

    await StripeService.confirmElements(
      stripe,
      elements,
      clientSecret,
      confirmationTokenId,
    );
  }

  // Helper function to handle errors of the tax recalculation or form submission
  async function handleErrors(error: unknown) {
    if (error instanceof TaxCustomerDetailsMissMatchError) {
      taxCalculationStatus = "miss-match";
    } else if (error instanceof PurchaseFlowError) {
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
      } else {
        onError(error);
      }
    } else if (error instanceof StripeServiceError) {
      await handleStripeElementError(error);
    } else {
      throw error;
    }
  }

  async function handleStripeElementError(error: StripeServiceError) {
    const event = createCheckoutPaymentGatewayErrorEvent({
      errorCode: error.gatewayErrorCode ?? "",
      errorMessage: error.message ?? "",
    });
    eventsTracker.trackSDKEvent(event);

    if (error.code === StripeServiceErrorCode.HandledFormError) {
    } else if (error.code === StripeServiceErrorCode.UnhandledFormError) {
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

  const handleErrorTryAgain = () => {
    modalErrorMessage = undefined;
  };
</script>

<div class="rc-checkout-container">
  {#if view === "loading"}
    <div class="rc-loading">
      <Loading />
    </div>
  {/if}

  {#if view === "error"}
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
  <!-- <TextSeparator text="Pay by card" /> -->
  <form
    onsubmit={handleSubmit}
    data-testid="payment-form"
    class="rc-checkout-form"
  >
    <div class="rc-checkout-form-container" class:invisible={view !== "form"}>
      <div class="rc-elements-container">
        <StripeElementsComponent
          bind:stripe
          bind:elements
          stripeAccountId={gatewayParams.stripe_account_id}
          publishableApiKey={gatewayParams.publishable_api_key}
          {elementsConfiguration}
          {brandingInfo}
          {forceEnableWalletMethods}
          skipEmail={!!customerEmail}
          onLoadingComplete={handleStripeLoadingComplete}
          onError={handleStripeElementError}
          onEmailChange={handleEmailChange}
          onPaymentInfoChange={handlePaymentInfoChange}
          onAddressInfoChange={handleAddressInfoChange}
          onExpressCheckoutElementSubmit={handleExpressCheckoutElementSubmit}
          {expressCheckoutOptions}
        />
      </div>

      <div
        class="rc-checkout-price-update-info-container"
        class:fully-hidden={taxCalculationStatus !== "miss-match" ||
          view !== "form"}
      >
        <PriceUpdateInfo {subscriptionOption} />
      </div>

      <div
        class="rc-checkout-pay-container"
        class:fully-hidden={view !== "form"}
      >
        <PaymentButton
          disabled={!isFormReady}
          {subscriptionOption}
          priceBreakdown={brandingInfo?.gateway_tax_collection_enabled
            ? priceBreakdown
            : undefined}
        />

        <div class="rc-checkout-secure-container">
          <SecureCheckoutRc
            {brandingInfo}
            {purchaseOption}
            {termsAndConditionsUrl}
          />
        </div>
      </div>
    </div>
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
    position: relative;
  }

  .rc-checkout-price-update-info-container {
    margin-top: var(--rc-spacing-gapXLarge-mobile);
  }

  .fully-hidden {
    display: none;
    height: 0;
  }

  .rc-checkout-pay-container {
    display: flex;
    flex-direction: column;
    margin-top: var(--rc-spacing-gapXLarge-mobile);
  }

  .rc-checkout-pay-container.fully-hidden {
    display: none;
  }

  .rc-checkout-form-container {
    width: 100%;
  }

  .rc-elements-container {
    /* The standard height of the payment form from Stripe */
    /* Added to avoid the card getting smaller while loading */
    min-height: 210px;
  }

  .rc-checkout-form-container.invisible {
    visibility: hidden;
  }

  .rc-loading {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
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

    .rc-loading {
      position: absolute;
      top: 0;
      left: 0;
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

    .rc-checkout-price-update-info-container {
      margin-top: var(--rc-spacing-gapXLarge-desktop);
    }
  }

  form {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
</style>
