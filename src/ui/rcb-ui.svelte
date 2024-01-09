<script lang="ts">
  import { onMount } from "svelte";
  import SandboxBanner from "./sandbox-banner.svelte";
  import { Purchases } from "../main";
  import StatePresentOffer from "./states/state-present-offer.svelte";
  import StateLoading from "./states/state-loading.svelte";
  import StateError from "./states/state-error.svelte";
  import StateSuccess from "./states/state-success.svelte";
  import StateNeedsPaymentInfo from "./states/state-needs-payment-info.svelte";
  import StateNeedsAuthInfo from "./states/state-needs-auth-info.svelte";
  import { SubscribeResponse } from "../entities/subscribe-response";
  import StateWaitingForEntitlement from "./states/state-waiting-for-entitlement.svelte";
  import ConditionalFullScreen from "./conditional-full-screen.svelte";
  import Shell from "./shell.svelte";

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

  const statesWhereOfferDetailsAreShown = [
    "present-offer",
    "needs-auth-info",
    "needs-payment-info",
    "loading",
  ];

  onMount(async () => {
    productDetails = await purchases.getProduct(productId);

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
      return;
    }

    state = "success";
  };

  const handleError = () => {
    state = "error";
  };
</script>

<div class="rcb-ui-container">
  <ConditionalFullScreen condition={asModal}>
    <div class="rcb-ui-layout">
      {#if statesWhereOfferDetailsAreShown.includes(state)}
        <div class="rcb-ui-aside">
          <Shell dark title="OpenScratches, Inc.">
            {#if productDetails}
              <StatePresentOffer
                {productDetails}
                onContinue={handleContinue}
                onClose={handleClose}
              />
            {/if}
          </Shell>
          {#if environment === "sandbox"}
            <SandboxBanner />
          {/if}
        </div>
      {/if}
      <Shell>
        {#if state === "present-offer" && productDetails}
          <StatePresentOffer
            {productDetails}
            onContinue={handleContinue}
            onClose={handleClose}
          />
        {/if}
        {#if state === "present-offer" && !productDetails}
          <StateLoading />
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
      </Shell>
    </div>
  </ConditionalFullScreen>
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
      "PP Object Sans",
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

  .rcb-ui-layout {
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .rcb-ui-aside {
    margin-right: 1rem;
  }

  @media screen and (max-width: 60rem) {
    .rcb-ui-layout {
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      height: 100%;
    }

    .rcb-ui-aside {
      margin-right: 0;
      margin-bottom: 1rem;
    }
  }
</style>
