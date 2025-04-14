<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type {
    Appearance,
    Stripe,
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

  interface Props {
    gatewayParams: GatewayParams;
    brandingInfo: BrandingInfoResponse | null;
    taxCollectionEnabled: boolean;
    onLoadingComplete: () => void;
    onError: (error: PaymentElementError) => void;
    onTaxCustomerDetailsUpdated: (customerDetails: TaxCustomerDetails) => void;
    onPaymentInfoChange: (params: {
      complete: boolean;
      paymentMethod: string | undefined;
    }) => void;
    onSubmissionSuccess: () => void;
    onConfirmationSuccess: () => void;
    submit: () => void;
    confirm: (clientSecret: string) => void;
  }

  let {
    submit = $bindable(),
    confirm = $bindable(),
    ...props
  }: Props = $props();

  const {
    gatewayParams,
    brandingInfo,
    taxCollectionEnabled,
    onTaxCustomerDetailsUpdated,
    onLoadingComplete,
    onError,
    onPaymentInfoChange,
    onSubmissionSuccess,
    onConfirmationSuccess,
  } = props;

  const translator = getContext<Writable<Translator>>(translatorContextKey);
  const spacing = new Theme().spacing;
  const stripeLocale = StripeService.getStripeLocale(
    $translator.locale || $translator.fallbackLocale,
  );

  let stripe: Stripe | null = $state(null);
  let stripeVariables: undefined | Appearance["variables"] = $state(undefined);
  let viewport: "mobile" | "desktop" = $state("mobile");
  let resizeTimeout: number | undefined = $state(undefined);
  let elements: StripeElements | null = $state(null);
  let paymentElementReadyForSubmission = $state(false);
  let lastTaxCustomerDetails: TaxCustomerDetails | undefined = undefined;

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

  async function triggerTaxDetailsUpdated() {
    if (!elements || !stripe || !paymentElementReadyForSubmission) return;

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

    const sameAddress =
      billingAddress?.postal_code === lastTaxCustomerDetails?.postalCode &&
      billingAddress?.country === lastTaxCustomerDetails?.countryCode;

    if (!billingAddress || sameAddress) {
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

  const onPaymentElementReady = async () => {
    paymentElementReadyForSubmission = true;
    onLoadingComplete();
  };

  const onPaymentElementChange = async (
    event: StripePaymentElementChangeEvent,
  ) => {
    if (taxCollectionEnabled && event.complete && event.value.type === "card") {
      // This calls a callback from outside and that callback might create issues
      // with the other callback from below.
      // We should merge the 2 callbacks and send the tax details along with the
      // onPaymentInfoChange.
      // As undefined if no tax collection is enabled.
      await triggerTaxDetailsUpdated();
    }
    onPaymentInfoChange({
      complete: event.complete,
      paymentMethod: event.complete ? event.value.type : undefined,
    });
  };

  onMount(async () => {
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

    if (stripe || elements) return;

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
  <PaymentElement
    {elements}
    {brandingInfo}
    onReady={onPaymentElementReady}
    onChange={onPaymentElementChange}
    onError={onStripeElementsLoadingError}
  />
{/if}
