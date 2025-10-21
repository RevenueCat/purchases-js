<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { generateUUID } from "../../helpers/uuid-helper";
  import type { PayPalGatewayParams } from "../../networking/responses/paypal";
  import {
    PayPalService,
    type PayPalSDKInstance,
  } from "../../paypal/paypal-service";
  import type {
    OneTimePaymentSession,
    OnApproveDataOneTimePayments,
  } from "@paypal/paypal-js/sdk-v6";

  interface Props {
    paypalGatewayParams: PayPalGatewayParams;
    onCreateOrder: () => Promise<{ orderId: string }>;
    onApprove: (data: OnApproveDataOneTimePayments) => Promise<void>;
    onCancel?: () => void;
    onError: (error: unknown) => void;
    onReady?: () => void;
    isSandbox: boolean;
  }

  let {
    paypalGatewayParams,
    onCreateOrder,
    onApprove,
    onError,
    onCancel,
    onReady,
    isSandbox,
  }: Props = $props();

  const buttonId = `rc-paypal-button-${generateUUID()}`;
  let paypalSdkInstance: PayPalSDKInstance | null = $state(null);
  let paypalPaymentSession: OneTimePaymentSession | null = $state(null);
  let eligible = $state(false);
  let paypalButtonElement: HTMLElement | null = $state(null);

  async function initializePayPal() {
    if (!paypalGatewayParams?.client_access_token) return;
    if (paypalSdkInstance) return;

    try {
      paypalSdkInstance = await PayPalService.initializePayPal(
        paypalGatewayParams.client_access_token,
        isSandbox,
      );

      eligible = await PayPalService.allowsPayPalPaymentMethod(
        paypalSdkInstance,
        paypalGatewayParams.currency,
      );

      if (!eligible) {
        onReady?.();
        return;
      }

      paypalPaymentSession =
        paypalSdkInstance.createPayPalOneTimePaymentSession({
          onApprove,
          onError,
          onCancel,
        });

      if (paypalButtonElement && paypalPaymentSession) {
        paypalButtonElement.removeAttribute("hidden");
        paypalButtonElement.addEventListener("click", async () => {
          try {
            await paypalPaymentSession!.start(
              { presentationMode: "auto" } as const,
              onCreateOrder(),
            );
          } catch (error) {
            onError(error);
          }
        });
      }

      onReady?.();
    } catch (error) {
      eligible = false;
      onError(error);
      onReady?.();
    }
  }

  onMount(() => {
    if (paypalGatewayParams?.client_access_token) {
      initializePayPal();
    }
  });

  onDestroy(() => {
    paypalSdkInstance = null;
    paypalPaymentSession = null;
  });
</script>

<paypal-button bind:this={paypalButtonElement} id={buttonId} type="pay" hidden
></paypal-button>
