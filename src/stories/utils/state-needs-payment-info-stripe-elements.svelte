<script lang="ts">
  import { onMount } from "svelte";
  import { type PurchaseResponse } from "../../networking/responses/purchase-response";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { product, subscriptionOption } from "../fixtures";
  import { buildPurchaseResponse } from "./purchase-response-builder";
  import StateNeedsPaymentInfo from "../../ui/states/state-needs-payment-info.svelte";
  import StateLoading from "../../ui/states/state-loading.svelte";
  import Main from "../../ui/layout/main-block.svelte";
  export let brandingInfo: BrandingInfoResponse | null;

  let paymentMetadata: PurchaseResponse | null = null;
  let defaultArgs = {
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    onClose: () => {},
    onContinue: async () => {
      alert("Payment info submitted successfully!\n The form will be reset");
      paymentMetadata = null;
      paymentMetadata = await buildPurchaseResponse();
    },
  };

  onMount(async () => {
    paymentMetadata = await buildPurchaseResponse();
  });
</script>

<Main brandingAppearance={brandingInfo?.appearance}>
  {#if paymentMetadata}
    <StateNeedsPaymentInfo
      {...defaultArgs}
      {brandingInfo}
      paymentInfoCollectionMetadata={paymentMetadata}
    />
  {:else}
    <StateLoading />
  {/if}
</Main>
