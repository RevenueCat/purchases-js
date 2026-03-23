<script lang="ts">
  import { onMount, setContext, onDestroy } from "svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import { translatorContextKey } from "./localization/constants";
  import { Translator } from "./localization/translator";
  import { writable } from "svelte/store";
  import { eventsTrackerContextKey, brandingContextKey } from "./constants";
  import type { IEventsTracker } from "../behavioural-events/events-tracker";
  import type { OperationSessionSuccessfulResult } from "../helpers/purchase-operation-helper";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../helpers/purchase-operation-helper";
  import type {
    Product,
    PurchaseOption,
    PurchaseMetadata,
    PresentedOfferingContext,
    Package,
  } from "../entities/offerings";
  import { PayPalService } from "../paypal/paypal-service";
  import { normalizeToPurchaseFlowError } from "../helpers/normalize-to-purchase-flow-error";
  import type { PayPalCheckoutStartResponse } from "../networking/responses/checkout-start-response";
  import PayPalPurchasesUiInner from "./paypal-purchases-ui-inner.svelte";
  import type { BrandingAppearance } from "../entities/branding";

  interface Props {
    brandingInfo: BrandingInfoResponse | null;
    eventsTracker: IEventsTracker;
    selectedLocale: string;
    defaultLocale: string;
    customTranslations?: Record<string, Record<string, string>>;
    isInElement: boolean;
    skipSuccessPage: boolean;
    onClose: () => void;
    onFinished: (operationResult: OperationSessionSuccessfulResult) => void;
    onError: (error: PurchaseFlowError) => void;
    productDetails: Product;
    rcPackage: Package;
    appUserId: string;
    purchaseOption: PurchaseOption;
    customerEmail: string | undefined;
    metadata: PurchaseMetadata | undefined;
    unmountPayPalPurchaseUi: () => void;
    paypalService: PayPalService;
  }

  const {
    brandingInfo,
    eventsTracker,
    selectedLocale,
    defaultLocale,
    customTranslations = {},
    isInElement,
    skipSuccessPage = false,
    onClose,
    onFinished,
    onError,
    productDetails,
    rcPackage,
    appUserId,
    purchaseOption,
    customerEmail,
    metadata,
    unmountPayPalPurchaseUi,
    paypalService,
  }: Props = $props();

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
  setContext(eventsTrackerContextKey, eventsTracker);

  let isSandbox = $state(false);
  let operationResult = $state<OperationSessionSuccessfulResult | null>(null);
  let error = $state<PurchaseFlowError | null>(null);
  let currentPage = $state<"waiting" | "loading" | "success" | "error">(
    "waiting",
  );

  $effect(() => {
    if (currentPage === "success" && operationResult && skipSuccessPage) {
      onFinished(operationResult);
    }
  });

  const handleContinue = () => {
    if (currentPage === "success" && operationResult) {
      onFinished(operationResult);
    }
  };

  const closeWithError = () => {
    onError(
      error ??
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Unknown error without state set.",
        ),
    );
    unmountPayPalPurchaseUi();
  };

  let originalHtmlHeight: string | null = null;
  let originalHtmlOverflow: string | null = null;
  let originalBodyHeight: string | null = null;

  onMount(async () => {
    if (!isInElement) {
      originalHtmlHeight = document.documentElement.style.height;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyHeight = document.body.style.height;

      document.documentElement.style.height = "100%";
      document.body.style.height = "100%";
      document.documentElement.style.overflow = "hidden";
    }

    // Move to the loading UI when the PayPal checkout opens
    const onCheckoutLoaded = () => {
      currentPage = "loading";
    };

    const presentedOfferingContext: PresentedOfferingContext = {
      offeringIdentifier:
        productDetails.presentedOfferingContext.offeringIdentifier,
      targetingContext: null,
      placementIdentifier: null,
    };

    let startResponse: PayPalCheckoutStartResponse;
    try {
      startResponse = await paypalService.startCheckout({
        appUserId,
        productId: productDetails.identifier,
        presentedOfferingContext,
        purchaseOption,
        customerEmail,
        metadata,
      });
      isSandbox = startResponse.paypal_billing_params.is_sandbox;
    } catch (e) {
      const purchaseFlowError = normalizeToPurchaseFlowError(
        e,
        `Start PayPal checkout failed: ${e}`,
      );
      error = purchaseFlowError;
      currentPage = "error";
      onError(purchaseFlowError);
      return;
    }

    try {
      const result = await paypalService.purchase({
        operationSessionId: startResponse.operation_session_id,
        orderId: startResponse.paypal_billing_params.order_id,
        approvalUrl: startResponse.paypal_billing_params.approval_url,
        onCheckoutLoaded,
        onClose,
        params: {
          rcPackage,
          purchaseOption,
          appUserId,
          presentedOfferingIdentifier:
            productDetails.presentedOfferingContext.offeringIdentifier,
          customerEmail,
          locale: selectedLocale || defaultLocale,
        },
      });

      if (skipSuccessPage) {
        onFinished(result);
      } else {
        operationResult = result;
        currentPage = "success";
      }
    } catch (e) {
      const purchaseFlowError = normalizeToPurchaseFlowError(
        e,
        `PayPal purchase failed: ${e}`,
      );

      error = purchaseFlowError;
      currentPage = "error";
      onError(purchaseFlowError);
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
</script>

{#if currentPage !== "waiting"}
  <PayPalPurchasesUiInner
    currentPage={currentPage as "loading" | "success" | "error"}
    {brandingInfo}
    {productDetails}
    {isSandbox}
    lastError={error}
    {isInElement}
    onContinue={handleContinue}
    {closeWithError}
  />
{/if}
