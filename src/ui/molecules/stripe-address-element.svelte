<script lang="ts">
  import {
    type StripeAddressElement,
    type StripeElements,
  } from "@stripe/stripe-js";
  import { StripeService } from "../../stripe/stripe-service";
  import type { StripeAddressElementChangeEvent } from "@stripe/stripe-js/dist/stripe-js/elements/address";
  import { onDestroy, onMount } from "svelte";
  import type { PriceBreakdown } from "../ui-types";

  export let elements: StripeElements;
  export let priceBreakdown: PriceBreakdown;
  export let onNewAddress: (
    event: StripeAddressElementChangeEvent,
  ) => void | Promise<void>;
  export let onError: undefined | ((error: any) => void | Promise<void>) =
    undefined;
  export let onReady: undefined | (() => void | Promise<void>) = undefined;
  export let initialPostalCode: string | undefined = undefined;
  export let initialCountry: string | undefined = undefined;
  let addressElement: StripeAddressElement | null = null;
  const addressElementId = "address-element";

  const onChangeCallback = async (event: StripeAddressElementChangeEvent) => {
    await onNewAddress(event);
  };

  const onLoadErrorCallback = async (error: any) => {
    onError && (await onError(error));
  };

  const onReadyCallback = async () => {
    onReady && (await onReady());
  };

  const mountStripeAddressElements = () => {
    if (!elements) {
      return;
    }

    if (priceBreakdown.taxCalculationBasedOnFullAddress) {
      if (addressElement !== null) {
        return;
      }

      const initialValues = initialCountry
        ? {
            postalCode: initialPostalCode,
            country: initialCountry,
          }
        : undefined;

      addressElement = StripeService.createAddressElement(
        elements,
        initialValues,
      );
      addressElement.mount(`#${addressElementId}`);
      addressElement.on("ready", onReadyCallback);
      addressElement.on("change", onChangeCallback);
      addressElement.on("loaderror", onLoadErrorCallback);
    } else {
      addressElement?.destroy();
      addressElement = null;
    }
  };

  onMount(async () => {
    mountStripeAddressElements();
  });

  onDestroy(() => {
    addressElement?.destroy();
    addressElement = null;
  });
</script>

<div id={addressElementId}></div>
