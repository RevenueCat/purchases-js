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
  import { writable } from "svelte/store";
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
    termsAndConditionsUrl?: string;
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
    termsAndConditionsUrl,
    onFinished,
    onError,
    onClose,
  }: Props = $props();

  const emailError = customerEmail ? validateEmail(customerEmail) : null;
  let email = $state(emailError ? undefined : customerEmail);

  let productDetails: Product = rcPackage.webBillingProduct;
  let lastError: PurchaseFlowError | null = $state(null);
  const productId = rcPackage.webBillingProduct.identifier ?? null;

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
  setContext(translatorContextKey, translatorStore);
  setContext(brandingContextKey, brandingInfo?.appearance);

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

  onMount(async () => {
    if (productId === null) {
      handleError(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          "Product ID was not set before purchase.",
        ),
      );
      return;
    }

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
        lastError = null;
        currentPage = "payment-entry";
        gatewayParams = result.gateway_params;
        managementUrl = result.management_url;
      })
      .catch((e: PurchaseFlowError) => {
        if (e.errorCode === PurchaseFlowErrorCode.MissingEmailError) {
          email = undefined;
          return purchaseOperationHelper
            .checkoutStart(
              appUserId,
              productId,
              purchaseOption,
              rcPackage.webBillingProduct.presentedOfferingContext,
              email,
              metadata,
            )
            .then((result) => {
              lastError = null;
              currentPage = "payment-entry";
              gatewayParams = result.gateway_params;
              managementUrl = result.management_url;
            })
            .catch((e: PurchaseFlowError) => {
              handleError(e);
            });
        } else {
          handleError(e);
        }
      });
  });

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
  purchaseOptionToUse={purchaseOption}
  {lastError}
  {gatewayParams}
  {managementUrl}
  {purchaseOperationHelper}
  {isInElement}
  {termsAndConditionsUrl}
  customerEmail={email ?? null}
  {closeWithError}
  onContinue={handleContinue}
  onError={handleError}
  {onClose}
/>
