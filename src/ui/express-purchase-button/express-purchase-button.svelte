<script lang="ts">
  import type {
    Package,
    Product,
    SubscriptionOption,
  } from "../../entities/offerings";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../../helpers/purchase-operation-helper";
  import { type PriceBreakdown } from "../ui-types";
  import ExpressCheckoutElement from "../molecules/stripe-express-checkout-element.svelte";
  import { setContext } from "svelte";
  import type {
    Stripe,
    StripeElements,
    StripeExpressCheckoutElementConfirmEvent,
    StripeExpressCheckoutElementReadyEvent,
  } from "@stripe/stripe-js";
  import {
    StripeService,
    StripeServiceError,
  } from "../../stripe/stripe-service";
  import {
    type StripeElementsConfiguration,
    StripeElementsMode,
    StripeElementsSetupFutureUsage,
  } from "../../networking/responses/stripe-elements";
  import { DEFAULT_FONT_FAMILY } from "../theme/text";
  import { writable } from "svelte/store";
  import { translatorContextKey } from "../localization/constants";
  import { brandingContextKey } from "../constants";
  import type { StripeExpressCheckoutConfiguration } from "../../stripe/stripe-express-checkout-configuration";
  import { getInitialPriceFromPurchaseOption } from "../../helpers/purchase-option-price-helper";
  import type { WebBillingCheckoutStartResponse } from "../../networking/responses/checkout-start-response";
  import type { GetClientCredentialsResponse } from "../../networking/responses/get-client-credentials-response";

  import type { ExpressPurchaseButtonProps } from "./express-purchase-button-props";
  import type {
    ClickResolveDetails,
    StripeExpressCheckoutElementClickEvent,
  } from "@stripe/stripe-js/dist/stripe-js/elements/express-checkout";
  import type { IEventsTracker } from "../../behavioural-events/events-tracker";
  import {
    createCheckoutFlowErrorEvent,
    createCheckoutPaymentFormSubmitEvent,
    createCheckoutPaymentGatewayErrorEvent,
    createCheckoutPaymentTaxCalculationEvent,
    createCheckoutSessionEndClosedEvent,
    createCheckoutSessionStartEvent,
  } from "../../behavioural-events/sdk-event-helpers";
  import type { SDKEventPurchaseMode } from "../../behavioural-events/event";

  const {
    customerEmail,
    appUserId,
    rcPackage,
    purchaseOption,
    metadata,
    brandingInfo,
    eventsTracker,
    purchaseOperationHelper,
    translator,
    onFinished,
    onError,
    onReady,
  }: ExpressPurchaseButtonProps = $props();

  const mode: SDKEventPurchaseMode = "express_purchase_button";

  let translatorStore = writable(translator);
  setContext(translatorContextKey, translatorStore);
  setContext(brandingContextKey, brandingInfo?.appearance);

  let isLoading = $state(true);
  let isPurchasing = $state(false);
  let elements: StripeElements | null = $state(null);
  let stripe: Stripe | null = $state(null);

  let expressCheckoutOptions: StripeExpressCheckoutConfiguration | null =
    $state(null);

  const handleError = (error: PurchaseFlowError) => {
    const event = createCheckoutFlowErrorEvent({
      errorCode: error.getErrorCode().toString(),
      errorMessage: error.message,
      mode,
    });
    (eventsTracker as IEventsTracker).trackSDKEvent(event);
    onError(error);
  };

  const initStripe = async (
    clientCredentialsResponse: GetClientCredentialsResponse,
    rcPackage: Package,
  ) => {
    const gatewayParams = clientCredentialsResponse.stripe_gateway_params;
    // Aiming for a pure function so that it can be extracted
    // Not assigning any state variable in here.
    const stripeAccountId = gatewayParams?.stripe_account_id;
    const publishableApiKey = gatewayParams?.publishable_api_key;
    const stripeLocale = StripeService.getStripeLocale(
      translator.bcp47Locale || translator.fallbackBcp47Locale,
    );

    const stripeVariables = {
      // Floating labels size cannot be overriden in Stripe since `!important` is being used.
      // There we set fontSizeBase to the desired label size
      // and update the input font size to 16px.
      fontSizeBase: "14px",
      fontFamily: DEFAULT_FONT_FAMILY,
      // Spacing is hardcoded to 16px to match the desired gaps in mobile/desktop
      // which do not match the design system spacing. Also we cannot use "rem" units
      // since the fontSizeBase is set to 14px per the comment above.
      spacingGridRow: "16px",
    };

    const isMobile =
      window.matchMedia && window.matchMedia("(max-width: 767px)").matches;

    let viewport: "mobile" | "desktop" = "mobile";

    if (isMobile) {
      viewport = "mobile";
    } else {
      viewport = "desktop";
    }

    if (!stripeAccountId || !publishableApiKey) {
      throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
    }

    const productDetails: Product = rcPackage.webBillingProduct;
    const { priceBreakdown } = resolveExpressCheckoutPricingDetails(
      productDetails,
      purchaseOption.id,
    );
    const elementsConfiguration: StripeElementsConfiguration = {
      mode: StripeElementsMode.Payment,
      payment_method_types: ["card"],
      setup_future_usage: StripeElementsSetupFutureUsage.OffSession,
      amount: StripeService.microsToMinimumAmountPrice(
        priceBreakdown.totalAmountInMicros,
        priceBreakdown.currency,
      ),
      currency: priceBreakdown.currency.toLowerCase(),
    };

    const { stripe: stripeInstance, elements: elementsInstance } =
      await StripeService.initializeStripe(
        stripeAccountId,
        publishableApiKey,
        elementsConfiguration,
        brandingInfo,
        stripeLocale,
        stripeVariables,
        viewport,
      );

    const options = {
      layout: {
        maxRows: 2,
        maxColumns: 1,
      },
    } as StripeExpressCheckoutConfiguration;

    return { stripeInstance, elementsInstance, expOptions: options };
  };

  const updateStripe = async (
    checkoutStartResponse: WebBillingCheckoutStartResponse,
    elements: StripeElements,
  ) => {
    if (!checkoutStartResponse.gateway_params?.elements_configuration) {
      throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
    }

    StripeService.updateElementsConfiguration(
      elements,
      checkoutStartResponse.gateway_params.elements_configuration,
    );
  };

  let checkoutStarted = false;
  const reInitPurchase = async () => {
    if (checkoutStarted) {
      return;
    }
    checkoutStarted = true;
    let clientCredentialsResult: GetClientCredentialsResponse;
    try {
      clientCredentialsResult =
        await purchaseOperationHelper.getClientCredentials();
    } catch (e) {
      handleError(e as PurchaseFlowError);
      return;
    }

    try {
      if (!stripe || !elements) {
        const { stripeInstance, elementsInstance, expOptions } =
          await initStripe(clientCredentialsResult, rcPackage);
        stripe = stripeInstance;
        elements = elementsInstance;
        expressCheckoutOptions = expOptions;
      }
    } catch (e) {
      handleError(e as PurchaseFlowError);
      return;
    }

    isLoading = false;
  };

  $effect(() => {
    checkoutStarted = false;
    reInitPurchase().then(() => {});
  });

  const onStripeElementsLoadingError = (error: StripeServiceError) => {
    const gatewayEvent = createCheckoutPaymentGatewayErrorEvent({
      errorCode: error.gatewayErrorCode ?? null,
      errorMessage: error.message ?? "",
      mode,
    });
    (eventsTracker as IEventsTracker).trackSDKEvent(gatewayEvent);

    handleError(
      new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "Failed to initialize payment form",
        error.message,
      ),
    );
  };

  const updateTaxCalculationBasedOnWalletDetails = async (
    elements: StripeElements,
    stripe: Stripe,
  ) => {
    const {
      customerDetails: taxCustomerDetails,
      confirmationTokenId: newConfirmationTokenId,
    } = await StripeService.extractTaxCustomerDetails(elements, stripe);

    if (brandingInfo?.gateway_tax_collection_enabled) {
      const taxCalculation = await purchaseOperationHelper.checkoutCalculateTax(
        taxCustomerDetails.countryCode,
        taxCustomerDetails.postalCode,
      );

      const taxEvent = createCheckoutPaymentTaxCalculationEvent({
        taxCalculation,
        taxCustomerDetails,
        mode,
      });
      (eventsTracker as IEventsTracker).trackSDKEvent(taxEvent);
    }

    return newConfirmationTokenId;
  };

  async function submitPayment(email: string): Promise<boolean> {
    if (!elements || !stripe) return false;

    await StripeService.submitElements(elements);

    const completeResponse =
      await purchaseOperationHelper.checkoutComplete(email);
    const newClientSecret = completeResponse?.gateway_params?.client_secret;

    if (!newClientSecret) {
      return false;
    }

    const newConfirmationToken = brandingInfo?.gateway_tax_collection_enabled
      ? await updateTaxCalculationBasedOnWalletDetails(elements, stripe)
      : undefined;

    await StripeService.confirmElements(
      stripe,
      elements,
      newClientSecret,
      newConfirmationToken,
    );

    return true;
  }

  const onExpressCheckoutElementSubmit = async (
    paymentMethod: string,
    emailValue: string,
    event: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    if (isPurchasing) {
      return;
    }

    const submitEvent = createCheckoutPaymentFormSubmitEvent({
      selectedPaymentMethod: paymentMethod ?? null,
      mode,
    });
    (eventsTracker as IEventsTracker).trackSDKEvent(submitEvent);

    isPurchasing = true;
    try {
      const success = await submitPayment(emailValue);
      isPurchasing = false;
      if (!success) {
        return;
      }
      const pollResult =
        await purchaseOperationHelper.pollCurrentPurchaseForCompletion();
      onFinished(pollResult);
      isPurchasing = false;
    } catch (e) {
      if (e instanceof PurchaseFlowError) {
        handleError(e);
      } else if (e instanceof StripeServiceError) {
        const gatewayEvent = createCheckoutPaymentGatewayErrorEvent({
          errorCode: e.gatewayErrorCode ?? null,
          errorMessage: e.message ?? "",
          mode,
        });
        (eventsTracker as IEventsTracker).trackSDKEvent(gatewayEvent);

        handleError(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            "Failed to complete payment",
            e.message,
          ),
        );
      }
      // TODO: Improve the error message here.
      // Notifies the modal that something went wrong with the payment
      // if the modal it's still open.
      // The modal could be closed by a stripe.createConfirmationToken invocation.
      event.paymentFailed();
      isPurchasing = false;
    }
  };

  const startCheckout = async () => {
    const sessionStartEvent = createCheckoutSessionStartEvent({
      appearance: brandingInfo?.appearance,
      rcPackage,
      purchaseOptionToUse: purchaseOption,
      customerEmail,
      mode: "express_purchase_button",
    });
    eventsTracker.trackSDKEvent(sessionStartEvent);
    try {
      const checkoutStartResult = await purchaseOperationHelper.checkoutStart(
        appUserId,
        rcPackage.webBillingProduct.identifier,
        purchaseOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        customerEmail,
        metadata,
      );

      const managementUrl = checkoutStartResult.management_url;

      if (!elements) {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        );
      }

      await updateStripe(checkoutStartResult, elements);
      const productDetails: Product = rcPackage.webBillingProduct;
      if (!managementUrl) {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        );
      }
      const { subscriptionOption, priceBreakdown } =
        resolveExpressCheckoutPricingDetails(productDetails, purchaseOption.id);

      const options =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          productDetails,
          priceBreakdown,
          subscriptionOption,
          translator,
          managementUrl,
          2,
          1,
        );

      return { applePay: options.applePay } as ClickResolveDetails;
    } catch (error) {
      handleError(
        error instanceof PurchaseFlowError
          ? error
          : new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase),
      );
      throw error;
    }
  };

  const onExpressClicked = (event: StripeExpressCheckoutElementClickEvent) => {
    startCheckout().then((options) => event.resolve(options));
  };

  const onExpressCancelled = () => {
    eventsTracker.trackSDKEvent(
      createCheckoutSessionEndClosedEvent({ mode: "express_purchase_button" }),
    );
  };

  // Extracted helper: pick the subscription option chosen for the Express Checkout flow.
  function getSubscriptionOptionForExpressCheckout(
    productDetails: Product,
    purchaseOptionId: string,
  ): SubscriptionOption {
    const subscriptionOption =
      productDetails.subscriptionOptions?.[purchaseOptionId] ||
      productDetails.defaultSubscriptionOption;

    if (!subscriptionOption) {
      throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
    }

    return subscriptionOption;
  }

  // Extracted helper: build the price breakdown displayed inside the Express Checkout modal.
  function buildExpressCheckoutPriceBreakdown(
    productDetails: Product,
    subscriptionOption: SubscriptionOption,
  ): PriceBreakdown {
    const initialPrice = getInitialPriceFromPurchaseOption(
      productDetails,
      subscriptionOption,
    );

    // Design decision: We will always show the price before taxes in the
    // express checkout modal.
    // We will charge, according to the billing address retrieved by the
    // wallet, if any, but it would be visible only in the invoice.
    // This is the behavior of other IAP stores, and we want to be as close
    // as possible to that in this component.
    return {
      currency: initialPrice.currency,
      taxCalculationStatus: "unavailable",
      totalAmountInMicros: initialPrice.amountMicros,
      totalExcludingTaxInMicros: initialPrice.amountMicros,
      taxAmountInMicros: null,
      taxBreakdown: null,
    };
  }

  // Extracted helper: return the subscription option and price data needed by multiple flows.
  function resolveExpressCheckoutPricingDetails(
    productDetails: Product,
    purchaseOptionId: string,
  ) {
    const subscriptionOption = getSubscriptionOptionForExpressCheckout(
      productDetails,
      purchaseOptionId,
    );
    const priceBreakdown = buildExpressCheckoutPriceBreakdown(
      productDetails,
      subscriptionOption,
    );
    return { subscriptionOption, priceBreakdown };
  }

  function onExpressCheckoutElementReady(
    event: StripeExpressCheckoutElementReadyEvent,
  ) {
    const anyWalletAvailable =
      event.availablePaymentMethods?.applePay ||
      event.availablePaymentMethods?.googlePay;
    onReady && onReady(!!anyWalletAvailable);
  }
</script>

<div>
  {#if !isLoading && elements && expressCheckoutOptions && brandingInfo}
    <ExpressCheckoutElement
      {elements}
      onError={onStripeElementsLoadingError}
      onSubmit={onExpressCheckoutElementSubmit}
      onClick={onExpressClicked}
      onCancel={onExpressCancelled}
      onReady={onExpressCheckoutElementReady}
      {expressCheckoutOptions}
      forceEnableWalletMethods={false}
      billingAddressRequired={brandingInfo?.gateway_tax_collection_enabled}
      hideCheckoutSeparator={true}
    />
  {/if}
</div>
