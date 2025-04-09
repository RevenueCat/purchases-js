<script lang="ts">
  import { getContext, onDestroy, onMount } from "svelte";
  import type {
    Appearance,
    Stripe,
    StripeElementLocale,
    StripeElements,
    StripeError,
    StripePaymentElementChangeEvent,
  } from "@stripe/stripe-js";

  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Theme } from "../theme/theme";
  import PaymentElement from "./stripe-payment-element.svelte";

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

  export let gatewayParams: GatewayParams;
  export let brandingInfo: BrandingInfoResponse | null;
  export let taxCollectionEnabled: boolean;
  export let onLoadingComplete: () => void;
  export let onError: (error: PaymentElementError) => void;

  export let onPaymentInfoChange: (params: {
    complete: boolean;
    paymentMethod: string | undefined;
  }) => void;
  export let onTaxCustomerDetailsUpdated: (
    customerDetails: TaxCustomerDetails,
  ) => void;

  export let onSubmissionSuccess: () => void;
  export let onConfirmationSuccess: () => void;

  export async function submit() {
    if (!elements) return;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      handleFormSubmissionError(submitError);
    } else {
      onSubmissionSuccess();
    }
  }

  export async function confirm(clientSecret: string) {
    if (!stripe || !elements) return;

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

  export let stripeLocale: StripeElementLocale | undefined = undefined;

  let stripe: Stripe | null = null;
  let elements: StripeElements | null = null;
  let lastTaxCustomerDetails: TaxCustomerDetails | undefined = undefined;
  let spacing = new Theme().spacing;
  let stripeVariables: undefined | Appearance["variables"];
  let viewport: "mobile" | "desktop" = "mobile";

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

  let resizeTimeout: number | undefined;

  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateStripeVariables();
    }, 150);
  }

  const translator = getContext<Writable<Translator>>(translatorContextKey);

  $: initialLocale = ($translator.locale ||
    $translator.fallbackLocale) as string;

  $: stripeLocale = getLocaleToUse(initialLocale);

  /**
   * This function converts some particular locales to the ones that stripe supports.
   * Finally falls back to 'auto' if the initialLocale is not supported by stripe.
   * @param initialLocale
   */
  const getLocaleToUse = (initialLocale: string): StripeElementLocale => {
    // These locale that we support are not supported by stripe.
    // if any of these is passed we fallback to 'auto' so that
    // stripe will pick up the locale from the browser.
    const stripeUnsupportedLocale = ["ca", "hi", "uk"];

    if (stripeUnsupportedLocale.includes(initialLocale)) {
      return "auto";
    }

    const mappedLocale: Record<string, StripeElementLocale> = {
      zh_Hans: "zh",
      zh_Hant: "zh",
    };

    if (Object.keys(mappedLocale).includes(initialLocale)) {
      return mappedLocale[initialLocale];
    }

    return initialLocale as StripeElementLocale;
  };

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

  async function triggerTaxDetailsUpdated() {
    if (!elements || !stripe) return;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      handleFormSubmissionError(submitError);
      return;
    }

    const { error: confirmationError, confirmationToken } =
      await stripe.createConfirmationToken({
        elements: elements,
      });

    if (confirmationError) {
      handleFormSubmissionError(confirmationError);
      return;
    }

    const billingAddress =
      confirmationToken.payment_method_preview?.billing_details?.address;

    if (
      !billingAddress ||
      JSON.stringify(billingAddress) === JSON.stringify(lastTaxCustomerDetails)
    ) {
      return;
    }

    lastTaxCustomerDetails = {
      countryCode: billingAddress.country,
      postalCode: billingAddress.postal_code,
    } as TaxCustomerDetails;

    onTaxCustomerDetailsUpdated(lastTaxCustomerDetails);
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

  const initStripe = async () => {
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

      const elementsConfiguration = gatewayParams.elements_configuration;
      if (elementsConfiguration) {
        await StripeService.updateElementsConfiguration(
          elements,
          elementsConfiguration,
        );
      }
    } catch (error) {
      onStripeElementsLoadingError(error);
    }
  };

  onMount(async () => {
    updateStripeVariables();
    window.addEventListener("resize", onResize);
    await initStripe();
  });

  onDestroy(() => {
    window.removeEventListener("resize", onResize);
  });

  const onPaymentElementChange = async (
    event: StripePaymentElementChangeEvent,
  ) => {
    if (taxCollectionEnabled && event.complete && event.value.type === "card") {
      await triggerTaxDetailsUpdated();
    }
    onPaymentInfoChange({
      complete: event.complete,
      paymentMethod: event.complete ? event.value.type : undefined,
    });
  };
</script>

<div
  style="display: flex; flex-direction: column; align-items: stretch; gap: {spacing
    .gapXLarge[viewport]};"
>
  {#if elements}
    <PaymentElement
      {elements}
      {brandingInfo}
      onReady={() => {
        onLoadingComplete();
      }}
      onChange={onPaymentElementChange}
      onError={onStripeElementsLoadingError}
    />
  {/if}
</div>
