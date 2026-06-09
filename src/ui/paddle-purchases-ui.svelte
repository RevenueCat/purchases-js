<script lang="ts">
  import { onMount, setContext, onDestroy, tick } from "svelte";
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
  import { isHexColorLight } from "./theme/utils";

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
  // Tracks the window between Paddle reporting completion and the backend
  // poll resolving. Used by the inline path to swap the checkout iframe for a
  // processing state instead of leaving an empty container on screen.
  let checkoutCompleted = $state(false);

  // How Paddle's checkout is presented. Defaults to the legacy overlay; set to
  // inline only when the per-project backend flag (returned on the checkout
  // start response) enables it. Resolved after startCheckout, below.
  let useInlineCheckout = $state(false);

  // Order totals reported by Paddle's checkout events; drives the inline order
  // summary's Subtotal/Tax/Total breakdown and updates live.
  let paddleTotals = $state<PaddleCheckoutTotals | null>(null);
  const onCheckoutTotals = (totals: PaddleCheckoutTotals) => {
    paddleTotals = totals;
  };

  // Paddle's inline checkout only exposes a light/dark theme (deeper colors are
  // configured in the Paddle dashboard). Pick the variant that matches the
  // merchant's page background so the embedded checkout blends with our UI.
  const paddleCheckoutTheme = isHexColorLight(
    brandingInfo?.appearance?.color_page_bg ?? "#ffffff",
  )
    ? "light"
    : "dark";

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

    // Paddle reported completion; show the processing state while we poll.
    const onCheckoutCompleted = () => {
      checkoutCompleted = true;
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

      // Gate the inline presentation on the per-project backend flag. Absent =>
      // legacy overlay, so projects that haven't been opted in are unaffected.
      useInlineCheckout =
        startResponse.checkout_config?.paddle_config?.inline_checkout_enabled ??
        false;
      // Paddle injects its iframe into the inline container (frameTarget), so
      // that element must be in the DOM before purchase() opens the checkout.
      // Flush the render now that we know the presentation mode.
      if (useInlineCheckout) {
        await tick();
      }
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
          theme: paddleCheckoutTheme,
          onCheckoutTotals,
          onCheckoutCompleted,
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
  <!-- Single branded two-column shell for every inline state (form / processing
       / success / error), so there's no swap between different root templates. -->
  <PaddleInlineCheckoutPage
    {brandingInfo}
    {isSandbox}
    {isInElement}
    onClose={handleInlineClose}
    {productDetails}
    {purchaseOption}
    totals={paddleTotals}
    {currentPage}
    {checkoutCompleted}
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
