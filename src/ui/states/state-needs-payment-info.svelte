<script lang="ts">
  import { onMount } from "svelte";
  import Button from "../button.svelte";
  import { Elements, PaymentElement } from "svelte-stripe";
  import type { Stripe, StripeElements } from "@stripe/stripe-js";
  import { loadStripe } from "@stripe/stripe-js";
  import ModalSection from "../modal-section.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import StateLoading from "./state-loading.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import { type SubscribeResponse } from "../../networking/responses/subscribe-response";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../../helpers/purchase-operation-helper";
  import ModalHeader from "../modal-header.svelte";
  import IconLock from "../assets/icon-lock.svelte";
  import { Colors } from "../../assets/colors";
  import ProcessingAnimation from "../processing-animation.svelte";
  import { Product, PurchaseOption } from "../../entities/offerings";

  export let onClose: any;
  export let onContinue: any;
  export let onError: any;
  export let paymentInfoCollectionMetadata: SubscribeResponse;
  export let processing = false;
  export let productDetails: Product;
  export let purchaseOptionToUse: PurchaseOption;

  const clientSecret = paymentInfoCollectionMetadata.data.client_secret;

  let stripe: Stripe | null = null;
  let elements: StripeElements;
  let safeElements: StripeElements;

  $: {
    // @ts-ignore
    if (elements && elements._elements.length > 0) {
      safeElements = elements;
    }
  }

  onMount(async () => {
    const stripePk = paymentInfoCollectionMetadata.data.publishable_api_key;
    const stripeAcctId = paymentInfoCollectionMetadata.data.stripe_account_id;

    if (!stripePk || !stripeAcctId) {
      throw new Error("Stripe publishable key or account ID not found");
    }

    stripe = await loadStripe(stripePk, { stripeAccount: stripeAcctId });
  });

  const handleContinue = async () => {
    if (processing || !stripe || !safeElements) return;

    processing = true;

    // confirm payment with stripe
    const result = await stripe.confirmSetup({
      elements: safeElements,
      redirect: "if_required",
    });

    if (result.error) {
      // payment failed, notify user
      processing = false;
      onError(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.StripeError,
          result.error.message,
        ),
      );
    } else {
      onContinue();
    }
  };
</script>

<div>
  {#if stripe && clientSecret}
    <form on:submit|preventDefault={handleContinue}>
      <Elements
        {stripe}
        {clientSecret}
        loader="always"
        bind:elements
        theme="stripe"
        variables={{
          borderRadius: "12px",
          fontSizeBase: "16px",
          fontSizeSm: "16px",
          spacingGridRow: "16px",
          colorText: Colors["grey-text-dark"],
          focusBoxShadow: "none",
          colorDanger: Colors["error"],
        }}
        rules={{
          ".Input": {
            boxShadow: "none",
            border: `2px solid ${Colors["grey-ui-dark"]}`,
          },
          ".Input:focus": {
            border: `2px solid ${Colors["focus"]}`,
            outline: "none",
          },
          ".Label": {
            marginBottom: "8px",
            fontWeight: "500",
            lineHeight: "22px",
          },
          ".Input--invalid": {
            boxShadow: "none",
          },
        }}
      >
        <ModalHeader>
          <div>Secure Checkout</div>
          <IconLock />
        </ModalHeader>
        <ModalSection>
          <div class="rcb-stripe-elements-container">
            <PaymentElement />
          </div>
        </ModalSection>
        <ModalFooter>
          <RowLayout>
            <Button disabled={processing} id="Pay">
              {#if processing}
                <ProcessingAnimation />
              {:else if productDetails.subscriptionOptions[purchaseOptionToUse.id]?.trial}
                Start Trial
              {:else}
                Pay
              {/if}
            </Button>
            <Button disabled={processing} intent="secondary" on:click={onClose}
              >Close</Button
            >
          </RowLayout>
        </ModalFooter>
      </Elements>
    </form>
  {:else}
    <StateLoading />
  {/if}
</div>

<style>
  .rcb-stripe-elements-container {
    width: 100%;
    margin-top: 32px;
    margin-bottom: 24px;
  }
</style>
