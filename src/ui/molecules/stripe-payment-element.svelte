<script lang="ts">
  import {
    type StripeElements,
    type StripePaymentElement,
    type StripePaymentElementChangeEvent,
  } from "@stripe/stripe-js";
  import {
    StripeService,
    type StripeServiceError,
  } from "../../stripe/stripe-service";

  import { onDestroy, onMount } from "svelte";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";

  export let onChange: (
    event: StripePaymentElementChangeEvent,
  ) => void | Promise<void>;
  export let onError: (error: StripeServiceError) => void | Promise<void>;
  export let onReady: () => void | Promise<void>;
  export let brandingInfo: BrandingInfoResponse | null = null;
  export let elements: StripeElements;

  let paymentElement: StripePaymentElement | null = null;
  const paymentElementId = "payment-element";

  const onLoadErrorCallback = async (error: any) => {
    await onError(StripeService.mapError(error));
  };

  const mountStripePaymentElements = async () => {
    try {
      paymentElement = StripeService.createPaymentElement(
        elements,
        brandingInfo?.app_name,
      );
      paymentElement.mount(`#${paymentElementId}`);
      paymentElement.on("ready", onReady);
      paymentElement.on("change", onChange);
      paymentElement.on("loaderror", onLoadErrorCallback);
    } catch (e) {
      onLoadErrorCallback(e);
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
