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
  import type { PriceBreakdown, TaxCalculationStatus } from "./ui-types";
  import type { GatewayParams } from "../networking/responses/stripe-elements";
  import ExpressCheckoutElement from "./molecules/stripe-express-checkout-element.svelte";
  import { onMount, setContext } from "svelte";
  import type {
    Stripe,
    StripeElements,
    StripeExpressCheckoutElementConfirmEvent,
  } from "@stripe/stripe-js";
  import { StripeService, StripeServiceError } from "../stripe/stripe-service";
  import { getInitialPriceFromPurchaseOption } from "../helpers/purchase-option-price-helper";
  import type { TaxBreakdown } from "../networking/responses/checkout-calculate-tax-response";
  import { DEFAULT_FONT_FAMILY } from "./theme/text";
  import { writable } from "svelte/store";
  import { translatorContextKey } from "./localization/constants";
  import { brandingContextKey } from "./constants";
  import type {
    StripeExpressCheckoutElementClickEvent,
    StripeExpressCheckoutElementReadyEvent,
    StripeExpressCheckoutElementShippingAddressChangeEvent,
  } from "@stripe/stripe-js/dist/stripe-js/elements/express-checkout";
  import type { ApplePayUpdateOption } from "@stripe/stripe-js/dist/stripe-js/elements/apple-pay";

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

  let email = customerEmail;
  let gatewayParams: GatewayParams = $state({});
  let managementUrl: string | null = $state(null);
  let isLoading = $state(true);
  let elements: StripeElements | null = $state(null);
  let stripe: Stripe | null = $state(null);
  let busy = $state(false);

  let productDetails: Product = rcPackage.webBillingProduct;
  const subscriptionOption =
    productDetails.subscriptionOptions?.[purchaseOption.id];

  const initialPrice = getInitialPriceFromPurchaseOption(
    productDetails,
    purchaseOption,
  );
  let taxCalculationStatus: TaxCalculationStatus = $state<TaxCalculationStatus>(
    brandingInfo?.gateway_tax_collection_enabled ? "unavailable" : "disabled",
  );
  let taxAmountInMicros: number | null = $state(null);
  let taxBreakdown: TaxBreakdown[] | null = $state(null);
  let totalExcludingTaxInMicros: number | null = $state(
    initialPrice.amountMicros,
  );
  let totalAmountInMicros: number | null = $state(initialPrice.amountMicros);
  let currency: string = $state(initialPrice.currency);

  let priceBreakdown: PriceBreakdown = $derived({
    currency: currency,
    totalAmountInMicros,
    totalExcludingTaxInMicros,
    taxCalculationStatus,
    taxAmountInMicros,
    taxBreakdown,
  });

  let expressCheckoutOptions = $derived(
    subscriptionOption && managementUrl && priceBreakdown
      ? StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          productDetails,
          priceBreakdown,
          subscriptionOption,
          translator,
          managementUrl,
        )
      : undefined,
  );

  const productId = rcPackage.webBillingProduct.identifier ?? null;

  let translatorStore = writable(translator);
  setContext(translatorContextKey, translatorStore);
  setContext(brandingContextKey, brandingInfo?.appearance);

  const initStripe = async (gatewayParams: GatewayParams) => {
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
      onError(
        new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase),
      );
      return;
    }

    StripeService.initializeStripe(
      stripeAccountId,
      publishableApiKey,
      gatewayParams.elements_configuration,
      brandingInfo,
      stripeLocale,
      stripeVariables,
      viewport,
    )
      .then(({ stripe: stripeInstance, elements: elementsInstance }) => {
        stripe = stripeInstance;
        elements = elementsInstance;
        isLoading = false;
      })
      .catch((error) => {
        onError(error);
      });
  };

  onMount(async () => {
    if (managementUrl) {
      return;
    }

    const checkoutStartResult = await purchaseOperationHelper.checkoutStart(
      appUserId,
      productId,
      purchaseOption,
      rcPackage.webBillingProduct.presentedOfferingContext,
      email,
      metadata,
    );

    managementUrl = checkoutStartResult.management_url;
    gatewayParams = checkoutStartResult.gateway_params;

    const calculationResponse =
      await purchaseOperationHelper.checkoutCalculateTax();
    totalExcludingTaxInMicros =
      calculationResponse.total_excluding_tax_in_micros;
    taxAmountInMicros = calculationResponse.total_amount_in_micros;
    taxBreakdown = calculationResponse.tax_breakdown;
    totalExcludingTaxInMicros =
      calculationResponse.total_excluding_tax_in_micros;
    currency = calculationResponse.currency;
    gatewayParams = { ...gatewayParams, ...calculationResponse.gateway_params };

    await initStripe(gatewayParams);
  });

  const onStripeElementsLoadingError = (_: StripeServiceError) => {
    onError(
      new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase),
    );
  };

  const onExpressCheckoutElementReady = (
    evt: StripeExpressCheckoutElementReadyEvent,
  ) => {
    console.log(evt);
  };

  const onShippingAddressChange = (
    evt: StripeExpressCheckoutElementShippingAddressChangeEvent,
  ) => {
    if (!elements) {
      return;
    }

    if (!expressCheckoutOptions) {
      return;
    }

    evt.resolve({
      applePay: expressCheckoutOptions.applePay as ApplePayUpdateOption,
    });
  };

  const onClick = (e: StripeExpressCheckoutElementClickEvent) => {
    console.log(e);
  };

  // Helper function to confirm the elements
  async function confirmElements(
    confirmationTokenId?: string,
    clientSecret?: string,
  ): Promise<void> {
    if (!stripe || !elements || !clientSecret) return;

    await StripeService.confirmElements(
      stripe,
      elements,
      clientSecret,
      confirmationTokenId,
    );
  }

  // Helper function to complete the checkout
  async function completeCheckout(
    email: string,
  ): Promise<string | null | undefined> {
    const completeResponse =
      await purchaseOperationHelper.checkoutComplete(email);
    return completeResponse?.gateway_params?.client_secret;
  }

  async function submitPayment(
    email: string,
    event: StripeExpressCheckoutElementConfirmEvent,
  ): Promise<boolean> {
    if (!elements || !stripe) return false;
    const billingAddress = event.billingDetails?.address;

    const billingDetails = {
      countryCode: billingAddress?.country ?? undefined,
      postalCode: billingAddress?.postal_code ?? undefined,
    };

    const calculationResponse =
      await purchaseOperationHelper.checkoutCalculateTax(
        billingDetails.countryCode,
        billingDetails.postalCode,
      );
    totalExcludingTaxInMicros =
      calculationResponse.total_excluding_tax_in_micros;
    taxAmountInMicros = calculationResponse.total_amount_in_micros;
    taxBreakdown = calculationResponse.tax_breakdown;
    totalExcludingTaxInMicros =
      calculationResponse.total_excluding_tax_in_micros;
    currency = calculationResponse.currency;
    const newGatewayParams = {
      ...gatewayParams,
      ...calculationResponse.gateway_params,
    };
    gatewayParams = newGatewayParams;

    /**
     const newPB: PriceBreakdown = {
     currency: currency,
     totalAmountInMicros: totalAmountInMicros!,
     totalExcludingTaxInMicros,
     taxCalculationStatus,
     taxAmountInMicros,
     taxBreakdown,
     };

     const newCheckoutOptions = StripeService.buildStripeExpressCheckoutOptionsForSubscription(
     productDetails,
     newPB,
     subscriptionOption,
     translator,
     managementUrl!,
     );


     if (totalAmountInMicros !== calculationResponse.total_amount_in_micros || taxAmountInMicros !== calculationResponse.tax_amount_in_micros) {
     console.log("failing payment due to tax change");
     event.paymentFailed({
     message: "Different taxes apply for this card.",
     });

     setTimeout(() => {
     if (!elements) {
     return;
     }

     StripeService.updateElementsConfiguration(elements, newGatewayParams.elements_configuration);
     StripeService.updateExpressCheckoutElement(
     elements,
     newCheckoutOptions,
     );
     elements.getElement('expressCheckout')?.blur()
     }, 500);


     return false;
     }
     **/

    await StripeService.submitElements(elements);
    const newClientSecret = await completeCheckout(email);
    const { confirmationTokenId } =
      await StripeService.extractTaxCustomerDetails(elements, stripe);
    await confirmElements(confirmationTokenId, newClientSecret ?? undefined);
    return true;
  }

  const onExpressCheckoutElementSubmit = (
    _: string,
    emailValue: string,
    event: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    if (busy) {
      return;
    }
    busy = true;

    submitPayment(emailValue, event)
      .then((success) => {
        busy = false;
        if (!success) {
          return;
        }
        purchaseOperationHelper
          .pollCurrentPurchaseForCompletion()
          .then((pollResult) => {
            onFinished(pollResult);
          })
          .catch((error: PurchaseFlowError) => {
            onError(error);
          });
      })
      .catch((_) => (busy = false));
  };

  const billingAddressRequired = true;
</script>

<div>
  {#if !isLoading && elements}
    <ExpressCheckoutElement
      {elements}
      onError={onStripeElementsLoadingError}
      onReady={onExpressCheckoutElementReady}
      {onShippingAddressChange}
      onSubmit={onExpressCheckoutElementSubmit}
      {onClick}
      {expressCheckoutOptions}
      {billingAddressRequired}
      hideOtherOptions={true}
    />
  {/if}
</div>
