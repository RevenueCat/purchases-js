<script lang="ts">
  import type {
    StripeError,
    StripeElements,
    StripeExpressCheckoutElement,
    StripeExpressCheckoutElementConfirmEvent,
    StripeExpressCheckoutElementReadyEvent,
    StripeExpressCheckoutElementClickEvent,
  } from "@stripe/stripe-js";
  import {
    StripeService,
    StripeServiceError,
  } from "../../stripe/stripe-service";

  import { getContext, onDestroy, onMount } from "svelte";
  import TextSeparator from "../atoms/text-separator.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { Translator } from "../localization/translator";
  import { type Writable } from "svelte/store";
  import { translatorContextKey } from "../localization/constants";

  export interface Props {
    onError: (error: StripeServiceError) => void | Promise<void>;
    onReady: () => void | Promise<void>;
    onSubmit: (
      paymentMethod: string,
      emailValue: string,
    ) => void | Promise<void>;
    elements: StripeElements;
    billingAddressRequired: boolean;
  }

  const {
    onError,
    onReady,
    onSubmit,
    elements,
    billingAddressRequired,
  }: Props = $props();

  const translator = getContext<Writable<Translator>>(translatorContextKey);

  let expressCheckoutElement: StripeExpressCheckoutElement | null = null;
  let hideExpressCheckoutElement = $state(false);
  const expressCheckoutElementId = "express-checkout-element";

  const onLoadErrorCallback = async (event: {
    elementType: "expressCheckout";
    error: StripeError;
  }) => {
    await onError(StripeService.mapInitializationError(event.error));
  };

  const onConfirmCallback = async (
    event: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    onSubmit(event.expressPaymentType, event.billingDetails?.email ?? "");
  };

  const onReadyCallback = async (
    event: StripeExpressCheckoutElementReadyEvent,
  ) => {
    hideExpressCheckoutElement = !event.availablePaymentMethods;
    onReady();
  };

  onMount(() => {
    try {
      expressCheckoutElement =
        StripeService.createExpressCheckoutElement(elements);
      expressCheckoutElement.mount(`#${expressCheckoutElementId}`);
      expressCheckoutElement.on("ready", onReadyCallback);
      expressCheckoutElement.on("confirm", onConfirmCallback);
      expressCheckoutElement.on("loaderror", onLoadErrorCallback);

      expressCheckoutElement.on(
        "click",
        (event: StripeExpressCheckoutElementClickEvent) => {
          event.resolve({
            billingAddressRequired,
            emailRequired: true,
          });
        },
      );
    } catch (e) {
      onError(StripeService.mapInitializationError(e as StripeError));
    }
  });

  onDestroy(() => {
    expressCheckoutElement?.destroy();
    expressCheckoutElement = null;
  });
</script>

{#if !hideExpressCheckoutElement}
  <div id={expressCheckoutElementId}></div>
  <TextSeparator
    text={$translator.translate(
      LocalizationKeys.PaymentEntryPageExpressCheckoutDivider,
    )}
  />
{/if}
