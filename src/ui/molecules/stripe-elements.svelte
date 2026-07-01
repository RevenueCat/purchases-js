<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type {
    Appearance,
    Stripe,
    StripeAddressElementChangeEvent,
    StripeElements,
    StripeLinkAuthenticationElementChangeEvent,
    StripePaymentElementChangeEvent,
  } from "@stripe/stripe-js";

  import {
    type BrandingInfoResponse,
    shouldCollectFullAddress,
  } from "../../networking/responses/branding-response";
  import PaymentElement from "./stripe-payment-element.svelte";
  import LinkAuthenticationElement from "./stripe-authentication-link-element.svelte";
  import ExpressCheckoutElement from "./stripe-express-checkout-element.svelte";
  import AddressElement from "./stripe-address-element.svelte";

  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import type { StripeElementsConfiguration } from "../../networking/responses/stripe-elements";
  import { DEFAULT_FONT_FAMILY } from "../theme/text";
  import {
    StripeService,
    StripeServiceError,
  } from "../../stripe/stripe-service";
  import { type Writable } from "svelte/store";
  import type { StripeExpressCheckoutConfiguration } from "../../stripe/stripe-express-checkout-configuration";

  interface Props {
    stripe: Stripe | null;
    elements: StripeElements | null;
    stripeAccountId?: string;
    publishableApiKey?: string;
    elementsConfiguration?: StripeElementsConfiguration;
    expressCheckoutOptions?: StripeExpressCheckoutConfiguration;
    brandingInfo: BrandingInfoResponse | null;
    forceEnableWalletMethods: boolean;
    skipEmail: boolean;
    onLoadingComplete: () => void;
    onError: (error: StripeServiceError) => void;
    onEmailChange: (complete: boolean, email: string) => void;
    onPaymentInfoChange: (params: {
      complete: boolean;
      paymentMethod: string | undefined;
    }) => void;
    onAddressInfoChange: (
      complete: boolean,
      address: StripeAddressElementChangeEvent["value"]["address"],
    ) => void;
    onExpressCheckoutElementSubmit: (
      paymentMethod: string,
      emailValue: string,
    ) => void;
  }

  let {
    stripe = $bindable(null),
    elements = $bindable(null),
    stripeAccountId,
    publishableApiKey,
    elementsConfiguration,
    expressCheckoutOptions,
    brandingInfo,
    forceEnableWalletMethods,
    skipEmail,
    onLoadingComplete,
    onError,
    onEmailChange,
    onPaymentInfoChange,
    onAddressInfoChange,
    onExpressCheckoutElementSubmit,
  }: Props = $props();

  const translator = getContext<Writable<Translator>>(translatorContextKey);
  const stripeLocale = StripeService.getStripeLocale(
    $translator.bcp47Locale || $translator.fallbackBcp47Locale,
  );

  const collectFullBillingAddress = $derived(
    shouldCollectFullAddress(brandingInfo),
  );

  let paymentElementReadyForSubmission = $state(false);
  let emailElementReadyForSubmission = $state(skipEmail);
  let expressCheckoutElementReadyForSubmission = $state(false);
  let addressElementReadyForSubmission = $state(
    !shouldCollectFullAddress(brandingInfo),
  );

  let stripeVariables: undefined | Appearance["variables"] = $state(undefined);
  let viewport: "mobile" | "desktop" = $state("mobile");
  let resizeTimeout: number | undefined = $state(undefined);

  // Maybe extract this to a hook
  function updateStripeVariables() {
    const isMobile =
      window.matchMedia && window.matchMedia("(max-width: 767px)").matches;

    if (isMobile) {
      viewport = "mobile";
    } else {
      viewport = "desktop";
    }

    stripeVariables = {
      // Floating labels size cannot be overriden in Stripe since `!important` is being used.
      // There we set fontSizeBase to the desired label size
      // and update the input font size to 16px.
      fontSizeBase: "14px",
      fontFamily: DEFAULT_FONT_FAMILY,
      // Spacing is hardcoded to 16px to match the desired gaps in mobile/desktop
      // which do not match the design system spacing. Also we cannot use "rem" units
      // since the fontSizeBase is set to 14px per the comment above.
      spacingGridRow: "16px",
    };
  }

  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateStripeVariables();
    }, 150);
  }

  const onStripeElementsLoadingError = (error: StripeServiceError) => {
    onError(error);
    onLoadingComplete();
  };

  const maybeCompleteLoading = () => {
    if (
      emailElementReadyForSubmission &&
      paymentElementReadyForSubmission &&
      expressCheckoutElementReadyForSubmission &&
      addressElementReadyForSubmission
    ) {
      onLoadingComplete();
    }
  };

  const onLinkAuthenticationElementReady = async () => {
    if (!emailElementReadyForSubmission) {
      emailElementReadyForSubmission = true;
      maybeCompleteLoading();
    }
  };

  const onExpressCheckoutElementReady = async () => {
    if (!expressCheckoutElementReadyForSubmission) {
      expressCheckoutElementReadyForSubmission = true;
      maybeCompleteLoading();
    }
  };

  const onPaymentElementReady = async () => {
    if (!paymentElementReadyForSubmission) {
      paymentElementReadyForSubmission = true;
      maybeCompleteLoading();
    }
  };

  const onAddressElementReady = async () => {
    if (!addressElementReadyForSubmission) {
      addressElementReadyForSubmission = true;
      maybeCompleteLoading();
    }
  };

  const onAddressElementChange = async (
    complete: boolean,
    address: StripeAddressElementChangeEvent["value"]["address"],
  ) => {
    onAddressInfoChange(complete, address);
  };

  const onPaymentElementChange = async (
    event: StripePaymentElementChangeEvent,
  ) => {
    onPaymentInfoChange({
      complete: event.complete,
      paymentMethod: event.complete ? event.value.type : undefined,
    });
  };

  const onLinkAuthenticationElementChange = async (
    event: StripeLinkAuthenticationElementChangeEvent,
  ) => {
    onEmailChange(event.complete, event.value.email);
  };

  onMount(() => {
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  });

  onMount(async () => {
    updateStripeVariables();

    if (stripe) return;
    if (elements) return;

    if (!stripeAccountId || !publishableApiKey || !elementsConfiguration) {
      return;
    }

    await StripeService.initializeStripe(
      stripeAccountId,
      publishableApiKey,
      elementsConfiguration,
      brandingInfo,
      stripeLocale,
      stripeVariables,
      viewport,
    )
      .then(({ stripe: stripeInstance, elements: elementsInstance }) => {
        stripe = stripeInstance;
        elements = elementsInstance;
      })
      .catch((error) => {
        onError(error);
      });
  });

  $effect(() => {
    if (elementsConfiguration && elements) {
      StripeService.updateElementsConfiguration(
        elements,
        elementsConfiguration,
      );
    }
  });
</script>

{#if elements}
  <div class="rc-elements">
    <ExpressCheckoutElement
      {elements}
      onError={onStripeElementsLoadingError}
      onReady={onExpressCheckoutElementReady}
      onSubmit={onExpressCheckoutElementSubmit}
      {expressCheckoutOptions}
      {forceEnableWalletMethods}
    />
    {#if !skipEmail}
      <LinkAuthenticationElement
        {elements}
        onReady={onLinkAuthenticationElementReady}
        onChange={onLinkAuthenticationElementChange}
        onError={onStripeElementsLoadingError}
      />
    {/if}
    <PaymentElement
      {elements}
      {brandingInfo}
      onReady={onPaymentElementReady}
      onChange={onPaymentElementChange}
      onError={onStripeElementsLoadingError}
    />
    {#if collectFullBillingAddress}
      <AddressElement
        {elements}
        onReady={onAddressElementReady}
        onChange={onAddressElementChange}
        onError={onStripeElementsLoadingError}
      />
    {/if}
  </div>
{/if}

<style>
  .rc-elements {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXLarge-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rc-elements {
      gap: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
