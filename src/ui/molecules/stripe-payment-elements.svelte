<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type {
    Appearance,
    ConfirmationToken,
    Stripe,
    StripeElementLocale,
    StripeElements,
    StripeError,
    StripePaymentElement,
    StripePaymentElementChangeEvent,
  } from "@stripe/stripe-js";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Theme } from "../theme/theme";

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

  export let gatewayParams: GatewayParams;
  export let brandingInfo: BrandingInfoResponse | null;
  export let collectBillingAddress: boolean = false;
  export let onLoadingComplete: () => void;
  export let onError: (error: PaymentElementError) => void;
  export let onPaymentInfoChange: (params: {
    complete: boolean;
    paymentMethod: string | undefined;
  }) => void;
  export let onSubmissionSuccess: () => void;
  export let onConfirmationSuccess: () => void;
  export let onBillingAddressUpdated: (params: {
    countryCode: string | undefined;
    postalCode: string | undefined;
  }) => void;
  export let stripeLocale: StripeElementLocale | undefined = undefined;

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

    const isSetupIntent = clientSecret.startsWith("seti_");
    const baseOptions = {
      clientSecret,
      redirect: "if_required" as const,
    };

    const confirmOptions = lastConfirmationTokenId
      ? {
          ...baseOptions,
          confirmParams: { confirmation_token: lastConfirmationTokenId },
        }
      : {
          ...baseOptions,
          elements: elements,
        };
    const result =
      await stripe[isSetupIntent ? "confirmSetup" : "confirmPayment"](
        confirmOptions,
      );

    if (result.error) {
      handleFormSubmissionError(result.error);
    } else {
      onConfirmationSuccess();
    }
  }

  function handleFormSubmissionError(error: StripeError) {
    if (StripeService.isStripeHandledCardError(error)) {
      onError({
        code: PaymentElementErrorCode.HandledFormSubmissionError,
        gatewayErrorCode: error.code,
        message: error.message,
      });
    } else {
      onError({
        code: PaymentElementErrorCode.UnhandledFormSubmissionError,
        gatewayErrorCode: error.code,
        message: error.message,
      });
    }
  }

  let stripe: Stripe | null = null;
  let unsafeElements: StripeElements | null = null;
  let elements: StripeElements | null = null;

  let lastConfirmationTokenId: string | undefined = undefined;
  let lastTaxCalculationBillingDetails:
    | { countryCode?: string; postalCode?: string }
    | undefined = undefined;

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

  $: {
    // @ts-ignore
    if (unsafeElements && unsafeElements._elements.length > 0) {
      elements = unsafeElements;
    }
  }

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

  async function triggerBillingAddressUpdate() {
    if (!collectBillingAddress || !elements || !stripe) return;

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

    lastConfirmationTokenId = confirmationToken.id;

    const { countryCode, postalCode } =
      getCountryAndPostalCodeFromConfirmationToken(confirmationToken);

    if (
      countryCode === lastTaxCalculationBillingDetails?.countryCode &&
      postalCode === lastTaxCalculationBillingDetails?.postalCode
    ) {
      return;
    }

    lastTaxCalculationBillingDetails = { countryCode, postalCode };

    onBillingAddressUpdated({
      countryCode,
      postalCode,
    });
  }

  function getCountryAndPostalCodeFromConfirmationToken(
    confirmationToken: ConfirmationToken,
  ): { countryCode?: string; postalCode?: string } {
    const billingAddress =
      confirmationToken.payment_method_preview?.billing_details?.address;
    const countryCode = billingAddress?.country ?? undefined;
    const postalCode = billingAddress?.postal_code ?? undefined;
    return { countryCode, postalCode };
  }

  onMount(() => {
    updateStripeVariables();

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  });

  onMount(() => {
    let paymentElement: StripePaymentElement | null = null;
    let isMounted = true;

    (async () => {
      try {
        const { stripe: stripeInstance, elements: elementsInstance } =
          await StripeService.initializeStripe(
            gatewayParams,
            brandingInfo,
            stripeLocale,
            stripeVariables,
            viewport,
          );

        if (!isMounted) return;

        stripe = stripeInstance;
        unsafeElements = elementsInstance;

        paymentElement = StripeService.createPaymentElement(
          unsafeElements,
          brandingInfo?.app_name,
        );

        paymentElement.mount("#payment-element");

        paymentElement.on("ready", () => {
          onLoadingComplete();
        });

        paymentElement.on(
          "change",
          async (event: StripePaymentElementChangeEvent) => {
            lastConfirmationTokenId = undefined;

            if (
              collectBillingAddress &&
              event.complete &&
              event.value.type === "card"
            ) {
              await triggerBillingAddressUpdate();
            }

            onPaymentInfoChange({
              complete: event.complete,
              paymentMethod: event.complete ? event.value.type : undefined,
            });
          },
        );
        paymentElement.on("loaderror", (event) => {
          isMounted = false;
          onError({
            code: PaymentElementErrorCode.ErrorLoadingStripe,
            gatewayErrorCode: event.error.code,
            message: event.error.message,
          });
          onLoadingComplete();
        });
      } catch (error) {
        if (!isMounted) return;

        onError({
          code: PaymentElementErrorCode.ErrorLoadingStripe,
          gatewayErrorCode: undefined,
          message: error instanceof Error ? error.message : String(error),
        });
        onLoadingComplete();
      }
    })();

    return () => {
      if (isMounted) {
        isMounted = false;
        paymentElement?.destroy();
      }
    };
  });
</script>

<div id="payment-element"></div>
