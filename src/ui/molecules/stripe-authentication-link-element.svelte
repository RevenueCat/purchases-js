<script lang="ts">
  import type {
    StripeError,
    StripeElements,
    StripeLinkAuthenticationElement,
    StripeLinkAuthenticationElementChangeEvent,
  } from "@stripe/stripe-js";
  import { StripeServiceError } from "../../stripe/stripe-service";
  import { StripeService } from "../../stripe/stripe-service";

  import { onDestroy, onMount } from "svelte";

  interface Props {
    onChange: (
      event: StripeLinkAuthenticationElementChangeEvent,
    ) => void | Promise<void>;
    onError: (error: StripeServiceError) => void | Promise<void>;
    onReady: () => void | Promise<void>;
    email?: string;
    elements: StripeElements;
  }

  const { onChange, onError, onReady, email, elements }: Props = $props();

  let linkAuthenticationElement: StripeLinkAuthenticationElement | null = null;
  const linkAuthenticationElementId = "link-authentication-element";

  const onLoadErrorCallback = async (event: {
    elementType: "linkAuthentication";
    error: StripeError;
  }) => {
    await onError(StripeService.mapInitializationError(event.error));
  };

  onMount(() => {
    try {
      linkAuthenticationElement = StripeService.createLinkAuthenticationElement(
        elements,
        email,
      );
      linkAuthenticationElement.mount(`#${linkAuthenticationElementId}`);
      linkAuthenticationElement.on("ready", onReady);
      linkAuthenticationElement.on("change", onChange);
      linkAuthenticationElement.on("loaderror", onLoadErrorCallback);
    } catch (e) {
      onError(StripeService.mapInitializationError(e as StripeError));
    }
  });

  onDestroy(() => {
    linkAuthenticationElement?.destroy();
    linkAuthenticationElement = null;
  });
</script>

<div id={linkAuthenticationElementId}></div>
