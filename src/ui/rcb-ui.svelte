<script lang="ts">
  import { onMount, setContext, onDestroy } from "svelte";
  import type { Package, Product, PurchaseOption, Purchases } from "../main";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
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
  import { CheckoutStartResponse } from "../networking/responses/checkout-start-response";
  import { type ContinueHandlerParams } from "./ui-types";

  export let customerEmail: string | undefined;
  export let appUserId: string;
  export let rcPackage: Package;
  export let purchaseOption: PurchaseOption | null | undefined;
  export let brandingInfo: BrandingInfoResponse | null;
  export let onFinished: (redemptionInfo: RedemptionInfo | null) => void;
  export let onError: (error: PurchaseFlowError) => void;
  // We don't have a close button in the UI, but we might add one soon
  export const onClose: (() => void) | undefined = undefined;
  export let purchases: Purchases;
  export let purchaseOperationHelper: PurchaseOperationHelper;
  export let selectedLocale: string = englishLocale;
  export let defaultLocale: string = englishLocale;
  export let customTranslations: CustomTranslations = {};

  let colorVariables = "";
  let productDetails: Product | null = null;
  let paymentInfoCollectionMetadata: CheckoutStartResponse | null = null;
  let lastError: PurchaseFlowError | null = null;
  const productId = rcPackage.webBillingProduct.identifier ?? null;
  const defaultPurchaseOption =
    rcPackage.webBillingProduct.defaultPurchaseOption;
  const purchaseOptionToUse = purchaseOption
    ? purchaseOption
    : defaultPurchaseOption;

  let currentView: CurrentView = "present-offer";
  let redemptionInfo: RedemptionInfo | null = null;

  // Setting the context for the Localized components
  setContext(
    translatorContextKey,
    new Translator(customTranslations, selectedLocale, defaultLocale),
  );

  onMount(() => {
    document.body.style.overflow = "hidden"; // Prevents background scrolling
  });

  onDestroy(() => {
    document.body.style.overflow = ""; // Restores default scrolling when unmounting
  });

  onMount(async () => {
    productDetails = rcPackage.webBillingProduct;

    colorVariables = toProductInfoStyleVar(brandingInfo?.appearance);

    if (currentView === "present-offer") {
      handleCheckoutStart();
      currentView = "needs-payment-info";
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

    purchaseOperationHelper
      .checkoutStart(
        appUserId,
        productId,
        purchaseOptionToUse,
        rcPackage.webBillingProduct.presentedOfferingContext,
        customerEmail,
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

    if (currentView === "needs-payment-info") {
      currentView = "polling-purchase-status";
      purchaseOperationHelper
        .pollCurrentPurchaseForCompletion()
        .then((pollResult) => {
          currentView = "success";
          redemptionInfo = pollResult.redemptionInfo;
        })
        .catch((error: PurchaseFlowError) => {
          handleError(error);
        });
      return;
    }

    if (currentView === "success" || currentView === "error") {
      onFinished(redemptionInfo);
      return;
    }

    currentView = "success";
  };

  const handleError = (e: PurchaseFlowError) => {
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

{console.log(currentView)}

<RcbUIInner
  isSandbox={purchases.isSandbox()}
  {currentView}
  {brandingInfo}
  {productDetails}
  {purchaseOptionToUse}
  {handleContinue}
  {lastError}
  {paymentInfoCollectionMetadata}
  {purchaseOperationHelper}
  {closeWithError}
  {colorVariables}
/>
