<script lang="ts">
  import { onMount, setContext, onDestroy } from "svelte";
  import type { Package, Product, PurchaseOption, Purchases } from "../main";
  import { type PurchaseResponse } from "../networking/responses/purchase-response";
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

  export let customerEmail: string | undefined;
  export let appUserId: string;
  export let rcPackage: Package;
  export let purchaseOption: PurchaseOption | null | undefined;
  export let brandingInfo: BrandingInfoResponse | null;
  export let onFinished: (redemptionInfo: RedemptionInfo | null) => void;
  export let onError: (error: PurchaseFlowError) => void;
  export let onClose: () => void;
  export let purchases: Purchases;
  export let purchaseOperationHelper: PurchaseOperationHelper;
  export let selectedLocale: string = englishLocale;
  export let defaultLocale: string = englishLocale;
  export let customTranslations: CustomTranslations = {};

  let colorVariables = "";
  let productDetails: Product | null = null;
  let paymentInfoCollectionMetadata: PurchaseResponse | null = null;
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
      if (customerEmail) {
        handleSubscribe();
      } else {
        currentView = "needs-auth-info";
      }

      return;
    }
  });

  const handleClose = () => {
    onClose();
  };

  const handleSubscribe = () => {
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
      .startPurchase(
        appUserId,
        productId,
        purchaseOptionToUse,
        customerEmail,
        rcPackage.webBillingProduct.presentedOfferingContext,
      )
      .then((result) => {
        if (result.next_action === "collect_payment_info") {
          lastError = null;
          currentView = "needs-payment-info";
          paymentInfoCollectionMetadata = result;
          return;
        }
        if (result.next_action === "completed") {
          lastError = null;
          currentView = "success";
          return;
        }
      })
      .catch((e: PurchaseFlowError) => {
        handleError(e);
      });
  };

  const handleContinue = (authInfo?: { email: string }) => {
    if (currentView === "needs-auth-info") {
      if (authInfo) {
        customerEmail = authInfo.email;
        currentView = "processing-auth-info";
      }

      handleSubscribe();
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
  {purchaseOptionToUse}
  {handleContinue}
  {handleClose}
  {lastError}
  {paymentInfoCollectionMetadata}
  {closeWithError}
/>
