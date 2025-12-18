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
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";
  import type {
    Product,
    PurchaseOption,
    PurchaseMetadata,
  } from "../entities/offerings";
  import type { StripeBillingParams } from "../networking/responses/checkout-start-response";
  import StripeCheckoutPurchasesUiInner from "./stripe-checkout-purchases-ui-inner.svelte";
  import { normalizeToPurchaseFlowError } from "../helpers/normalize-to-purchase-flow-error";
  import type { WorkflowPurchaseContext } from "../entities/purchase-params";
  import { validateEmail } from "../helpers/validators";
  import type { Package } from "../main";
  import type { BrandingAppearance } from "../entities/branding";

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
    rcPackage: Package;
    appUserId: string;
    purchaseOption: PurchaseOption;
    customerEmail: string | undefined;
    metadata: PurchaseMetadata | undefined;
    purchaseOperationHelper: PurchaseOperationHelper;
    workflowPurchaseContext?: WorkflowPurchaseContext;
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
    rcPackage,
    appUserId,
    purchaseOption,
    customerEmail,
    metadata,
    purchaseOperationHelper,
    workflowPurchaseContext,
  }: Props = $props();
  let productDetails: Product = rcPackage.webBillingProduct;
  let translator: Translator = new Translator(
    customTranslations,
    selectedLocale,
    defaultLocale,
  );
  let translatorStore = writable(translator);
  setContext(translatorContextKey, translatorStore);
  setContext(eventsTrackerContextKey, eventsTracker);

  let isSandbox = $state(false);
  let operationResult = $state<OperationSessionSuccessfulResult | null>(null);
  let error = $state<PurchaseFlowError | null>(null);
  let currentPage = $state<"loading" | "stripe-checkout" | "success" | "error">(
    "loading",
  );
  let stripeBillingParams = $state<StripeBillingParams | null>(null);

  // Update branding store when stripeBillingParams are returned
  const mergedBrandingAppearance = $derived(
    (stripeBillingParams?.appearance ?? null) as BrandingAppearance | null,
  );
  const brandingAppearanceStore = writable<BrandingAppearance | null>(null);
  setContext(brandingContextKey, brandingAppearanceStore);
  $effect(() => {
    brandingAppearanceStore.set(mergedBrandingAppearance);
  });

  $effect(() => {
    if (currentPage === "success" && operationResult && skipSuccessPage) {
      onFinished(operationResult);
    }
  });

  const handleContinue = () => {
    if (currentPage === "stripe-checkout") {
      currentPage = "loading";
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
        .catch((error: unknown) => {
          handleError(
            normalizeToPurchaseFlowError(error, "Failed to complete purchase"),
          );
        });
      return;
    }

    if (currentPage === "success" && operationResult) {
      onFinished(operationResult);
    }
  };

  const handleError = (e: PurchaseFlowError) => {
    error = e;
    currentPage = "error";
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

  onMount(async () => {
    if (!isInElement) {
      originalHtmlHeight = document.documentElement.style.height;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyHeight = document.body.style.height;

      document.documentElement.style.height = "100%";
      document.body.style.height = "100%";
      document.documentElement.style.overflow = "hidden";
    }

    const productId = productDetails.identifier;
    if (!productId) {
      handleError(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          "Product ID was not set before purchase.",
        ),
      );
      return;
    }

    let email = customerEmail;
    const emailError = email ? validateEmail(email) : null;
    if (emailError) {
      email = undefined;
    }

    try {
      const result = await purchaseOperationHelper.checkoutStart(
        appUserId,
        productId,
        purchaseOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        email,
        metadata,
        workflowPurchaseContext,
      );

      if (!result.stripe_billing_params) {
        handleError(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            "Missing Stripe Checkout parameters",
          ),
        );
        return;
      }

      stripeBillingParams = result.stripe_billing_params;
      currentPage = "stripe-checkout";
    } catch (e: PurchaseFlowError | unknown) {
      handleError(
        normalizeToPurchaseFlowError(e, "Failed to start Stripe Checkout"),
      );
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

{#if stripeBillingParams}
  <StripeCheckoutPurchasesUiInner
    {currentPage}
    {brandingInfo}
    brandingAppearance={mergedBrandingAppearance}
    {productDetails}
    {isSandbox}
    lastError={error}
    {isInElement}
    {stripeBillingParams}
    onContinue={handleContinue}
    onError={handleError}
    {closeWithError}
  />
{/if}
