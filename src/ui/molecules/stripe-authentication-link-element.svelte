<script lang="ts">
  import {
    type StripeElements,
    type StripeLinkAuthenticationElement,
    type StripeLinkAuthenticationElementChangeEvent,
  } from "@stripe/stripe-js";
  import { StripeService } from "../../stripe/stripe-service";

  import { onDestroy, onMount } from "svelte";

  export let onChange: (
    event: StripeLinkAuthenticationElementChangeEvent,
  ) => void | Promise<void>;
  export let onError: undefined | ((error: any) => void | Promise<void>) =
    undefined;
  export let onReady: undefined | (() => void | Promise<void>) = undefined;
  export let email: string | undefined;
  export let elements: StripeElements;

  let linkAuthenticationElement: StripeLinkAuthenticationElement | null = null;
  const linkAuthenticationElementId = "link-authentication-element";

  const onChangeCallback = async (
    event: StripeLinkAuthenticationElementChangeEvent,
  ) => {
    await onChange(event);
  };

  const onLoadErrorCallback = async (error: any) => {
    onError && (await onError(error));
  };

  const onReadyCallback = async () => {
    onReady && (await onReady());
  };

  onMount(async () => {
    try {
      linkAuthenticationElement = StripeService.createLinkAuthenticationElement(
        elements,
        email,
      );
      linkAuthenticationElement.mount(`#${linkAuthenticationElementId}`);
      linkAuthenticationElement.on("ready", onReadyCallback);
      linkAuthenticationElement.on("change", onChangeCallback);
      linkAuthenticationElement.on("loaderror", onLoadErrorCallback);
    } catch (e) {
      onError && (await onError(e));
    }
  });

  onDestroy(() => {
    linkAuthenticationElement?.destroy();
    linkAuthenticationElement = null;
  });
</script>

<div id={linkAuthenticationElementId}></div>
