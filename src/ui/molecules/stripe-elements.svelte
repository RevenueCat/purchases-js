<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type {
    Appearance,
    Stripe,
    StripeElements,
    StripeLinkAuthenticationElementChangeEvent,
    StripePaymentElementChangeEvent,
  } from "@stripe/stripe-js";

  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Theme } from "../theme/theme";
  import PaymentElement from "./stripe-payment-element.svelte";
  import LinkAuthenticationElement from "./stripe-authentication-link-element.svelte";

  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import type { StripeElementsConfiguration } from "../../networking/responses/stripe-elements";
  import { DEFAULT_FONT_FAMILY, DEFAULT_TEXT_STYLES } from "../theme/text";
  import {
    StripeService,
    StripeServiceError,
  } from "../../stripe/stripe-service";
  import { type Writable } from "svelte/store";

  interface Props {
    stripe: Stripe | null;
    elements: StripeElements | null;
    stripeAccountId?: string;
    publishableApiKey?: string;
    elementsConfiguration?: StripeElementsConfiguration;
    brandingInfo: BrandingInfoResponse | null;
    skipEmail: boolean;
    onLoadingComplete: () => void;
    onError: (error: StripeServiceError) => void;
    onEmailChange: (complete: boolean, email: string) => void;
    onPaymentInfoChange: (params: {
      complete: boolean;
      paymentMethod: string | undefined;
    }) => void;
  }

  let {
    stripe = $bindable(null),
    elements = $bindable(null),
    stripeAccountId,
    publishableApiKey,
    elementsConfiguration,
    brandingInfo,
    skipEmail,
    onLoadingComplete,
    onError,
    onEmailChange,
    onPaymentInfoChange,
  }: Props = $props();

  const translator = getContext<Writable<Translator>>(translatorContextKey);
  const spacing = new Theme().spacing;
  const stripeLocale = StripeService.getStripeLocale(
    $translator.locale || $translator.fallbackLocale,
  );

  let paymentElementReadyForSubmission = $state(false);
  let emailElementReadyForSubmission = $state(skipEmail);

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
      fontSizeBase: DEFAULT_TEXT_STYLES.bodyBase[viewport].fontSize,
      fontFamily: DEFAULT_FONT_FAMILY,
      spacingGridRow: spacing.gapLarge[viewport],
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

  const onLinkAuthenticationElementReady = async () => {
    if (!emailElementReadyForSubmission) {
      emailElementReadyForSubmission = true;
      if (emailElementReadyForSubmission && paymentElementReadyForSubmission) {
        onLoadingComplete();
      }
    }
  };

  const onPaymentElementReady = async () => {
    if (!paymentElementReadyForSubmission) {
      paymentElementReadyForSubmission = true;
      if (emailElementReadyForSubmission && paymentElementReadyForSubmission) {
        onLoadingComplete();
      }
    }
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
  </div>
{/if}

<style>
  .rc-elements {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapStripeElement-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rc-elements {
      gap: var(--rc-spacing-gapStripeElement-desktop);
    }
  }
</style>
