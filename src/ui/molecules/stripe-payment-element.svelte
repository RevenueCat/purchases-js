<script lang="ts">
  import {
    type StripeElements,
    type StripePaymentElement,
    type StripePaymentElementChangeEvent,
  } from "@stripe/stripe-js";
  import { StripeService } from "../../stripe/stripe-service";

  import { onDestroy, onMount } from "svelte";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";

  export let onChange: (
    event: StripePaymentElementChangeEvent,
  ) => void | Promise<void>;
  export let onError: undefined | ((error: any) => void | Promise<void>) =
    undefined;
  export let onReady: undefined | (() => void | Promise<void>) = undefined;
  export let brandingInfo: BrandingInfoResponse | null = null;
  export let elements: StripeElements;

  let paymentElement: StripePaymentElement | null = null;
  let paymentElementId = "payment-element";

  const onChangeCallback = async (event: StripePaymentElementChangeEvent) => {
    await onChange(event);
  };

  const onLoadErrorCallback = async (error: any) => {
    onError && (await onError(error));
  };

  const onReadyCallback = async () => {
    onReady && (await onReady());
  };

  const mountStripePaymentElements = async () => {
    try {
      paymentElement = StripeService.createPaymentElement(
        elements,
        brandingInfo?.app_name,
      );
      paymentElement.mount(`#${paymentElementId}`);
      paymentElement.on("ready", onReadyCallback);
      paymentElement.on("change", onChangeCallback);
      paymentElement.on("loaderror", onLoadErrorCallback);
    } catch (e) {
      onError && (await onError(e));
    }
  };

  onMount(async () => {
    await mountStripePaymentElements();
  });

  onDestroy(() => {
    paymentElement?.destroy();
    paymentElement = null;
  });
</script>

<div id={paymentElementId}></div>
