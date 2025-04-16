<script lang="ts">
  import {
    type StripeElements,
    type StripeLinkAuthenticationElement,
    type StripeLinkAuthenticationElementChangeEvent,
  } from "@stripe/stripe-js";
  import { StripeService } from "../../stripe/stripe-service";

  import { onDestroy, onMount } from "svelte";

  interface Props {
    onChange: (
      event: StripeLinkAuthenticationElementChangeEvent,
    ) => void | Promise<void>;
    onError: undefined | ((error: any) => void | Promise<void>);
    onReady: undefined | (() => void | Promise<void>);
    email?: string;
    elements: StripeElements;
  }

  const { onChange, onError, onReady, email, elements }: Props = $props();

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
