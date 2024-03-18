<script lang="ts">
  import { onMount } from "svelte";
  import { Package, Purchases, PurchasesError } from "../main";
  import StatePresentOffer from "./states/state-present-offer.svelte";
  import StateLoading from "./states/state-loading.svelte";
  import StateError from "./states/state-error.svelte";
  import StateSuccess from "./states/state-success.svelte";
  import StateNeedsPaymentInfo from "./states/state-needs-payment-info.svelte";
  import StateNeedsAuthInfo from "./states/state-needs-auth-info.svelte";
  import ConditionalFullScreen from "./conditional-full-screen.svelte";
  import Shell from "./shell.svelte";
  import { SubscribeResponse } from "../networking/responses/subscribe-response";
  import { BrandingInfoResponse } from "../networking/responses/branding-response";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";
  import { Backend } from "../networking/backend";
  import ModalHeader from "./modal-header.svelte";
  import IconCart from "./assets/icon-cart.svelte";
  import BrandingInfoUI from "./branding-info-ui.svelte";
  import SandboxBanner from "./sandbox-banner.svelte";
  import { Colors } from "../assets/colors";

  export let asModal = true;
  export let customerEmail: string | undefined;
  export let appUserId: string;
  export let rcPackage: Package;
  export let onFinished: () => void;
  export let onError: (error: PurchaseFlowError) => void;
  export let onClose: () => void;
  export let purchases: Purchases;
  export let backend: Backend;
  export let purchaseOperationHelper: PurchaseOperationHelper;

  const colorVariables = Object.entries(Colors)
    .map(([key, value]) => `--rc-color-${key}: ${value}`)
    .join("; ");

  let productDetails: any = null;
  let brandingInfo: BrandingInfoResponse | null = null;
  let paymentInfoCollectionMetadata: SubscribeResponse | null = null;
  let lastError: PurchaseFlowError | null = null;
  const productId = rcPackage.rcBillingProduct?.identifier ?? null;

  let state:
    | "present-offer"
    | "needs-auth-info"
    | "needs-payment-info"
    | "polling-purchase-status"
    | "loading"
    | "success"
    | "error" = "present-offer";

  const statesWhereOfferDetailsAreShown = [
    "present-offer",
    "needs-auth-info",
    "needs-payment-info",
    "loading",
  ];

  onMount(async () => {
    productDetails = rcPackage.rcBillingProduct;
    brandingInfo = await backend.getBrandingInfo();

    if (state === "present-offer") {
      if (customerEmail) {
        handleSubscribe();
      } else {
        state = "needs-auth-info";
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
    } else {
      state = "loading";
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
        customerEmail,
        rcPackage.rcBillingProduct.presentedOfferingIdentifier,
      )
      .then((result) => {
        if (result.next_action === "collect_payment_info") {
          state = "needs-payment-info";
          paymentInfoCollectionMetadata = result;
          return;
        }
        if (result.next_action === "completed") {
          state = "success";
          return;
        }
      })
      .catch((e: PurchasesError) => {
        handleError(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            e.message,
            e.underlyingErrorMessage,
          ),
        );
      });
  };

  const handleContinue = (authInfo?: { email: string }) => {
    if (state === "needs-auth-info") {
      if (authInfo) {
        customerEmail = authInfo.email;
      }

      handleSubscribe();
      return;
    }

    if (state === "needs-payment-info") {
      state = "polling-purchase-status";
      purchaseOperationHelper
        .pollCurrentPurchaseForCompletion()
        .then(() => {
          state = "success";
        })
        .catch((error: PurchaseFlowError) => {
          handleError(error);
        });
      return;
    }

    if (state === "success" || state === "error") {
      onFinished();
      return;
    }

    state = "success";
  };

  const handleError = (e: PurchaseFlowError) => {
    lastError = e;
    state = "error";
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

<div class="rcb-ui-container">
  <ConditionalFullScreen condition={asModal}>
    <div class="rcb-ui-layout" style={colorVariables}>
      {#if statesWhereOfferDetailsAreShown.includes(state)}
        <div class="rcb-ui-aside">
          <Shell dark>
            <ModalHeader slot="header">
              <BrandingInfoUI {brandingInfo} />
              {#if purchases.isSandbox()}
                <SandboxBanner />
              {:else}
                <IconCart />
              {/if}
            </ModalHeader>
            {#if productDetails}
              <StatePresentOffer {productDetails} />
            {/if}
          </Shell>
        </div>
      {/if}
      <Shell>
        {#if state === "present-offer" && productDetails}
          <StatePresentOffer {productDetails} />
        {/if}
        {#if state === "present-offer" && !productDetails}
          <StateLoading />
        {/if}
        {#if state === "polling-purchase-status"}
          <StateLoading />
        {/if}
        {#if state === "needs-auth-info"}
          <StateNeedsAuthInfo
            onContinue={handleContinue}
            onClose={handleClose}
          />
        {/if}
        {#if state === "needs-payment-info" && paymentInfoCollectionMetadata}
          <StateNeedsPaymentInfo
            {paymentInfoCollectionMetadata}
            onContinue={handleContinue}
            onClose={handleClose}
            onError={handleError}
          />
        {/if}
        {#if state === "loading"}
          <StateLoading />
        {/if}
        {#if state === "error"}
          <StateError
            {brandingInfo}
            lastError={lastError ??
              new PurchaseFlowError(
                PurchaseFlowErrorCode.UnknownError,
                "Unknown error without state set.",
              )}
            supportEmail={brandingInfo?.seller_company_support_email}
            onContinue={closeWithError}
          />
        {/if}
        {#if state === "success"}
          <StateSuccess {brandingInfo} onContinue={handleContinue} />
        {/if}
      </Shell>
    </div>
  </ConditionalFullScreen>
</div>

<style>
  .rcb-ui-container {
    color-scheme: none;
    font-size: 16px;
    line-height: 1.5em;
    font-weight: 400;
    font-family: -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu,
      Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  .rcb-ui-layout {
    width: 100vw;
    width: 100dvw;
    margin-right: auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    position: relative;
  }

  .rcb-ui-aside {
    margin-right: 16px;
  }

  @media screen and (max-width: 960px) {
    .rcb-ui-layout {
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .rcb-ui-aside {
      margin-right: 0;
      margin-bottom: 16px;
      min-width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }

  @media screen and (max-width: 960px) and (max-height: 960px) {
    .rcb-ui-layout {
      overflow-y: scroll;
      justify-content: flex-start;
      padding: 16px 0px;
    }
  }
</style>
