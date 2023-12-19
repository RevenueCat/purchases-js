<script lang="ts">
  import { onMount } from "svelte";
  import SandboxBanner from "./sandbox-banner.svelte";
  import { Purchases } from "../main";
  import StatePresentOffer from "./state-present-offer.svelte";
  import StateLoading from "./state-loading.svelte";
  import StateError from "./state-error.svelte";
  import StateSuccess from "./state-success.svelte";
  import StateNeedsPaymentInfo from "./state-needs-payment-info.svelte";
  import StateNeedsAuthInfo from "./state-needs-auth-info.svelte";
  import { SubscribeResponse } from "../entities/subscribe-response";
  import StateWaitingForEntitlement from "./state-waiting-for-entitlement.svelte";
  import ConditionalModal from "./conditional-modal.svelte";

  let open = false;

  export let asModal = true;
  export let customerEmail: string;
  export let appUserId: string;
  export let productId: string;
  export let onFinished: () => void;
  export let purchases: Purchases;
  export let entitlement: string;
  export let environment: "sandbox" | "production" = "sandbox";

  let productDetails: any = null;
  let paymentInfoCollectionMetadata: SubscribeResponse | null = null;

  let state:
    | "present-offer"
    | "needs-auth-info"
    | "needs-payment-info"
    | "loading"
    | "waiting-for-entitlement"
    | "success"
    | "error" = "present-offer";

  onMount(async () => {
    open = true;

    productDetails = await purchases.getProduct(productId);
  });

  const handleClose = () => {
    open = false;
    onFinished();
  };

  const handleSubscribe = () => {
    state = "loading";
    purchases
      .subscribe(appUserId, productId, customerEmail, environment)
      .then((result) => {
        if (result.nextAction === "collect_payment_info") {
          state = "needs-payment-info";
          paymentInfoCollectionMetadata = result;
          return;
        }
        state = "success";
      })
      .catch(() => {
        state = "error";
      });
  };

  const handleContinue = (authInfo?: { email: string }) => {
    if (state === "present-offer") {
      if (customerEmail) {
        handleSubscribe();
      } else {
        state = "needs-auth-info";
      }

      return;
    }

    if (state === "needs-auth-info") {
      if (authInfo) {
        customerEmail = authInfo.email;
      }

      handleSubscribe();
    }

    if (state === "waiting-for-entitlement") {
      state = "success";
      return;
    }

    if (state === "needs-payment-info") {
      state = "waiting-for-entitlement";
      return;
    }

    if (state === "success" || state === "error") {
      onFinished();
      open = false;
      return;
    }

    state = "success";
  };

  const handleError = () => {
    state = "error";
  };
</script>

<div class="rcb-ui-container">
  {#if open}
    <ConditionalModal title="CatGPT" condition={asModal}>
      {#if environment === "sandbox"}
        <SandboxBanner />
      {/if}
      {#if state === "present-offer"}
        <StatePresentOffer
          {productDetails}
          onContinue={handleContinue}
          onClose={handleClose}
        />
      {/if}
      {#if state === "needs-auth-info"}
        <StateNeedsAuthInfo
          {purchases}
          onContinue={handleContinue}
          onClose={handleClose}
          onError={handleError}
        />
      {/if}
      {#if state === "needs-payment-info" && paymentInfoCollectionMetadata}
        <StateNeedsPaymentInfo
          {purchases}
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
        <StateError />
      {/if}
      {#if state === "success"}
        <StateSuccess onContinue={handleContinue} />
      {/if}
      {#if state === "waiting-for-entitlement"}
        <StateWaitingForEntitlement
          {purchases}
          {appUserId}
          {entitlement}
          onContinue={handleContinue}
          onError={handleError}
        />
      {/if}
    </ConditionalModal>
  {/if}
</div>

<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css"
  integrity="sha512-NhSC1YmyruXifcj/KFRWoC561YpHpc5Jtzgvbuzx5VozKpWvQ+4nXhPdFgmx8xqexRcpAglTj9sIBWINXa8x5w=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
/>

<style>
  :global(h1),
  :global(h2),
  :global(h3),
  :global(h4),
  :global(h5),
  :global(h6) {
    margin: 0;
    font-size: 1rem;
    font-weight: normal;
  }

  .rcb-ui-container {
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      avenir next,
      avenir,
      segoe ui,
      helvetica neue,
      helvetica,
      Cantarell,
      Ubuntu,
      roboto,
      noto,
      arial,
      sans-serif;
  }
</style>
