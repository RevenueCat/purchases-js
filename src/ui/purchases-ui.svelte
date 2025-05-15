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
    PurchaseFlowError,
    PurchaseFlowErrorCode,
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";

  import { type RedemptionInfo } from "../entities/redemption-info";
  import {
    type CustomTranslations,
    Translator,
  } from "./localization/translator";
  import { translatorContextKey } from "./localization/constants";
  import { type CurrentPage } from "./ui-types";
  import PurchasesUiInner from "./purchases-ui-inner.svelte";
  import { type IEventsTracker } from "../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "./constants";
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
    onFinished: (
      operationSessionId: string,
      redemptionInfo: RedemptionInfo | null,
    ) => void;
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
  let redemptionInfo: RedemptionInfo | null = $state(null);
  let operationSessionId: string | null = $state(null);
  let gatewayParams: GatewayParams = $state({});

  // For storing original styles
  let originalHtmlHeight: string | null = $state("");
  let originalHtmlOverflow: string | null = $state("");
  let originalBodyHeight: string | null = $state("");

  // Setting the context for the Localized components
  let translator: Translator = new Translator(
    customTranslations,
    selectedLocale,
    defaultLocale,
  );
  var translatorStore = writable(translator);
  setContext(translatorContextKey, translatorStore);

  onMount(() => {
    if (!isInElement) {
      // Save original styles
      originalHtmlHeight = document.documentElement.style.height;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyHeight = document.body.style.height;
      
      // Apply new styles
      document.documentElement.style.height = "100%";
      document.body.style.height = "100%";
      document.documentElement.style.overflow = "hidden";
    }
  });

  onDestroy(() => {
    if (!isInElement) {
      // Restore original styles
      document.documentElement.style.height = originalHtmlHeight;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
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
          currentPage = "success";
          redemptionInfo = pollResult.redemptionInfo;
          operationSessionId = pollResult.operationSessionId;
        })
        .catch((error: PurchaseFlowError) => {
          handleError(error);
        });
      return;
    }

    if (currentPage === "success" || currentPage === "error") {
      onFinished(operationSessionId!, redemptionInfo);
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
  {purchaseOperationHelper}
  {isInElement}
  customerEmail={email ?? null}
  {closeWithError}
  onContinue={handleContinue}
  onError={handleError}
  {onClose}
/>
