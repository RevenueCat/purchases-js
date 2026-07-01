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
    onChange: (
      complete: boolean,
      address: StripeAddressElementChangeEvent["value"]["address"],
    ) => void | Promise<void>;
    onError: (error: StripeServiceError) => void | Promise<void>;
    onReady: () => void | Promise<void>;
    elements: StripeElements;
    defaultCountryCode?: string;
  }

  const { onChange, onError, onReady, elements, defaultCountryCode }: Props =
    $props();

  let addressElement: StripeAddressElement | null = null;
  const addressElementId = "address-element";

  let lastComplete: boolean | null = null;
  let lastTaxRelevantAddress:
    | StripeAddressElementChangeEvent["value"]["address"]
    | null = null;

  const onLoadErrorCallback = async (event: {
    elementType: "address";
    error: StripeError;
  }) => {
    await onError(StripeService.mapInitializationError(event.error));
  };

  const onAddressChange = async (event: StripeAddressElementChangeEvent) => {
    const { complete } = event;
    const address = event.value.address;

    // Stripe emits a `change` event for any edit to the address element,
    // including the name, which does not affect tax calculation. Only notify
    // the parent when the completeness changes (so it can recalculate taxes
    // once the address becomes valid) or when a tax-relevant field (country,
    // postal code, state, city, line1, line2) actually changes.
    const completeChanged = complete !== lastComplete;
    const taxRelevantChanged = !isSameTaxRelevantAddress(
      lastTaxRelevantAddress,
      address,
    );
    if (!completeChanged && !taxRelevantChanged) {
      return;
    }

    lastComplete = complete;
    lastTaxRelevantAddress = address;
    await onChange(complete, address);
  };

  const isSameTaxRelevantAddress = (
    a: StripeAddressElementChangeEvent["value"]["address"] | null,
    b: StripeAddressElementChangeEvent["value"]["address"],
  ): boolean => {
    return (
      a?.country === b.country &&
      a?.postal_code === b.postal_code &&
      a?.state === b.state &&
      a?.city === b.city &&
      a?.line1 === b.line1 &&
      a?.line2 === b.line2
    );
  };

  onMount(() => {
    try {
      addressElement = StripeService.createAddressElement(
        elements,
        defaultCountryCode,
      );
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
