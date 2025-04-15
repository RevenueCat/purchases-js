<script lang="ts">
  import {
    type StripeElements,
    type StripeLinkAuthenticationElement,
    type StripeLinkAuthenticationElementChangeEvent,
  } from "@stripe/stripe-js";
  import type { StripeServiceError } from "../../stripe/stripe-service";
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

  const onLoadErrorCallback = async (error: any) => {
    await onError(StripeService.mapError(error));
  };

  onMount(async () => {
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
      onLoadErrorCallback(e);
    }
  });

  onDestroy(() => {
    linkAuthenticationElement?.destroy();
    linkAuthenticationElement = null;
  });
</script>

<div id={linkAuthenticationElementId}></div>
