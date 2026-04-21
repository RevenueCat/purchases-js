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
    OperationSessionSuccessfulResult,
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
  import type { WorkflowPurchaseContext } from "../entities/purchase-params";
  import { writable } from "svelte/store";
  import type { BrandingAppearance } from "../entities/branding";
  import { type GatewayParams } from "../networking/responses/stripe-elements";
  import { validateEmail } from "../helpers/validators";

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
    workflowPurchaseContext?: WorkflowPurchaseContext;
    paywallId?: string;
    onFinished: (operationResult: OperationSessionSuccessfulResult) => void;
    onError: (error: PurchaseFlowError) => void;
    onClose: (() => void) | undefined;
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
    workflowPurchaseContext,
    paywallId,
    onFinished,
    onError,
    onClose,
  }: Props = $props();

  const emailError = customerEmail ? validateEmail(customerEmail) : null;
  let email = $state(emailError ? undefined : customerEmail);

  function hasDiscount(
    nextProductDetails: Product,
    nextPurchaseOption: PurchaseOption,
  ): boolean {
    return (
      !!nextProductDetails.subscriptionOptions[nextPurchaseOption.id]
        ?.discount ||
      !!nextProductDetails.defaultNonSubscriptionOption?.discount
    );
  }

  let productDetails: Product = $state(rcPackage.webBillingProduct);
  let purchaseOptionToUse: PurchaseOption = $state(purchaseOption);
  let lastError: PurchaseFlowError | null = $state(null);
  let draftDiscountCode = $state(discountCode ?? "");
  let appliedDiscountCode: string | null = $state(
    discountCode && hasDiscount(rcPackage.webBillingProduct, purchaseOption)
      ? discountCode
      : null,
  );
  let discountCodeError: string | null = $state(null);
  let isUpdatingDiscountCode = $state(false);
  let isPaymentProcessing = $state(false);

  let currentPage: CurrentPage = $state("payment-entry-loading");
  let operationResult: OperationSessionSuccessfulResult | null = $state(null);
  let gatewayParams: GatewayParams = $state({});
  let managementUrl: string | null = $state(null);

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
        paywallId,
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
            paywallId,
            locale: selectedLocale,
          })
          .then((result) => ({ result, emailToUse: undefined }));
      });
  };

  onMount(async () => {
    try {
      let initialProductDetails = productDetails;
      let initialPurchaseOption = purchaseOptionToUse;

      if (
        discountCode &&
        !hasDiscount(initialProductDetails, initialPurchaseOption)
      ) {
        try {
          const discountResult = await purchases._getProductWithDiscountCode(
            rcPackage,
            initialPurchaseOption,
            initialProductDetails.price.currency,
            discountCode,
          );

          if (
            hasDiscount(
              discountResult.productDetails,
              discountResult.purchaseOption,
            )
          ) {
            initialProductDetails = discountResult.productDetails;
            initialPurchaseOption = discountResult.purchaseOption;
            productDetails = discountResult.productDetails;
            purchaseOptionToUse = discountResult.purchaseOption;
            appliedDiscountCode = discountCode;
          }
        } catch {}
      }

      const { result, emailToUse } = await startCheckout(
        initialProductDetails,
        initialPurchaseOption,
        email,
      );
      lastError = null;
      email = emailToUse;
      currentPage = "payment-entry";
      gatewayParams = result.gateway_params;
      managementUrl = result.management_url;
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

  const restartCheckoutWithDiscountCode = async (
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
      const {
        productDetails: nextProductDetails,
        purchaseOption: nextPurchaseOption,
      } = await purchases._getProductWithDiscountCode(
        rcPackage,
        purchaseOptionToUse,
        productDetails.price.currency,
        normalizedDiscountCode ?? undefined,
      );

      if (
        normalizedDiscountCode &&
        !hasDiscount(nextProductDetails, nextPurchaseOption)
      ) {
        throw new Error("Invalid discount code.");
      }

      currentPage = "payment-entry-loading";

      const { result, emailToUse } = await startCheckout(
        nextProductDetails,
        nextPurchaseOption,
        email,
      );

      productDetails = nextProductDetails;
      purchaseOptionToUse = nextPurchaseOption;
      email = emailToUse;
      gatewayParams = result.gateway_params;
      managementUrl = result.management_url;
      currentPage = "payment-entry";
      appliedDiscountCode = normalizedDiscountCode;
      draftDiscountCode = normalizedDiscountCode ?? "";
      lastError = null;
      onDiscountCodeChanged?.(normalizedDiscountCode);
    } catch (error) {
      if (currentPage === "payment-entry-loading") {
        currentPage = "payment-entry";
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
    await restartCheckoutWithDiscountCode(draftDiscountCode);
  };

  const handleRemoveDiscountCode = async () => {
    await restartCheckoutWithDiscountCode(null);
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
  {showDiscountCodeField}
  {draftDiscountCode}
  {appliedDiscountCode}
  {discountCodeError}
  {isUpdatingDiscountCode}
  isDiscountCodeControlsEnabled={currentPage === "payment-entry" &&
    !isPaymentProcessing}
  {forceEnableWalletMethods}
  customerEmail={email ?? null}
  {closeWithError}
  onDraftDiscountCodeChange={handleDraftDiscountCodeChange}
  onApplyDiscountCode={handleApplyDiscountCode}
  onRemoveDiscountCode={handleRemoveDiscountCode}
  onPaymentProcessingChange={handlePaymentProcessingChange}
  onContinue={handleContinue}
  onError={handleError}
  {onClose}
/>
