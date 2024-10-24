<script lang="ts">
  import { onMount } from "svelte";
  import type { Package, Product, PurchaseOption, Purchases } from "../main";
  import StatePresentOffer from "./states/state-present-offer.svelte";
  import StateLoading from "./states/state-loading.svelte";
  import StateError from "./states/state-error.svelte";
  import StateSuccess from "./states/state-success.svelte";
  import StateNeedsPaymentInfo from "./states/state-needs-payment-info.svelte";
  import StateNeedsAuthInfo from "./states/state-needs-auth-info.svelte";
  import ConditionalFullScreen from "./conditional-full-screen.svelte";
  import { type PurchaseResponse } from "../networking/responses/purchase-response";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";
  import ModalHeader from "./modal-header.svelte";
  import IconCart from "./icons/icon-cart.svelte";
  import BrandingInfoUI from "./branding-info-ui.svelte";
  import SandboxBanner from "./sandbox-banner.svelte";
  import Layout from "./layout/layout.svelte";
  import Container from "./layout/container.svelte";
  import Aside from "./layout/aside-block.svelte";
  import Main from "./layout/main-block.svelte";

  import { toProductInfoStyleVar } from "./theme/utils";

  export let asModal = true;
  export let customerEmail: string | undefined;
  export let appUserId: string;
  export let rcPackage: Package;
  export let purchaseOption: PurchaseOption | null | undefined;
  export let brandingInfo: BrandingInfoResponse | null;
  export let onFinished: () => void;
  export let onError: (error: PurchaseFlowError) => void;
  export let onClose: () => void;
  export let purchases: Purchases;
  export let purchaseOperationHelper: PurchaseOperationHelper;

  let colorVariables = "";
  let productDetails: Product | null = null;
  let paymentInfoCollectionMetadata: PurchaseResponse | null = null;
  let lastError: PurchaseFlowError | null = null;
  const productId = rcPackage.rcBillingProduct.identifier ?? null;
  const defaultPurchaseOption =
    rcPackage.rcBillingProduct.defaultPurchaseOption;
  const purchaseOptionToUse = purchaseOption
    ? purchaseOption
    : defaultPurchaseOption;

  let state:
    | "present-offer"
    | "needs-auth-info"
    | "processing-auth-info"
    | "needs-payment-info"
    | "polling-purchase-status"
    | "loading"
    | "success"
    | "error" = "present-offer";

  const statesWhereOfferDetailsAreShown = [
    "present-offer",
    "needs-auth-info",
    "processing-auth-info",
    "needs-payment-info",
    "polling-purchase-status",
    "loading",
  ];

  onMount(async () => {
    productDetails = rcPackage.rcBillingProduct;

    colorVariables = toProductInfoStyleVar(
      brandingInfo?.appearance,
    );

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
    } else if (state === "present-offer") {
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
        purchaseOptionToUse,
        customerEmail,
        rcPackage.rcBillingProduct.presentedOfferingContext,
      )
      .then((result) => {
        if (result.next_action === "collect_payment_info") {
          lastError = null;
          state = "needs-payment-info";
          paymentInfoCollectionMetadata = result;
          return;
        }
        if (result.next_action === "completed") {
          lastError = null;
          state = "success";
          return;
        }
      })
      .catch((e: PurchaseFlowError) => {
        handleError(e);
      });
  };

  const handleContinue = (authInfo?: { email: string }) => {
    if (state === "needs-auth-info") {
      if (authInfo) {
        customerEmail = authInfo.email;
        state = "processing-auth-info";
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
    if (state === "processing-auth-info" && e.isRecoverable()) {
      lastError = e;
      state = "needs-auth-info";
      return;
    }
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

<Container>
  <ConditionalFullScreen condition={asModal}>
    <Layout style={colorVariables}>
      {#if statesWhereOfferDetailsAreShown.includes(state)}
        <Aside brandingAppearance={brandingInfo?.appearance}>
          <ModalHeader slot="header">
            <BrandingInfoUI {brandingInfo} />
            {#if purchases.isSandbox()}
              <SandboxBanner />
            {:else}
              <IconCart />
            {/if}
          </ModalHeader>
          {#if productDetails && purchaseOptionToUse}
            <StatePresentOffer
              {productDetails}
              brandingAppearance={brandingInfo?.appearance}
              purchaseOption={purchaseOptionToUse}
            />
          {/if}
        </Aside>
      {/if}
      <Main brandingAppearance={brandingInfo?.appearance}>
        {#if state === "present-offer" && productDetails && purchaseOptionToUse}
          <StatePresentOffer
            {productDetails}
            purchaseOption={purchaseOptionToUse}
          />
        {/if}
        {#if state === "present-offer" && !productDetails}
          <StateLoading />
        {/if}
        {#if state === "needs-auth-info" || state === "processing-auth-info"}
          <StateNeedsAuthInfo
            onContinue={handleContinue}
            onClose={handleClose}
            processing={state === "processing-auth-info"}
            {lastError}
          />
        {/if}
        {#if paymentInfoCollectionMetadata && (state === "needs-payment-info" || state === "polling-purchase-status") && productDetails && purchaseOptionToUse}
          <StateNeedsPaymentInfo
            {paymentInfoCollectionMetadata}
            onContinue={handleContinue}
            onClose={handleClose}
            onError={handleError}
            processing={state === "polling-purchase-status"}
            {productDetails}
            {purchaseOptionToUse}
            {brandingInfo}
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
            productDetails={productDetails}
            onContinue={closeWithError}
          />
        {/if}
        {#if state === "success"}
          <StateSuccess {productDetails} {brandingInfo} onContinue={handleContinue} />
        {/if}
      </Main>
    </Layout>
  </ConditionalFullScreen>
</Container>
