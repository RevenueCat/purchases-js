<script lang="ts">
  import { onMount, setContext, onDestroy } from "svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import Loading from "./molecules/loading.svelte";
  import SuccessPage from "./pages/success-page.svelte";
  import Template from "./layout/template.svelte";
  import BrandingHeader from "./molecules/branding-header.svelte";
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
  import ErrorPage from "./pages/error-page.svelte";
  import type {
    Product,
    PurchaseOption,
    PurchaseMetadata,
    PresentedOfferingContext,
    Package,
  } from "../entities/offerings";
  import { PaddleService } from "../paddle/paddle-service";
  import { PurchasesError } from "../entities/errors";
  import type { PaddleCheckoutStartResponse } from "../networking/responses/checkout-start-response";

  interface Props {
    brandingInfo: BrandingInfoResponse | null;
    eventsTracker: IEventsTracker;
    selectedLocale: string;
    defaultLocale: string;
    customTranslations?: Record<string, Record<string, string>>;
    isInElement: boolean;
    skipSuccessPage: boolean;
    onFinished: (operationResult: OperationSessionSuccessfulResult) => void;
    onError: (error: PurchaseFlowError) => void;
    onClose: (() => void) | undefined;
    productDetails: Product;
    rcPackage: Package;
    appUserId: string;
    purchaseOption: PurchaseOption;
    customerEmail: string | undefined;
    metadata: PurchaseMetadata | undefined;
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
    onFinished,
    onError,
    onClose,
    productDetails,
    rcPackage,
    appUserId,
    purchaseOption,
    customerEmail,
    metadata,
    unmountPaddlePurchaseUi,
    paddleService,
  }: Props = $props();

  let translator: Translator = new Translator(
    customTranslations,
    selectedLocale,
    defaultLocale,
  );
  let translatorStore = writable(translator);
  setContext(translatorContextKey, translatorStore);
  setContext(brandingContextKey, brandingInfo?.appearance);
  setContext(eventsTrackerContextKey, eventsTracker);

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
    unmountPaddlePurchaseUi();
  };

  const handleBackClicked = () => {
    if (currentPage === "error") {
      closeWithError();
    } else if (currentPage === "success") {
      handleContinue();
    } else if (currentPage === "loading") {
      unmountPaddlePurchaseUi();
    } else if (onClose) {
      onClose();
    }
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
      });
    } catch (err) {
      error = err as PurchaseFlowError;
      currentPage = "error";
      return;
    }

    try {
      const result = await paddleService.purchase({
        operationSessionId: startResponse.operation_session_id,
        transactionId: startResponse.paddle_billing_params?.transaction_id,
        onCheckoutLoaded,
        unmountPaddlePurchaseUi,
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
      const purchaseFlowError =
        e instanceof PurchasesError
          ? PurchaseFlowError.fromPurchasesError(
              e,
              PurchaseFlowErrorCode.UnknownError,
            )
          : new PurchaseFlowError(
              PurchaseFlowErrorCode.UnknownError,
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

{#if currentPage !== "waiting"}
  <Template
    {brandingInfo}
    {isInElement}
    isSandbox={false}
    onClose={handleBackClicked}
  >
    {#snippet navbarHeaderContent()}
      <BrandingHeader
        {brandingInfo}
        onClose={handleBackClicked}
        showCloseButton={!isInElement}
      />
    {/snippet}
    {#snippet mainContent()}
      {#if currentPage === "loading"}
        <Loading />
      {:else if currentPage === "success"}
        <SuccessPage onContinue={handleContinue} />
      {:else if currentPage === "error"}
        <ErrorPage
          lastError={error}
          {productDetails}
          supportEmail={brandingInfo?.support_email ?? null}
          onDismiss={closeWithError}
          appName={brandingInfo?.app_name ?? null}
        />
      {/if}
    {/snippet}
  </Template>
{/if}
