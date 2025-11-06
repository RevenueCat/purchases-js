<script lang="ts">
  import { onMount, setContext, onDestroy } from "svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import Loading from "./molecules/loading.svelte";
  import SuccessPage from "./pages/success-page.svelte";
  import Template from "./layout/template.svelte";
  import BrandingHeader from "./molecules/branding-header.svelte";
  import { translatorContextKey } from "./localization/constants";
  import { Translator } from "./localization/translator";
  import { writable, type Writable } from "svelte/store";
  import { eventsTrackerContextKey, brandingContextKey } from "./constants";
  import type { IEventsTracker } from "../behavioural-events/events-tracker";
  import type { OperationSessionSuccessfulResult } from "../helpers/purchase-operation-helper";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../helpers/purchase-operation-helper";
  import ErrorPage from "./pages/error-page.svelte";
  import type { Product } from "../entities/offerings";

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
    operationResultStore: Writable<OperationSessionSuccessfulResult | null>;
    errorStore: Writable<PurchaseFlowError | null>;
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
    operationResultStore,
    errorStore,
  }: Props = $props();

  let currentPage = $state<"waiting" | "success" | "error">("waiting");

  let operationResult = $state<OperationSessionSuccessfulResult | null>(null);
  let error = $state<PurchaseFlowError | null>(null);

  $effect(() => {
    const unsubscribeResult = operationResultStore.subscribe((value) => {
      if (value) {
        operationResult = value;
        currentPage = "success";
      }
    });

    const unsubscribeError = errorStore.subscribe((value) => {
      if (value) {
        error = value;
        currentPage = "error";
      }
    });

    return () => {
      unsubscribeResult();
      unsubscribeError();
    };
  });

  let translator: Translator = new Translator(
    customTranslations,
    selectedLocale,
    defaultLocale,
  );
  let translatorStore = writable(translator);
  setContext(translatorContextKey, translatorStore);
  setContext(brandingContextKey, brandingInfo?.appearance);
  setContext(eventsTrackerContextKey, eventsTracker);

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
  };

  let originalHtmlHeight: string | null = null;
  let originalHtmlOverflow: string | null = null;
  let originalBodyHeight: string | null = null;

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
</script>

<Template {brandingInfo} {isInElement} isSandbox={false} {onClose}>
  {#snippet navbarHeaderContent()}
    <BrandingHeader
      {brandingInfo}
      {onClose}
      showCloseButton={!isInElement && !!onClose}
    />
  {/snippet}
  {#snippet mainContent()}
    {#if currentPage === "waiting"}
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
