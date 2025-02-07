<script lang="ts">
  import Container from "./layout/container.svelte";
  import Layout from "./layout/layout.svelte";
  import NavBar from "./layout/navbar.svelte";
  import SandboxBanner from "./sandbox-banner.svelte";
  import Main from "./layout/main-block.svelte";
  import StateNeedsPaymentInfo from "./states/state-needs-payment-info.svelte";
  import StateNeedsAuthInfo from "./states/state-needs-auth-info.svelte";
  import StateLoading from "./states/state-loading.svelte";
  import StateError from "./states/state-error.svelte";
  import StateSuccess from "./states/state-success.svelte";
  import { type CurrentView } from "./ui-types";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product, PurchaseOption } from "../main";
  import StatePresentOffer from "./states/state-present-offer.svelte";
  import BrandingInfoUI from "./branding-info-ui.svelte";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../helpers/purchase-operation-helper";
  import { type PurchaseResponse } from "../networking/responses/purchase-response";
  import { onMount } from "svelte";
  import { loadStripe, Stripe } from "@stripe/stripe-js";

  export let currentView: CurrentView;
  export let brandingInfo: BrandingInfoResponse | null;
  export let productDetails: Product | null;
  export let purchaseOptionToUse: PurchaseOption;
  export let colorVariables: string = "";
  export let isSandbox: boolean = false;

  export let handleContinue: (authInfo?: { email: string }) => void;
  export let closeWithError: () => void;
  export let lastError: PurchaseFlowError | null;
  export let paymentInfoCollectionMetadata: PurchaseResponse | null;

  let stripe: Stripe | null = null;

  const viewsWhereOfferDetailsAreShown: CurrentView[] = [
    "present-offer",
    "needs-auth-info",
    "processing-auth-info",
    "needs-payment-info",
    "polling-purchase-status",
    "loading",
    "success",
    "error",
  ];

  $: if (paymentInfoCollectionMetadata && !stripe) {
    const stripePk = paymentInfoCollectionMetadata.data.publishable_api_key;
    const stripeAcctId = paymentInfoCollectionMetadata.data.stripe_account_id;

    if (!stripePk || !stripeAcctId) {
      throw new Error("Stripe publishable key or account ID not found");
    }

    loadStripe(stripePk, {
      stripeAccount: stripeAcctId,
    }).then((s) => {
      stripe = s;
    });

    console.log("stripe", stripe);
  }
</script>

<Container brandingAppearance={brandingInfo?.appearance}>
  {paymentInfoCollectionMetadata}
  {#if isSandbox}
    <SandboxBanner style={colorVariables} />
  {/if}
  <Layout style={colorVariables}>
    {#if viewsWhereOfferDetailsAreShown.includes(currentView)}
      <NavBar brandingAppearance={brandingInfo?.appearance}>
        {#snippet headerContent()}
          <BrandingInfoUI {brandingInfo} />
        {/snippet}

        {#snippet bodyContent(expanded: boolean)}
          {#if productDetails && purchaseOptionToUse}
            <StatePresentOffer
              {productDetails}
              brandingAppearance={brandingInfo?.appearance}
              purchaseOption={purchaseOptionToUse}
              {expanded}
            />
          {/if}
        {/snippet}
      </NavBar>
    {/if}
    <Main brandingAppearance={brandingInfo?.appearance}>
      {#snippet body()}
        {#if currentView === "present-offer" && productDetails && purchaseOptionToUse}
          <StatePresentOffer
            {productDetails}
            purchaseOption={purchaseOptionToUse}
            expanded={true}
          />
        {/if}
        {#if currentView === "present-offer" && !productDetails}
          <StateLoading />
        {/if}
        {#if currentView === "needs-auth-info" || currentView === "processing-auth-info"}
          <StateNeedsAuthInfo
            onContinue={handleContinue}
            processing={currentView === "processing-auth-info"}
            {lastError}
          />
        {/if}
        {#if paymentInfoCollectionMetadata && (currentView === "needs-payment-info" || currentView === "polling-purchase-status") && productDetails && purchaseOptionToUse}
          <StateNeedsPaymentInfo
            {paymentInfoCollectionMetadata}
            {stripe}
            onContinue={handleContinue}
            processing={currentView === "polling-purchase-status"}
            {productDetails}
            {purchaseOptionToUse}
            {brandingInfo}
          />
        {/if}
        {#if currentView === "loading"}
          <StateLoading />
        {/if}
        {#if currentView === "error"}
          <StateError
            lastError={lastError ??
              new PurchaseFlowError(
                PurchaseFlowErrorCode.UnknownError,
                "Unknown error without state set.",
              )}
            supportEmail={brandingInfo?.support_email}
            {productDetails}
            onContinue={closeWithError}
          />
        {/if}
        {#if currentView === "success"}
          <StateSuccess {productDetails} onContinue={handleContinue} />
        {/if}
      {/snippet}
    </Main>
  </Layout>
</Container>
