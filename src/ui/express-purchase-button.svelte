<script lang="ts">
  import type {
    Package,
    Product,
    PurchaseMetadata,
    PurchaseOption,
  } from "../entities/offerings";
  import type { BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Purchases } from "../main";
  import type { IEventsTracker } from "../behavioural-events/events-tracker";
  import {
    OperationSessionSuccessfulResult,
    PurchaseFlowError,
    PurchaseFlowErrorCode,
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";
  import {
    type CustomTranslations,
    Translator,
  } from "./localization/translator";
  import { type PriceBreakdown } from "./ui-types";
  import ExpressCheckoutElement from "./molecules/stripe-express-checkout-element.svelte";
  import { onMount, setContext } from "svelte";
  import type {
    Stripe,
    StripeElements,
    StripeExpressCheckoutElementConfirmEvent,
  } from "@stripe/stripe-js";
  import { StripeService, StripeServiceError } from "../stripe/stripe-service";
  import { DEFAULT_FONT_FAMILY } from "./theme/text";
  import { writable } from "svelte/store";
  import { translatorContextKey } from "./localization/constants";
  import { brandingContextKey } from "./constants";
  import type { StripeExpressCheckoutConfiguration } from "../stripe/stripe-express-checkout-configuration";
  import { getInitialPriceFromPurchaseOption } from "../helpers/purchase-option-price-helper";
  import type { CheckoutStartResponse } from "../networking/responses/checkout-start-response";

  interface Props {
    customerEmail: string | undefined;
    appUserId: string;
    rcPackage: Package;
    purchaseOption: PurchaseOption;
    metadata: PurchaseMetadata | undefined;
    brandingInfo: BrandingInfoResponse | null;
    purchases: Purchases;
    eventsTracker: IEventsTracker;
    purchaseOperationHelper: PurchaseOperationHelper;
    customTranslations?: CustomTranslations;
    translator: Translator;
    onFinished: (operationResult: OperationSessionSuccessfulResult) => void;
    onError: (error: PurchaseFlowError) => void;
  }

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
  }: Props = $props();

  const productId = rcPackage.webBillingProduct.identifier ?? null;

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
      translator.locale || translator.fallbackLocale,
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
      productDetails.subscriptionOptions?.[purchaseOption.id];

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
      );

    return { stripeInstance, elementsInstance, expOptions: options };
  };

  let checkoutStarted = false;
  onMount(async () => {
    if (checkoutStarted) {
      return;
    }
    checkoutStarted = true;

    const checkoutStartResult = await purchaseOperationHelper.checkoutStart(
      appUserId,
      productId,
      purchaseOption,
      rcPackage.webBillingProduct.presentedOfferingContext,
      customerEmail,
      metadata,
    );

    try {
      const { stripeInstance, elementsInstance, expOptions } = await initStripe(
        checkoutStartResult,
        rcPackage,
      );

      stripe = stripeInstance;
      elements = elementsInstance;
      expressCheckoutOptions = expOptions;
    } catch (e) {
      onError(e as PurchaseFlowError);
    }

    isLoading = false;
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

    // We'll charge the customer with the ip based tax.
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
</script>

<div>
  {#if !isLoading && elements && expressCheckoutOptions && brandingInfo}
    <ExpressCheckoutElement
      {elements}
      onError={onStripeElementsLoadingError}
      onSubmit={onExpressCheckoutElementSubmit}
      {expressCheckoutOptions}
      forceEnableWalletMethods={true}
      billingAddressRequired={brandingInfo?.gateway_tax_collection_enabled}
      hideOtherOptions={true}
    />
  {/if}
</div>
