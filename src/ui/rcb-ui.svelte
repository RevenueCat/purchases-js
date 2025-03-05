<script lang="ts">
  import { onMount, setContext, onDestroy } from "svelte";
  import type { Package, Product, PurchaseOption, Purchases } from "../main";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import { lock, unlock } from "tua-body-scroll-lock";

  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";

  import { toProductInfoStyleVar } from "./theme/utils";
  import { type RedemptionInfo } from "../entities/redemption-info";
  import {
    type CustomTranslations,
    Translator,
  } from "./localization/translator";
  import {
    englishLocale,
    translatorContextKey,
  } from "./localization/constants";
  import { type CurrentView } from "./ui-types";
  import RcbUIInner from "./rcb-ui-inner.svelte";
  import { type CheckoutStartResponse } from "../networking/responses/checkout-start-response";
  import { type ContinueHandlerParams } from "./ui-types";
  import { type IEventsTracker } from "../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "./constants";
  import { createCheckoutFlowErrorEvent } from "../behavioural-events/sdk-event-helpers";
  import type { PurchaseMetadata } from "../entities/offerings";

  export let customerEmail: string | undefined;
  export let appUserId: string;
  export let rcPackage: Package;
  export let purchaseOption: PurchaseOption;
  export let metadata: PurchaseMetadata | undefined;
  export let brandingInfo: BrandingInfoResponse | null;
  export let onFinished: (
    operationSessionId: string,
    redemptionInfo: RedemptionInfo | null,
  ) => void;
  export let onError: (error: PurchaseFlowError) => void;
  // We don't have a close button in the UI, but we might add one soon
  export const onClose: (() => void) | undefined = undefined;
  export let purchases: Purchases;
  export let eventsTracker: IEventsTracker;
  export let purchaseOperationHelper: PurchaseOperationHelper;
  export let selectedLocale: string = englishLocale;
  export let defaultLocale: string = englishLocale;
  export let customTranslations: CustomTranslations = {};
  export let isInElement: boolean = false;

  let colorVariables = "";
  let productDetails: Product | null = null;
  let paymentInfoCollectionMetadata: CheckoutStartResponse | null = null;
  let lastError: PurchaseFlowError | null = null;
  const productId = rcPackage.webBillingProduct.identifier ?? null;

  let currentView: CurrentView = "present-offer";
  let redemptionInfo: RedemptionInfo | null = null;
  let operationSessionId: string | null = null;

  // Setting the context for the Localized components
  setContext(
    translatorContextKey,
    new Translator(customTranslations, selectedLocale, defaultLocale),
  );

  onMount(() => {
    if (!isInElement) {
      // make html and body have height 100%
      document.documentElement.style.height = "100%";
      document.body.style.height = "100%";
      document.documentElement.style.overflow = "hidden";
      lock(document.getElementById("rcb-ui-container"));
    }
  });

  onDestroy(() => {
    if (!isInElement) {
      unlock(document.getElementById("rcb-ui-container"));
      document.documentElement.style.height = "auto";
      document.body.style.height = "auto";
      document.documentElement.style.overflow = "auto";
    }
  });

  setContext(eventsTrackerContextKey, eventsTracker);

  onMount(async () => {
    productDetails = rcPackage.webBillingProduct;

    colorVariables = toProductInfoStyleVar(brandingInfo?.appearance);

    if (currentView === "present-offer") {
      if (customerEmail) {
        handleCheckoutStart();
      } else {
        currentView = "needs-auth-info";
      }

      return;
    }
  });

  const handleCheckoutStart = () => {
    if (productId === null) {
      handleError(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          "Product ID was not set before purchase.",
        ),
      );
      return;
    } else if (currentView === "present-offer") {
      currentView = "loading";
    }

    if (!customerEmail) {
      handleError(
        new PurchaseFlowError(PurchaseFlowErrorCode.MissingEmailError),
      );
      return;
    }

    purchaseOperationHelper
      .checkoutStart(
        appUserId,
        productId,
        purchaseOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        customerEmail,
        metadata,
      )
      .then((result) => {
        lastError = null;
        currentView = "needs-payment-info";
        paymentInfoCollectionMetadata = result;
      })
      .catch((e: PurchaseFlowError) => {
        handleError(e);
      });
  };

  const handleContinue = (params: ContinueHandlerParams = {}) => {
    if (params.error) {
      handleError(params.error);
      return;
    }

    if (currentView === "needs-auth-info") {
      if (params.authInfo) {
        customerEmail = params.authInfo.email;
        currentView = "processing-auth-info";
      }

      handleCheckoutStart();
      return;
    }

    if (currentView === "needs-payment-info") {
      currentView = "polling-purchase-status";
      purchaseOperationHelper
        .pollCurrentPurchaseForCompletion()
        .then((pollResult) => {
          currentView = "success";
          redemptionInfo = pollResult.redemptionInfo;
          operationSessionId = pollResult.operationSessionId;
        })
        .catch((error: PurchaseFlowError) => {
          handleError(error);
        });
      return;
    }

    if (currentView === "success" || currentView === "error") {
      onFinished(operationSessionId!, redemptionInfo);
      return;
    }

    currentView = "success";
  };

  const handleError = (e: PurchaseFlowError) => {
    const event = createCheckoutFlowErrorEvent({
      errorCode: e.getErrorCode().toString(),
      errorMessage: e.message,
    });
    eventsTracker.trackSDKEvent(event);
    if (currentView === "processing-auth-info" && e.isRecoverable()) {
      lastError = e;
      currentView = "needs-auth-info";
      return;
    }
    lastError = e;
    currentView = "error";
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

<RcbUIInner
  isSandbox={purchases.isSandbox()}
  {currentView}
  {brandingInfo}
  {productDetails}
  purchaseOptionToUse={purchaseOption}
  {handleContinue}
  {lastError}
  {paymentInfoCollectionMetadata}
  {purchaseOperationHelper}
  {closeWithError}
  {colorVariables}
  {isInElement}
/>
