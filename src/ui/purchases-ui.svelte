<script lang="ts">
  import { onMount, setContext, onDestroy } from "svelte";
  import {
    type Package,
    type Product,
    type PurchaseOption,
    type Purchases,
  } from "../main";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";

  import {
    type OperationSessionSuccessfulResult,
    PurchaseFlowError,
    PurchaseFlowErrorCode,
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";

  import {
    type CustomTranslations,
    Translator,
  } from "./localization/translator";
  import { translatorContextKey } from "./localization/constants";
  import { type CurrentPage } from "./ui-types";
  import PurchasesUiInner from "./purchases-ui-inner.svelte";
  import { type IEventsTracker } from "../behavioural-events/events-tracker";
  import { eventsTrackerContextKey, brandingContextKey } from "./constants";
  import { createCheckoutFlowErrorEvent } from "../behavioural-events/sdk-event-helpers";
  import type { PurchaseMetadata } from "../entities/offerings";
  import type {
    AttributionMetadata,
    WorkflowPurchaseContext,
  } from "../entities/purchase-params";
  import { get, writable } from "svelte/store";
  import type { BrandingAppearance } from "../entities/branding";
  import type { TaxCustomerDetails } from "../stripe/stripe-service";
  import { type GatewayParams } from "../networking/responses/stripe-elements";
  import {
    CheckoutPricingFailedReason,
    type CheckoutPricingResponse,
    createPriceBreakdownFromCheckoutPricingResponse,
  } from "../networking/responses/checkout-pricing-response";
  import { validateEmail } from "../helpers/validators";
  import type { PriceBreakdown, TaxCalculationStatus } from "./ui-types";
  import { getActiveCheckoutPurchaseOption } from "../helpers/checkout-session-purchase-option-helper";

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
    selectedLocale: string;
    defaultLocale: string;
    customTranslations?: CustomTranslations;
    isInElement: boolean;
    skipSuccessPage: boolean;
    showDiscountCodeField: boolean;
    discountCode?: string;
    onDiscountCodeChanged?: (discountCode: string | null) => void;
    termsAndConditionsUrl?: string;
    checkoutConsentRequired?: boolean;
    workflowPurchaseContext?: WorkflowPurchaseContext;
    attributionMetadata?: AttributionMetadata;
    paywallId?: string;
    paywallSessionId?: string;
    onFinished: (operationResult: OperationSessionSuccessfulResult) => void;
    onError: (error: PurchaseFlowError) => void;
    onClose: (() => void) | undefined;
    hideBackButton?: boolean;
  }

  const {
    customerEmail,
    appUserId,
    rcPackage,
    purchaseOption,
    metadata,
    brandingInfo,
    purchases,
    eventsTracker,
    purchaseOperationHelper,
    selectedLocale,
    defaultLocale,
    customTranslations = {},
    isInElement,
    skipSuccessPage = false,
    showDiscountCodeField = false,
    discountCode = undefined,
    onDiscountCodeChanged,
    termsAndConditionsUrl,
    checkoutConsentRequired = false,
    workflowPurchaseContext,
    attributionMetadata,
    paywallId,
    paywallSessionId,
    onFinished,
    onError,
    onClose,
    hideBackButton = false,
  }: Props = $props();

  const emailError = customerEmail ? validateEmail(customerEmail) : null;
  let email = $state(emailError ? undefined : customerEmail);

  let productDetails: Product = $state(rcPackage.webBillingProduct);
  let latestCheckoutPricingResponse = $state<CheckoutPricingResponse | null>(
    null,
  );
  // Shared with the payment entry page so that every pricing refresh (including
  // discount-code refreshes triggered here) forwards the latest known tax
  // location. It stays null until the customer provides an address.
  const lastTaxCustomerDetailsStore = writable<TaxCustomerDetails | null>(null);
  let purchaseOptionToUse: PurchaseOption = $derived(
    getActiveCheckoutPurchaseOption(
      productDetails,
      purchaseOption,
      latestCheckoutPricingResponse,
    ),
  );
  let lastError: PurchaseFlowError | null = $state(null);
  let draftDiscountCode = $state(discountCode ?? "");
  let discountCodeError: string | null = $state(null);
  let isUpdatingDiscountCode = $state(false);
  let isPaymentProcessing = $state(false);

  let currentPage: CurrentPage = $state("payment-entry-loading");
  let operationResult: OperationSessionSuccessfulResult | null = $state(null);
  let initialGatewayParams: GatewayParams = $state({});
  let managementUrl: string | null = $state(null);
  let currentPriceBreakdown = $state<PriceBreakdown | undefined>(undefined);
  let appliedDiscountCode: string | null = $derived(
    latestCheckoutPricingResponse?.applied_discounts?.[0]?.discount_code ??
      null,
  );
  let gatewayParams: GatewayParams = $derived.by(() => ({
    ...initialGatewayParams,
    ...(latestCheckoutPricingResponse?.gateway_params?.elements_configuration
      ? {
          elements_configuration:
            latestCheckoutPricingResponse.gateway_params.elements_configuration,
        }
      : {}),
  }));

  let originalHtmlHeight: string | null = $state(null);
  let originalHtmlOverflow: string | null = $state(null);
  let originalBodyHeight: string | null = $state(null);

  // Setting the context for the Localized components
  let translator: Translator = new Translator(
    customTranslations,
    selectedLocale,
    defaultLocale,
  );
  let translatorStore = writable(translator);
  const brandingAppearanceStore = writable<BrandingAppearance | null>(
    brandingInfo?.appearance ?? null,
  );
  setContext(translatorContextKey, translatorStore);
  setContext(brandingContextKey, brandingAppearanceStore);

  onMount(() => {
    if (!isInElement) {
      originalHtmlHeight = document.documentElement.style.height;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyHeight = document.body.style.height;

      document.documentElement.style.height = "100%";
      document.body.style.height = "100%";
      document.documentElement.style.overflow = "hidden";
    }
  });

  onDestroy(() => {
    if (!isInElement) {
      const restoreStyle = (
        element: HTMLElement,
        property: string,
        value: string | null,
      ) => {
        value === ""
          ? element.style.removeProperty(property)
          : element.style.setProperty(property, value);
      };

      restoreStyle(document.documentElement, "height", originalHtmlHeight);
      restoreStyle(document.body, "height", originalBodyHeight);
      restoreStyle(document.documentElement, "overflow", originalHtmlOverflow);
    }
  });

  setContext(eventsTrackerContextKey, eventsTracker);

  // Internal flag to control wallet methods visibility
  let forceEnableWalletMethods: boolean = $state(
    typeof purchases._shouldForceEnableWalletMethods === "function"
      ? purchases._shouldForceEnableWalletMethods()
      : false,
  );

  const startCheckout = (
    nextProductDetails: Product,
    nextPurchaseOption: PurchaseOption,
    nextEmail: string | undefined,
  ) => {
    const nextProductId = nextProductDetails.identifier ?? null;
    if (nextProductId === null) {
      return Promise.reject(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          "Product ID was not set before purchase.",
        ),
      );
    }

    return purchaseOperationHelper
      .checkoutStart({
        appUserId,
        productId: nextProductId,
        purchaseOption: nextPurchaseOption,
        presentedOfferingContext: nextProductDetails.presentedOfferingContext,
        customerEmail: nextEmail,
        metadata,
        workflowPurchaseContext,
        attributionMetadata,
        paywallId,
        paywallSessionId,
        locale: selectedLocale,
      })
      .then((result) => ({ result, emailToUse: nextEmail }))
      .catch((e: PurchaseFlowError) => {
        if (e.errorCode !== PurchaseFlowErrorCode.MissingEmailError) {
          throw e;
        }

        return purchaseOperationHelper
          .checkoutStart({
            appUserId,
            productId: nextProductId,
            purchaseOption: nextPurchaseOption,
            presentedOfferingContext:
              nextProductDetails.presentedOfferingContext,
            customerEmail: undefined,
            metadata,
            workflowPurchaseContext,
            attributionMetadata,
            paywallId,
            paywallSessionId,
            locale: selectedLocale,
          })
          .then((result) => ({ result, emailToUse: undefined }));
      });
  };

  const getTaxCalculationStatusForPricingResponse = (
    failedReason?: string,
  ): TaxCalculationStatus => {
    if (!failedReason) {
      return "calculated";
    }

    if (failedReason === CheckoutPricingFailedReason.invalid_tax_location) {
      return "pending";
    }

    return "disabled";
  };

  const isInterruptCheckoutError = (
    error: unknown,
  ): error is PurchaseFlowError =>
    error instanceof PurchaseFlowError &&
    [
      PurchaseFlowErrorCode.StripeTaxNotActive,
      PurchaseFlowErrorCode.StripeInvalidTaxOriginAddress,
      PurchaseFlowErrorCode.StripeMissingRequiredPermission,
    ].includes(error.errorCode);

  // Spreads the latest known tax location (when available) so the backend
  // always receives it. Each field is sent as undefined until the customer
  // provides an address, in which case the backend falls back to IP geolocation.
  const buildTaxLocationParams = () => {
    const details = get(lastTaxCustomerDetailsStore);
    return {
      countryCode: details?.countryCode,
      postalCode: details?.postalCode,
      state: details?.state,
      city: details?.city,
      addressLine1: details?.addressLine1,
      addressLine2: details?.addressLine2,
    };
  };

  const applyPricingResponse = (
    response: CheckoutPricingResponse,
    nextPriceBreakdown?: PriceBreakdown,
  ) => {
    latestCheckoutPricingResponse = response;
    currentPriceBreakdown =
      nextPriceBreakdown ??
      createPriceBreakdownFromCheckoutPricingResponse(
        response,
        getTaxCalculationStatusForPricingResponse(response.failed_reason),
      );
  };

  onMount(async () => {
    try {
      const { result, emailToUse } = await startCheckout(
        productDetails,
        purchaseOptionToUse,
        email,
      );
      lastError = null;
      email = emailToUse;
      initialGatewayParams = result.gateway_params;
      managementUrl = result.management_url;

      if (discountCode) {
        try {
          const pricingResponse =
            await purchaseOperationHelper.checkoutRefreshPricing({
              ...buildTaxLocationParams(),
              discountCode,
            });
          applyPricingResponse(pricingResponse);
        } catch (error) {
          if (isInterruptCheckoutError(error)) {
            throw error;
          }
          if (showDiscountCodeField) {
            discountCodeError =
              error instanceof Error
                ? error.message
                : "Failed to apply discount code.";
          } else {
            throw error instanceof PurchaseFlowError
              ? error
              : new PurchaseFlowError(
                  PurchaseFlowErrorCode.ErrorSettingUpPurchase,
                  "Failed to apply discount code.",
                );
          }
        }
      }

      currentPage = "payment-entry";
    } catch (e) {
      handleError(
        e instanceof PurchaseFlowError
          ? e
          : new PurchaseFlowError(
              PurchaseFlowErrorCode.UnknownError,
              e instanceof Error ? e.message : String(e),
            ),
      );
    }
  });

  const handleDraftDiscountCodeChange = (nextDiscountCode: string) => {
    draftDiscountCode = nextDiscountCode;
    discountCodeError = null;
  };

  const handlePaymentProcessingChange = (nextIsProcessing: boolean) => {
    isPaymentProcessing = nextIsProcessing;
  };

  const refreshCheckoutPricingWithDiscountCode = async (
    nextDiscountCode: string | null,
  ) => {
    const normalizedDiscountCode = nextDiscountCode?.trim() || null;
    if (nextDiscountCode !== null && normalizedDiscountCode === null) {
      discountCodeError = "Enter a discount code.";
      return;
    }

    isUpdatingDiscountCode = true;
    discountCodeError = null;

    try {
      const pricingResponse =
        await purchaseOperationHelper.checkoutRefreshPricing({
          ...buildTaxLocationParams(),
          discountCode: normalizedDiscountCode,
        });
      applyPricingResponse(pricingResponse);
      draftDiscountCode = normalizedDiscountCode ?? "";
      lastError = null;
      onDiscountCodeChanged?.(normalizedDiscountCode);
    } catch (error) {
      if (isInterruptCheckoutError(error)) {
        handleError(error);
        return;
      }

      discountCodeError =
        error instanceof Error
          ? error.message
          : "Failed to apply discount code.";
    } finally {
      isUpdatingDiscountCode = false;
    }
  };

  const handleApplyDiscountCode = async () => {
    await refreshCheckoutPricingWithDiscountCode(draftDiscountCode);
  };

  const handleRemoveDiscountCode = async () => {
    await refreshCheckoutPricingWithDiscountCode(null);
  };

  const handleContinue = () => {
    if (currentPage === "payment-entry") {
      purchaseOperationHelper
        .pollCurrentPurchaseForCompletion()
        .then((pollResult) => {
          operationResult = pollResult;
          if (skipSuccessPage) {
            onFinished(pollResult);
          } else {
            currentPage = "success";
          }
        })
        .catch((error: PurchaseFlowError) => {
          handleError(error);
        });
      return;
    }

    if (currentPage === "success" || currentPage === "error") {
      onFinished(operationResult!);
      return;
    }

    currentPage = "success";
  };

  const handleError = (e: PurchaseFlowError) => {
    const event = createCheckoutFlowErrorEvent({
      errorCode: e.getErrorCode().toString(),
      errorMessage: e.message,
    });
    eventsTracker.trackSDKEvent(event);
    lastError = e;
    currentPage = "error";
  };

  const closeWithError = () => {
    onError(
      lastError ??
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Unknown error without state set.",
        ),
    );
  };
</script>

<PurchasesUiInner
  isSandbox={purchases.isSandbox()}
  currentPage={currentPage as CurrentPage}
  {brandingInfo}
  {productDetails}
  {purchaseOptionToUse}
  {lastError}
  {gatewayParams}
  {managementUrl}
  {purchaseOperationHelper}
  {isInElement}
  {termsAndConditionsUrl}
  {checkoutConsentRequired}
  {showDiscountCodeField}
  {draftDiscountCode}
  {appliedDiscountCode}
  {discountCodeError}
  {isUpdatingDiscountCode}
  isDiscountCodeControlsEnabled={currentPage === "payment-entry" &&
    !isPaymentProcessing}
  {forceEnableWalletMethods}
  customerEmail={email ?? null}
  defaultPriceBreakdown={currentPriceBreakdown}
  {closeWithError}
  onDraftDiscountCodeChange={handleDraftDiscountCodeChange}
  onApplyDiscountCode={handleApplyDiscountCode}
  onRemoveDiscountCode={handleRemoveDiscountCode}
  onPaymentProcessingChange={handlePaymentProcessingChange}
  onSessionPricingUpdated={applyPricingResponse}
  onContinue={handleContinue}
  onError={handleError}
  {onClose}
  {hideBackButton}
  {lastTaxCustomerDetailsStore}
/>
