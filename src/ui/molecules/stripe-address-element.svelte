<script lang="ts">
  import type {
    StripeError,
    StripeElements,
    StripeAddressElement,
    StripeAddressElementChangeEvent,
  } from "@stripe/stripe-js";
  import {
    StripeService,
    StripeServiceError,
  } from "../../stripe/stripe-service";

  import { onDestroy, onMount } from "svelte";

  interface Props {
    onChange: (complete: boolean) => void | Promise<void>;
    onError: (error: StripeServiceError) => void | Promise<void>;
    onReady: () => void | Promise<void>;
    elements: StripeElements;
  }

  const { onChange, onError, onReady, elements }: Props = $props();

  let addressElement: StripeAddressElement | null = null;
  const addressElementId = "address-element";

  const onLoadErrorCallback = async (event: {
    elementType: "address";
    error: StripeError;
  }) => {
    await onError(StripeService.mapInitializationError(event.error));
  };

  const onAddressChange = async (event: StripeAddressElementChangeEvent) => {
    await onChange(event.complete);
  };

  onMount(() => {
    try {
      addressElement = StripeService.createAddressElement(elements);
      addressElement.mount(`#${addressElementId}`);
      addressElement.on("ready", onReady);
      addressElement.on("change", onAddressChange);
      addressElement.on("loaderror", onLoadErrorCallback);
    } catch (e) {
      onError(StripeService.mapInitializationError(e as StripeError));
    }
  });

  onDestroy(() => {
    addressElement?.destroy();
    addressElement = null;
  });
</script>

<div id={addressElementId}></div>
