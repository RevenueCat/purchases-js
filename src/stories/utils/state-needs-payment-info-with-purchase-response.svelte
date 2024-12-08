<script lang="ts">
  import { type ComponentProps, onMount } from "svelte";
  import { type PurchaseResponse } from "../../networking/responses/purchase-response";
  import { buildPurchaseResponse } from "./purchase-response-builder";
  import StateNeedsPaymentInfo from "../../ui/states/state-needs-payment-info.svelte";
  import StateLoading from "../../ui/states/state-loading.svelte";

  export let args: ComponentProps<StateNeedsPaymentInfo>;

  let paymentMetadata: PurchaseResponse | null = null;
  let overriddenArgs = {
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

{#if paymentMetadata}
  <StateNeedsPaymentInfo
    {...args}
    {...overriddenArgs}
    paymentInfoCollectionMetadata={paymentMetadata}
  />
{:else}
  <StateLoading />
{/if}
