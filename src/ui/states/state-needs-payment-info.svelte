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
  import { type PurchaseResponse } from "../../networking/responses/purchase-response";
  import { PurchaseFlowError, PurchaseFlowErrorCode } from "../../helpers/purchase-operation-helper";
  import ModalHeader from "../modal-header.svelte";
  import IconLock from "../icons/icon-lock.svelte";
  import ProcessingAnimation from "../processing-animation.svelte";
  import type { Product, PurchaseOption } from "../../entities/offerings";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import CloseButton from "../close-button.svelte";
  import { Theme } from "../theme/theme";


  export let onClose: any;
  export let onContinue: any;
  export let onError: any;
  export let paymentInfoCollectionMetadata: PurchaseResponse;
  export let processing = false;
  export let productDetails: Product;
  export let purchaseOptionToUse: PurchaseOption;
  export let brandingInfo: BrandingInfoResponse | null;

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

  const theme = new Theme(brandingInfo?.appearance);

  let shapeCustomisation = theme.shape;
  let customColors = theme.formColors;
</script>

<div>
  {#if stripe && clientSecret}
    <ModalHeader>
      <div style="display: flex; align-items: center; justify-content: baseline;">
        <IconLock />
        <div style="margin-left: 10px">Secure Checkout</div>
      </div>
      <CloseButton on:click={onClose} />
    </ModalHeader>
    <form on:submit|preventDefault={handleContinue}>
      <Elements
        {stripe}
        {clientSecret}
        loader="always"
        bind:elements
        theme="stripe"
        variables={{
          borderRadius: shapeCustomisation["input-border-radius"],
          fontSizeBase: "16px",
          fontSizeSm: "16px",
          spacingGridRow: "16px",
          focusBoxShadow: "none",
          colorDanger: customColors["error"],
          colorTextPlaceholder: customColors["grey-text-light"],
        }}
        rules={{
          ".Input": {
            boxShadow: "none",
            border: `2px solid ${customColors["grey-ui-dark"]}`,
            backgroundColor: "transparent",
            color: customColors["grey-text-dark"],
          },
          ".Input:focus": {
            border: `2px solid ${customColors["focus"]}`,
            outline: "none",

          },
          ".Label": {
            marginBottom: "8px",
            fontWeight: "500",
            lineHeight: "22px",
            color:customColors["grey-text-dark"],
          },
          ".Input--invalid": {
            boxShadow: "none",
          },
          ".Tab": {
            boxShadow: "none",
            backgroundColor: "transparent",
          },
        }}
      >
        <ModalSection>
          <div class="rcb-stripe-elements-container">
            <PaymentElement />
          </div>
        </ModalSection>
        <ModalFooter>
          <RowLayout>
            <Button disabled={processing} testId="PayButton">
              {#if processing}
                <ProcessingAnimation />
              {:else if productDetails.subscriptionOptions?.[purchaseOptionToUse.id]?.trial}
                Start Trial
              {:else}
                Pay
              {/if}
            </Button>
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

        /* The standard height of the payment form from Stripe */
        /* Added to avoid the card getting smaller while loading */
        min-height: 320px;

        margin-top: 32px;
        margin-bottom: 24px;
    }
</style>
