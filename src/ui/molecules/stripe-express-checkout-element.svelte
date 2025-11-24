<script lang="ts">
  import type {
    StripeElements,
    StripeError,
    StripeExpressCheckoutElement,
    StripeExpressCheckoutElementConfirmEvent,
    StripeExpressCheckoutElementReadyEvent,
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

  import type { StripeExpressCheckoutConfiguration } from "../../stripe/stripe-express-checkout-configuration";
  import type {
    ClickResolveDetails,
    StripeExpressCheckoutElementClickEvent,
    StripeExpressCheckoutElementShippingAddressChangeEvent,
  } from "@stripe/stripe-js/dist/stripe-js/elements/express-checkout";

  export interface Props {
    onError: (error: StripeServiceError) => void | Promise<void>;
    onReady:
      | (() => void | Promise<void>)
      | ((
          event: StripeExpressCheckoutElementReadyEvent,
        ) => void | Promise<void>);
    onSubmit: (
      paymentMethod: string,
      emailValue: string,
      event: StripeExpressCheckoutElementConfirmEvent,
    ) => void | Promise<void>;
    onClick?: (event: StripeExpressCheckoutElementClickEvent) => void;
    onShippingAddressChange?: (
      event: StripeExpressCheckoutElementShippingAddressChangeEvent,
    ) => void;
    elements: StripeElements;
    billingAddressRequired: boolean;
    forceEnableWalletMethods: boolean;
    expressCheckoutOptions?: StripeExpressCheckoutConfiguration;
    hideOtherOptions?: boolean;
  }

  const {
    onError,
    onReady,
    onSubmit,
    onClick,
    onShippingAddressChange,
    elements,
    billingAddressRequired,
    forceEnableWalletMethods,
    expressCheckoutOptions,
    hideOtherOptions = false,
  }: Props = $props();

  const translator = getContext<Writable<Translator>>(translatorContextKey);

  let expressCheckoutElement: StripeExpressCheckoutElement | null = null;
  let hideExpressCheckoutElement = $state(false);
  // Allows having more than one in the page.
  const expressCheckoutElementId = `express-checkout-element-${new Date().getTime()}`;

  const onClickCallback = async (
    event: StripeExpressCheckoutElementClickEvent,
  ) => {
    const options = {
      ...(expressCheckoutOptions ? expressCheckoutOptions : {}),
    } as ClickResolveDetails;
    event.resolve(options);
    onClick && onClick(event);
  };

  const onShippingAddressChangeCallback = async (
    event: StripeExpressCheckoutElementShippingAddressChangeEvent,
  ) => {
    onShippingAddressChange && onShippingAddressChange(event);
  };

  const onLoadErrorCallback = async (event: {
    elementType: "expressCheckout";
    error: StripeError;
  }) => {
    await onError(StripeService.mapInitializationError(event.error));
  };

  const onConfirmCallback = async (
    event: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    return onSubmit(
      event.expressPaymentType,
      event.billingDetails?.email ?? "",
      event,
    );
  };

  const onReadyCallback = async (
    event: StripeExpressCheckoutElementReadyEvent,
  ) => {
    hideExpressCheckoutElement = !event.availablePaymentMethods;
    onReady(event);
  };

  onMount(() => {
    try {
      expressCheckoutElement = StripeService.createExpressCheckoutElement(
        elements,
        billingAddressRequired,
        forceEnableWalletMethods,
        expressCheckoutOptions,
      );
      expressCheckoutElement.mount(`#${expressCheckoutElementId}`);
      expressCheckoutElement.on("ready", onReadyCallback);
      expressCheckoutElement.on(
        "shippingaddresschange",
        onShippingAddressChangeCallback,
      );
      expressCheckoutElement.on("confirm", onConfirmCallback);
      expressCheckoutElement.on("loaderror", onLoadErrorCallback);
      expressCheckoutElement.on("click", onClickCallback);
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
  {#if !hideOtherOptions}
    <TextSeparator
      text={$translator.translate(
        LocalizationKeys.PaymentEntryPageExpressCheckoutDivider,
      )}
    />
  {/if}
{/if}
