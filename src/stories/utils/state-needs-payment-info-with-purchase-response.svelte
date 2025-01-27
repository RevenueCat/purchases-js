<script lang="ts">
  import { type ComponentProps, onMount } from "svelte";
  import { type PurchaseResponse } from "../../networking/responses/purchase-response";
  import {
    buildPurchaseResponse,
    SetupMode,
  } from "./purchase-response-builder";
  import StateNeedsPaymentInfo from "../../ui/states/state-needs-payment-info.svelte";

  export let args: ComponentProps<StateNeedsPaymentInfo>;

  export let setupMode: SetupMode = SetupMode.TrialSubscription;

  let paymentMetadata: PurchaseResponse | null = null;
  const overriddenArgs = {
    onClose: () => {},
    onContinue: async () => {
      alert("Payment info submitted successfully!\n The form will be reset");
      paymentMetadata = null;
      paymentMetadata = await buildPurchaseResponse(setupMode);
    },
  };

  let error: string | null = null;
  onMount(async () => {
    try {
      paymentMetadata = await buildPurchaseResponse(setupMode);
    } catch (err) {
      error = (err as Error).message;
    }
  });
</script>

{#if error}
  <div
    style="color: red; background-color: #f0f0f0; padding: 10px; border-radius: 5px;"
  >
    ❌ <span style="font-weight: bold;">Setup error:</span>
    {error}
  </div>
{/if}

{#if paymentMetadata}
  <StateNeedsPaymentInfo
    {...args}
    {...overriddenArgs}
    paymentInfoCollectionMetadata={paymentMetadata}
  />
{/if}
