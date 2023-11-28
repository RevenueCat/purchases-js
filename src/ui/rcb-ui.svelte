<script lang="ts">
  import ModalHeader from "./modal-header.svelte";
  import { onMount } from "svelte";
  import ModalBackdrop from "./modal-backdrop.svelte";
  import Modal from "./modal.svelte";
  import SandboxBanner from "./sandbox-banner.svelte";
  import { Purchases } from "../main";
  import StatePresentOffer from "./state-present-offer.svelte";
  import StateLoading from "./state-loading.svelte";
  import StateError from "./state-error.svelte";
  import StateSuccess from "./state-success.svelte";
  import StateNeedsPaymentInfo from "./state-needs-payment-info.svelte";
  import { SubscribeResponse } from "../entities/subscribe-response";
  import StateWaitingForEntitlement from "./state-waiting-for-entitlement.svelte";

  let open = false;

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
  };

  const handleSubscribe = () => {
    state = "loading";
    purchases
      .subscribe(appUserId, productId, environment)
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

  const handleContinue = () => {
    if (state === "present-offer") {
      handleSubscribe();
      return;
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

{#if open}
  <ModalBackdrop>
    <Modal>
      <ModalHeader title="CatGPT" />
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
    </Modal>
  </ModalBackdrop>
{/if}

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
</style>
