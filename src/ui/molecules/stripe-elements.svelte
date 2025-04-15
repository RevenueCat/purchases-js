<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type {
    Appearance,
    Stripe,
    StripeElements,
    StripeError,
    StripeLinkAuthenticationElementChangeEvent,
    StripePaymentElementChangeEvent,
  } from "@stripe/stripe-js";

  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Theme } from "../theme/theme";
  import PaymentElement from "./stripe-payment-element.svelte";
  import LinkAuthenticationElement from "./stripe-authentication-link-element.svelte";

  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import { type GatewayParams } from "../../networking/responses/stripe-elements";
  import { DEFAULT_FONT_FAMILY } from "../theme/text";
  import { StripeService } from "../../stripe/stripe-service";
  import { type Writable } from "svelte/store";
  import {
    type PaymentElementError,
    PaymentElementErrorCode,
  } from "../types/payment-element-error";
  import { type TaxCustomerDetails } from "../ui-types";

  interface Props {
    gatewayParams: GatewayParams;
    brandingInfo: BrandingInfoResponse | null;
    taxCollectionEnabled: boolean;
    skipEmail: boolean;
    onLoadingComplete: () => void;
    onError: (error: PaymentElementError) => void;
    onEmailChange: (complete: boolean, email: string) => void;
    onPaymentInfoChange: (params: {
      complete: boolean;
      paymentMethod: string | undefined;
      updatedTaxDetails: TaxCustomerDetails | undefined;
    }) => void;
    onSubmissionSuccess: () => void;
    onConfirmationSuccess: () => void;
    submit: () => void;
    confirm: (clientSecret: string) => void;
  }

  let {
    // @ts-ignore
    submit = $bindable(),
    // @ts-ignore
    confirm = $bindable(),
    gatewayParams,
    brandingInfo,
    taxCollectionEnabled,
    skipEmail,
    onLoadingComplete,
    onError,
    onEmailChange,
    onPaymentInfoChange,
    onSubmissionSuccess,
    onConfirmationSuccess,
  }: Props = $props();

  const translator = getContext<Writable<Translator>>(translatorContextKey);
  const spacing = new Theme().spacing;
  const stripeLocale = StripeService.getStripeLocale(
    $translator.locale || $translator.fallbackLocale,
  );

  let paymentElementReadyForSubmission = $state(false);
  let emailElementReadyForSubmission = $state(skipEmail);
  let stripe: Stripe | null = $state(null);
  let lastTaxCustomerDetails: TaxCustomerDetails | undefined =
    $state(undefined);

  let stripeVariables: undefined | Appearance["variables"] = $state(undefined);
  let viewport: "mobile" | "desktop" = $state("mobile");
  let resizeTimeout: number | undefined = $state(undefined);
  let elements: StripeElements | null = $state(null);

  async function submitElements() {
    if (!elements || !paymentElementReadyForSubmission) return;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      handleFormSubmissionError(submitError);
    } else {
      onSubmissionSuccess();
    }
  }

  async function confirmElements(clientSecret: string) {
    if (!stripe || !elements || !paymentElementReadyForSubmission) return;

    const confirmError = await StripeService.confirmIntent(
      stripe,
      elements,
      clientSecret,
    );

    if (confirmError) {
      handleFormSubmissionError(confirmError);
    } else {
      onConfirmationSuccess();
    }
  }

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
      fontSizeBase: "14px",
      fontFamily: DEFAULT_FONT_FAMILY,
      spacingGridRow: spacing.gapXLarge[viewport],
    };
  }

  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateStripeVariables();
    }, 150);
  }

  function handleFormSubmissionError(error: StripeError) {
    if (StripeService.isStripeHandledCardError(error)) {
      onError({
        code: PaymentElementErrorCode.HandledFormSubmissionError,
        gatewayErrorCode: error.code,
        message: error.message,
      });
      return;
    }

    onError({
      code: PaymentElementErrorCode.UnhandledFormSubmissionError,
      gatewayErrorCode: error.code,
      message: error.message,
    });
  }

  const onStripeElementsLoadingError = (error: any) => {
    const actualError = error.error ? error.error : error;
    onError({
      code: PaymentElementErrorCode.ErrorLoadingStripe,
      gatewayErrorCode: actualError.code ? actualError.code : undefined,
      message: actualError.message,
    });
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

  async function extractTaxCustomerDetails(
    event: StripePaymentElementChangeEvent,
  ): Promise<TaxCustomerDetails | undefined> {
    if (!taxCollectionEnabled || !event.complete || event.value.type !== "card")
      return undefined;

    if (!elements || !stripe || !paymentElementReadyForSubmission)
      return undefined;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      throw submitError;
    }

    const { error: confirmationError, confirmationToken } =
      await stripe.createConfirmationToken({
        elements: elements,
      });

    if (confirmationError) {
      throw confirmationError;
    }

    const billingAddress =
      confirmationToken.payment_method_preview?.billing_details?.address;

    return {
      countryCode: billingAddress?.country ?? undefined,
      postalCode: billingAddress?.postal_code ?? undefined,
    };
  }

  const onPaymentElementChange = async (
    event: StripePaymentElementChangeEvent,
  ) => {
    try {
      const taxCustomerDetails = await extractTaxCustomerDetails(event);

      const sameDetails =
        taxCustomerDetails?.postalCode === lastTaxCustomerDetails?.postalCode &&
        taxCustomerDetails?.countryCode === lastTaxCustomerDetails?.countryCode;

      lastTaxCustomerDetails = taxCustomerDetails;

      const updatedTaxDetails = sameDetails
        ? undefined
        : lastTaxCustomerDetails;

      onPaymentInfoChange({
        complete: event.complete,
        paymentMethod: event.complete ? event.value.type : undefined,
        updatedTaxDetails: updatedTaxDetails,
      });
    } catch (error) {
      handleFormSubmissionError(error as StripeError);
    }
  };

  const onLinkAuthenticationElementChange = async (
    event: StripeLinkAuthenticationElementChangeEvent,
  ) => {
    onEmailChange(event.complete, event.value.email);
  };

  onMount(() => {
    submit = submitElements;
    confirm = confirmElements;
  });

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

    try {
      const { stripe: stripeInstance, elements: elementsInstance } =
        await StripeService.initializeStripe(
          gatewayParams,
          brandingInfo,
          stripeLocale,
          stripeVariables,
          viewport,
        );
      stripe = stripeInstance;
      elements = elementsInstance;
    } catch (error) {
      onStripeElementsLoadingError(error);
    }
  });

  $effect(() => {
    if (gatewayParams.elements_configuration && elements) {
      const elementsConfiguration = gatewayParams.elements_configuration;
      (async () => {
        await StripeService.updateElementsConfiguration(
          elements,
          elementsConfiguration,
        );
      })();
    }
  });
</script>

{#if elements}
  {#if !skipEmail}
    <div class="rc-email-element">
      <LinkAuthenticationElement
        {elements}
        onReady={onLinkAuthenticationElementReady}
        onChange={onLinkAuthenticationElementChange}
        onError={onStripeElementsLoadingError}
      />
    </div>
  {/if}
  <div class="rc-payment-element">
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
  .rc-payment-element {
    margin-top: var(--rc-spacing-gapStripeElement-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rc-payment-element {
      margin-top: var(--rc-spacing-gapStripeElement-desktop);
    }
  }
</style>
