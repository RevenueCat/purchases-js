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
  import type { Stripe, StripeElements } from "@stripe/stripe-js";
  import { StripeService, StripeServiceError } from "../stripe/stripe-service";
  import { getInitialPriceFromPurchaseOption } from "../helpers/purchase-option-price-helper";
  import type { TaxBreakdown } from "../networking/responses/checkout-calculate-tax-response";
  import { DEFAULT_FONT_FAMILY } from "./theme/text";
  import { writable } from "svelte/store";
  import { translatorContextKey } from "./localization/constants";
  import { brandingContextKey } from "./constants";

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

  let priceBreakdown: PriceBreakdown = $derived({
    currency: initialPrice.currency,
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

  const initStripe = async () => {
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
    purchaseOperationHelper
      .checkoutStart(
        appUserId,
        productId,
        purchaseOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        email,
        metadata,
      )
      .then((result) => {
        gatewayParams = result.gateway_params;
        managementUrl = result.management_url;
        initStripe();
      });
  });

  const onStripeElementsLoadingError = (_: StripeServiceError) => {
    onError(
      new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase),
    );
  };

  const onExpressCheckoutElementReady = () => {};

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

  async function submitPayment(email: string): Promise<boolean> {
    if (!elements || !stripe) return false;
    await StripeService.submitElements(elements);
    const { confirmationTokenId } =
      await StripeService.extractTaxCustomerDetails(elements, stripe);
    // TODO: Deal with taxes here.
    const newClientSecret = await completeCheckout(email);
    await confirmElements(confirmationTokenId, newClientSecret ?? undefined);
    return true;
  }

  const onExpressCheckoutElementSubmit = (_: string, emailValue: string) => {
    if (busy) {
      return;
    }
    busy = true;
    submitPayment(emailValue).then((success) => {
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
    });
  };

  const billingAddressRequired = true;
</script>

<div>
  {#if !isLoading && elements}
    <ExpressCheckoutElement
      {elements}
      onError={onStripeElementsLoadingError}
      onReady={onExpressCheckoutElementReady}
      onSubmit={onExpressCheckoutElementSubmit}
      {expressCheckoutOptions}
      {billingAddressRequired}
      hideOtherOptions={true}
    />
  {/if}
</div>
