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
  import type { AttributionMetadata } from "../entities/purchase-params";
  import { PaddleService } from "../paddle/paddle-service";
  import type { PaddleCheckoutTotals } from "../paddle/paddle-service";
  import { normalizeToPurchaseFlowError } from "../helpers/normalize-to-purchase-flow-error";
  import type { PaddleCheckoutStartResponse } from "../networking/responses/checkout-start-response";
  import PaddlePurchasesUiInner from "./paddle-purchases-ui-inner.svelte";
  import PaddleInlineCheckoutPage from "./paddle-inline-checkout-page.svelte";
  import type { BrandingAppearance } from "../entities/branding";
  import { type PriceBreakdown } from "./ui-types";
  import { getInitialPriceFromPurchaseOption } from "../helpers/purchase-option-price-helper";

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
    attributionMetadata?: AttributionMetadata;
    unmountPaddlePurchaseUi: () => void;
    paddleService: PaddleService;
    /**
     * Internal flag (defaults to false). When true, Paddle's checkout is
     * embedded inline in our own container instead of opening as an overlay.
     * Not yet exposed through the public configure() surface — wiring and the
     * inline state machine land in follow-up PRs.
     */
    useInlineCheckout?: boolean;
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
    attributionMetadata,
    unmountPaddlePurchaseUi,
    paddleService,
    useInlineCheckout = false,
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

  // Order totals reported by Paddle's checkout events; drives the inline order
  // summary's Subtotal/Tax/Total breakdown and updates live.
  let paddleTotals = $state<PaddleCheckoutTotals | null>(null);
  const onCheckoutTotals = (totals: PaddleCheckoutTotals) => {
    paddleTotals = totals;
  };

  const toMicros = (amount: number): number => Math.round(amount * 1_000_000);

  // Before Paddle reports totals, fall back to the option's initial price (no
  // tax breakdown yet); once totals arrive, show the full Subtotal/Tax/Total.
  const inlinePriceBreakdown: PriceBreakdown = $derived.by(() => {
    if (paddleTotals) {
      const taxInMicros = toMicros(paddleTotals.taxAmount);
      return {
        currency: paddleTotals.currencyCode,
        totalAmountInMicros: toMicros(paddleTotals.totalAmount),
        totalExcludingTaxInMicros: toMicros(paddleTotals.subtotalAmount),
        taxAmountInMicros: taxInMicros,
        taxBreakdown:
          taxInMicros > 0
            ? [{ tax_amount_in_micros: taxInMicros, display_name: "Tax" }]
            : [],
        taxCalculationStatus: "calculated",
      };
    }
    const initialPrice = getInitialPriceFromPurchaseOption(
      productDetails,
      purchaseOption,
    );
    return {
      currency: initialPrice.currency,
      totalAmountInMicros: initialPrice.amountMicros,
      totalExcludingTaxInMicros: initialPrice.amountMicros,
      taxAmountInMicros: null,
      taxBreakdown: null,
      taxCalculationStatus: "unavailable",
    };
  });

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

  // Inline checkout embeds Paddle's iframe in our page, so cancelling must tear
  // it down via Paddle.Checkout.close() before unmounting our UI (per Paddle's
  // branded inline checkout guidance), then run the normal close/cancel flow.
  const handleInlineClose = () => {
    paddleService.closeCheckout();
    onClose();
  };

  const closeWithError = () => {
    onError(
      error ??
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Unknown error without state set.",
        ),
    );
    unmountPaddlePurchaseUi();
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

    // Move to the loading UI when the Paddle overlay opens
    const onCheckoutLoaded = () => {
      currentPage = "loading";
    };

    const presentedOfferingContext: PresentedOfferingContext = {
      offeringIdentifier:
        productDetails.presentedOfferingContext.offeringIdentifier,
      targetingContext: null,
      placementIdentifier: null,
    };

    let startResponse: PaddleCheckoutStartResponse;
    try {
      startResponse = await paddleService.startCheckout({
        appUserId,
        productId: productDetails.identifier,
        presentedOfferingContext,
        purchaseOption,
        customerEmail,
        metadata,
        locale: selectedLocale,
        attributionMetadata,
      });
      isSandbox = startResponse.paddle_billing_params.is_sandbox;
    } catch (e) {
      const purchaseFlowError = normalizeToPurchaseFlowError(
        e,
        `Start Paddle checkout failed: ${e}`,
      );
      error = purchaseFlowError;
      currentPage = "error";
      onError(purchaseFlowError);
      return;
    }

    try {
      const result = await paddleService.purchase({
        operationSessionId: startResponse.operation_session_id,
        transactionId: startResponse.paddle_billing_params?.transaction_id,
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
        ...(useInlineCheckout && {
          displayMode: "inline" as const,
          onCheckoutTotals,
        }),
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
        `Paddle purchase failed: ${e}`,
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

{#if useInlineCheckout}
  <!-- Single branded two-column shell for every inline state (form / success /
       error), so there's no swap between different root templates. -->
  <PaddleInlineCheckoutPage
    {brandingInfo}
    {isSandbox}
    {isInElement}
    onClose={handleInlineClose}
    {productDetails}
    {purchaseOption}
    priceBreakdown={inlinePriceBreakdown}
    {currentPage}
    lastError={error}
    onContinue={handleContinue}
    {closeWithError}
  />
{:else if currentPage !== "waiting"}
  <PaddlePurchasesUiInner
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
