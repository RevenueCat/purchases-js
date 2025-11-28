<script lang="ts">
  import type { Package, Product } from "../../entities/offerings";
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
  } from "@stripe/stripe-js";
  import {
    StripeService,
    StripeServiceError,
  } from "../../stripe/stripe-service";
  import { DEFAULT_FONT_FAMILY } from "../theme/text";
  import { writable } from "svelte/store";
  import { translatorContextKey } from "../localization/constants";
  import { brandingContextKey } from "../constants";
  import type { StripeExpressCheckoutConfiguration } from "../../stripe/stripe-express-checkout-configuration";
  import { getInitialPriceFromPurchaseOption } from "../../helpers/purchase-option-price-helper";
  import type { CheckoutStartResponse } from "../../networking/responses/checkout-start-response";

  import type { ExpressPurchaseButtonProps } from "./express-purchase-button-props";
  import type {
    ClickResolveDetails,
    StripeExpressCheckoutElementClickEvent,
  } from "@stripe/stripe-js/dist/stripe-js/elements/express-checkout";

  const {
    customerEmail,
    appUserId,
    rcPackage,
    purchaseOption,
    metadata,
    brandingInfo,
    purchaseOperationHelper,
    translator,
    onFinished,
    onError,
  }: ExpressPurchaseButtonProps = $props();

  let translatorStore = writable(translator);
  setContext(translatorContextKey, translatorStore);
  setContext(brandingContextKey, brandingInfo?.appearance);

  let isLoading = $state(true);
  let isPurchasing = $state(false);
  let elements: StripeElements | null = $state(null);
  let stripe: Stripe | null = $state(null);

  let expressCheckoutOptions: StripeExpressCheckoutConfiguration | null =
    $state(null);

  const initStripe = async (
    checkoutStartResponse: CheckoutStartResponse,
    rcPackage: Package,
  ) => {
    const gatewayParams = checkoutStartResponse.gateway_params;
    // Aiming for a pure function so that it can be extracted
    // Not assigning any state variable in here.
    const stripeAccountId = gatewayParams.stripe_account_id;
    const publishableApiKey = gatewayParams.publishable_api_key;
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

    if (
      !stripeAccountId ||
      !publishableApiKey ||
      !gatewayParams.elements_configuration
    ) {
      throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
    }

    const { stripe: stripeInstance, elements: elementsInstance } =
      await StripeService.initializeStripe(
        stripeAccountId,
        publishableApiKey,
        gatewayParams.elements_configuration,
        brandingInfo,
        stripeLocale,
        stripeVariables,
        viewport,
      );

    const productDetails: Product = rcPackage.webBillingProduct;
    const subscriptionOption =
      productDetails.subscriptionOptions?.[purchaseOption.id] ||
      productDetails.defaultSubscriptionOption;

    const initialPrice = getInitialPriceFromPurchaseOption(
      productDetails,
      subscriptionOption,
    );

    // Design decision: We will always show the price before taxes in the
    // express checkout modal.
    // We will charge according to the billing address retrieved by the
    // wallet, if any, but it would be visible only in the invoice.
    // This is the behaviour of other IAP stores and we want to be as close
    // as possible to that in this component.
    const priceBreakdown: PriceBreakdown = {
      currency: initialPrice.currency,
      taxCalculationStatus: "unavailable",
      totalAmountInMicros: initialPrice.amountMicros,
      totalExcludingTaxInMicros: initialPrice.amountMicros,
      taxAmountInMicros: null,
      taxBreakdown: null,
    };
    const managementUrl = checkoutStartResponse.management_url;

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

    return { stripeInstance, elementsInstance, expOptions: options };
  };

  const updateStripe = async (
    checkoutStartResponse: CheckoutStartResponse,
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

    let checkoutStartResult: CheckoutStartResponse | null = null;
    try {
      checkoutStartResult = await purchaseOperationHelper.checkoutStart(
        appUserId,
        rcPackage.webBillingProduct.identifier,
        purchaseOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        customerEmail,
        metadata,
      );
    } catch (e) {
      return;
    }

    try {
      if (!stripe || !elements) {
        const { stripeInstance, elementsInstance, expOptions } =
          await initStripe(checkoutStartResult, rcPackage);
        stripe = stripeInstance;
        elements = elementsInstance;
        expressCheckoutOptions = expOptions;
      } else {
        await updateStripe(checkoutStartResult, elements);
      }
    } catch (e) {
      onError(e as PurchaseFlowError);
    }

    isLoading = false;
  };

  $effect(() => {
    checkoutStarted = false;
    reInitPurchase().then(() => {});
  });

  const onStripeElementsLoadingError = (_: StripeServiceError) => {
    onError(
      new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase),
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
    await purchaseOperationHelper.checkoutCalculateTax(
      taxCustomerDetails.countryCode,
      taxCustomerDetails.postalCode,
    );

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

    const newConfirmationToken = await updateTaxCalculationBasedOnWalletDetails(
      elements,
      stripe,
    );

    await StripeService.confirmElements(
      stripe,
      elements,
      newClientSecret,
      newConfirmationToken,
    );

    return true;
  }

  const onExpressCheckoutElementSubmit = async (
    _: string,
    emailValue: string,
    event: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    if (isPurchasing) {
      return;
    }
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
        onError(e);
      }
      // TODO: Improve the error message here.
      // Notifies the modal that something went wrong with the payment
      event.paymentFailed();
      isPurchasing = false;
    }
  };

  const onExpressClicked = (event: StripeExpressCheckoutElementClickEvent) => {
    const productDetails: Product = rcPackage.webBillingProduct;
    const subscriptionOption =
      productDetails.subscriptionOptions?.[purchaseOption.id] ||
      productDetails.defaultSubscriptionOption;

    const initialPrice = getInitialPriceFromPurchaseOption(
      productDetails,
      subscriptionOption,
    );

    // Design decision: We will always show the price before taxes in the
    // express checkout modal.
    // We will charge according to the billing address retrieved by the
    // wallet, if any, but it would be visible only in the invoice.
    // This is the behaviour of other IAP stores and we want to be as close
    // as possible to that in this component.
    const priceBreakdown: PriceBreakdown = {
      currency: initialPrice.currency,
      taxCalculationStatus: "unavailable",
      totalAmountInMicros: initialPrice.amountMicros,
      totalExcludingTaxInMicros: initialPrice.amountMicros,
      taxAmountInMicros: null,
      taxBreakdown: null,
    };

    const options =
      StripeService.buildStripeExpressCheckoutOptionsForSubscription(
        productDetails,
        priceBreakdown,
        subscriptionOption,
        translator,
        // TODO: change this
        "http://example.com",
      );

    event.resolve({ applePay: options.applePay } as ClickResolveDetails);
  };
</script>

<div>
  {#if !isLoading && elements && expressCheckoutOptions && brandingInfo}
    <ExpressCheckoutElement
      {elements}
      onError={onStripeElementsLoadingError}
      onSubmit={onExpressCheckoutElementSubmit}
      onClick={onExpressClicked}
      {expressCheckoutOptions}
      forceEnableWalletMethods={false}
      billingAddressRequired={brandingInfo?.gateway_tax_collection_enabled}
      hideCheckoutSeparator={true}
    />
  {/if}
</div>
