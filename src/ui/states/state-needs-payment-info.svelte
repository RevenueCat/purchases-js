<script lang="ts">
  import { onMount } from "svelte";
  import { Purchases } from "../../main";
  import Button from "../button.svelte";
  import { Elements, PaymentElement } from "svelte-stripe";
  import type { Stripe, StripeElements } from "@stripe/stripe-js";
  import { loadStripe } from "@stripe/stripe-js";
  import ModalSection from "../modal-section.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import StateLoading from "./state-loading.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import { SubscribeResponse } from "../../networking/responses/subscribe-response";

  export let onClose: any;
  export let onContinue: any;
  export let onError: any;
  export let purchases: Purchases;
  export let paymentInfoCollectionMetadata: SubscribeResponse;

  const clientSecret = paymentInfoCollectionMetadata.data.client_secret;

  let stripe: Stripe | null = null;
  let elements: StripeElements;
  let processing = false;
  let safeElements: StripeElements;

  $: {
    // @ts-ignore
    if (elements && elements._elements.length > 0) {
      safeElements = elements;
    }
  }

  onMount(async () => {
    const stripeSettings = purchases?._PAYMENT_PROVIDER_SETTINGS?.stripe;

    if (!stripeSettings) {
      throw new Error("Stripe settings not found");
    }

    const stripePk = stripeSettings.publishableKey;
    const stripeAcctId = stripeSettings.accountId;

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
      onError(result.error);
    } else {
      onContinue();
    }
  };
</script>

<div>
  {#if stripe && clientSecret}
    <form on:submit|preventDefault={handleContinue}>
      <Elements {stripe} {clientSecret} loader="always" bind:elements>
        <ModalSection>
          <div class="rcb-stripe-elements-container">
            <PaymentElement />
          </div>
        </ModalSection>
        <ModalFooter>
          <RowLayout>
            <Button disabled={processing}>
              {#if processing}
                Processing...
              {:else}
                Pay
              {/if}</Button
            >
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
    margin-bottom: 1rem;
  }
</style>
