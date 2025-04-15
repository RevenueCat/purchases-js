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

  export interface Props {
    onChange: (event: StripePaymentElementChangeEvent) => Promise<void>;
    onError: (error: StripeServiceError) => void | Promise<void>;
    onReady: () => void | Promise<void>;
    brandingInfo: BrandingInfoResponse | null;
    elements: StripeElements;
  }

  const { onChange, onError, onReady, brandingInfo, elements }: Props =
    $props();

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
