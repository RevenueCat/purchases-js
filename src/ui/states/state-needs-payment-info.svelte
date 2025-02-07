<script lang="ts">
  import { getContext, onMount } from "svelte";

  import Button from "../button.svelte";
  import type {
    Appearance,
    Stripe,
    StripeElementLocale,
    StripeElements,
    StripeError,
  } from "@stripe/stripe-js";
  import { loadStripe } from "@stripe/stripe-js";
  import ProcessingAnimation from "../processing-animation.svelte";
  import type { Product, PurchaseOption } from "../../entities/offerings";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Theme } from "../theme/theme";
  import IconError from "../icons/icon-error.svelte";
  import MessageLayout from "../layout/message-layout.svelte";

  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import Localized from "../localization/localized.svelte";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  // import TextSeparator from "../text-separator.svelte";
  import SecureCheckoutRc from "../secure-checkout-rc.svelte";
  import { type CheckoutStartResponse } from "../../networking/responses/checkout-start-response";
  import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";

  export let onContinue: any;
  export let paymentInfoCollectionMetadata: CheckoutStartResponse;
  export let processing = false;
  export let productDetails: Product;
  export let purchaseOptionToUse: PurchaseOption;
  export let brandingInfo: BrandingInfoResponse | null;
  export let purchaseOperationHelper: PurchaseOperationHelper;

  let stripe: Stripe | null = null;
  let elements: StripeElements;
  let safeElements: StripeElements;
  let modalErrorMessage: string | undefined = undefined;
  let isPaymentInfoComplete = false;
  let clientSecret: string | undefined = undefined;

  let textStyles = new Theme().textStyles;
  let spacing = new Theme().spacing;

  let stripeVariables: undefined | Appearance["variables"];
  let viewport: "mobile" | "desktop" = "mobile";

  // Maybe extract this to a
  function updateStripeVariables() {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (isMobile) {
      viewport = "mobile";
    } else {
      viewport = "desktop";
    }

    stripeVariables = {
      fontSizeBase: "14px",
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

  const theme = new Theme(brandingInfo?.appearance);

  let customShape = theme.shape;
  let customColors = theme.formColors;

  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();
  const stripeElementLocale = (translator.locale ||
    translator.fallbackLocale) as StripeElementLocale;

  /**
   * This function converts some particular locales to the ones that stripe supports.
   * Finally falls back to 'auto' if the initialLocale is not supported by stripe.
   * @param initialLocale
   */
  const getLocaleToUse = (initialLocale: string) => {
    // These locale that we support are not supported by stripe.
    // if any of these is passed we fallback to 'auto' so that
    // stripe will pick up the locale from the browser.
    const stripeUnsupportedLocale = ["ca", "hi", "uk"];

    if (stripeUnsupportedLocale.includes(initialLocale)) {
      return "auto" as StripeElementLocale;
    }

    const mappedLocale: Record<string, string> = {
      zh_Hans: "zh",
      zh_Hant: "zh",
    };

    if (Object.keys(mappedLocale).includes(initialLocale)) {
      return mappedLocale[initialLocale] as StripeElementLocale;
    }

    return initialLocale as StripeElementLocale;
  };

  const localeToUse = getLocaleToUse(stripeElementLocale);

  onMount(() => {
    updateStripeVariables();

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  });

  $: {
    // @ts-ignore
    if (elements && elements._elements.length > 0) {
      safeElements = elements;
    }
  }

  onMount(async () => {
    const gatewayParams = paymentInfoCollectionMetadata.gateway_params;
    const stripePk = gatewayParams.publishable_api_key;
    const stripeAcctId = gatewayParams.stripe_account_id;
    const elementsConfiguration = gatewayParams.elements_configuration;
    if (!stripePk || !stripeAcctId || !elementsConfiguration) {
      throw new Error("Stripe configuration is missing");
    }

    stripe = await loadStripe(stripePk, {
      stripeAccount: stripeAcctId,
    });

    if (!stripe) {
      throw new Error("Stripe client not found");
    }

    elements = stripe.elements({
      loader: "always",
      locale: localeToUse,
      mode: elementsConfiguration.mode,
      paymentMethodTypes: elementsConfiguration.payment_method_types,
      setupFutureUsage: elementsConfiguration.setup_future_usage,
      amount: elementsConfiguration.amount,
      currency: elementsConfiguration.currency,
      appearance: {
        theme: "stripe",
        labels: "floating",
        variables: {
          borderRadius: customShape["input-border-radius"],
          fontLineHeight: "10px",
          focusBoxShadow: "none",
          colorDanger: customColors["error"],
          colorTextPlaceholder: customColors["grey-text-light"],
          colorText: customColors["grey-text-dark"],
          colorTextSecondary: customColors["grey-text-light"],
          ...stripeVariables,
        },
        rules: {
          ".Input": {
            boxShadow: "none",
            paddingTop: "6px",
            paddingBottom: "6px",
            border: `1px solid ${customColors["grey-ui-dark"]}`,
            backgroundColor: customColors["input-background"],
            color: customColors["grey-text-dark"],
          },
          ".Input:focus": {
            border: `1px solid ${customColors["focus"]}`,
            outline: "none",
          },
          ".Label": {
            fontWeight: textStyles.body1[viewport].fontWeight,
            lineHeight: "22px",
            color: customColors["grey-text-dark"],
          },
          ".Label--floating": {
            fontSize: "10px !important",
          },
          ".Input--invalid": {
            boxShadow: "none",
          },
          ".TermsText": {
            fontSize: textStyles.caption[viewport].fontSize,
            lineHeight: textStyles.caption[viewport].lineHeight,
          },
          ".Tab": {
            boxShadow: "none",
            backgroundColor: "transparent",
            color: customColors["grey-text-light"],
            border: `1px solid ${customColors["grey-ui-dark"]}`,
          },
          ".Tab:hover, .Tab:focus, .Tab--selected, .Tab--selected:hover, .Tab--selected:focus":
            {
              boxShadow: "none",
              color: customColors["grey-text-dark"],
            },
          ".Tab:focus, .Tab--selected, .Tab--selected:hover, .Tab--selected:focus":
            {
              border: `1px solid ${customColors["focus"]}`,
            },
          ".TabIcon": {
            fill: customColors["grey-text-light"],
          },
          ".TabIcon--selected": {
            fill: customColors["grey-text-dark"],
          },
          ".Block": {
            boxShadow: "none",
            backgroundColor: "transparent",
            border: `1px solid ${customColors["grey-ui-dark"]}`,
          },
        },
      },
    });

    const paymentElement = elements.create("payment", {
      business: brandingInfo?.app_name
        ? { name: brandingInfo.app_name }
        : undefined,
      layout: {
        type: "tabs",
      },
    });
    paymentElement.mount("#payment-element");

    paymentElement.on("change", (event) => {
      isPaymentInfoComplete = event.complete;
    });
  });

  const handleContinue = async () => {
    if (processing || !stripe || !safeElements) return;

    processing = true;

    let error: StripeError | undefined = undefined;
    const { error: submitError } = await safeElements.submit();
    if (submitError) {
      error = submitError;
    } else {
      error = await completeCheckout(stripe);
    }

    if (error) {
      processing = false;
      if (shouldShowErrorModal(error)) {
        modalErrorMessage = error.message;
      }
    } else {
      onContinue();
    }
  };

  const completeCheckout = async (stripe: Stripe) => {
    if (!clientSecret) {
      const checkoutCompleteResponse =
        await purchaseOperationHelper.checkoutComplete();

      clientSecret = checkoutCompleteResponse.gateway_params.client_secret;
      if (!clientSecret) {
        throw new Error("Failed to complete checkout");
      }
    }

    const isSetupIntent = clientSecret.startsWith("seti_");

    // confirm payment with stripe
    let error: StripeError | undefined = undefined;
    if (isSetupIntent) {
      const result = await stripe.confirmSetup({
        elements: safeElements,
        clientSecret: clientSecret,
        redirect: "if_required",
      });
      error = result.error;
    } else {
      const result = await stripe.confirmPayment({
        elements: safeElements,
        clientSecret: clientSecret,
        redirect: "if_required",
      });
      error = result.error;
    }

    return error;
  };

  function shouldShowErrorModal(error: StripeError) {
    const FORM_VALIDATED_CARD_ERROR_CODES = [
      "card_declined",
      "expired_card",
      "incorrect_cvc",
      "incorrect_number",
    ];
    if (
      error.type === "card_error" &&
      error.code &&
      FORM_VALIDATED_CARD_ERROR_CODES.includes(error.code)
    ) {
      return false;
    }

    return true;
  }

  const handleErrorTryAgain = () => {
    modalErrorMessage = undefined;
  };
</script>

<div class="checkout-container">
  <!-- <TextSeparator text="Pay by card" /> -->
  <form on:submit|preventDefault={handleContinue}>
    <div class="checkout-form-container" hidden={!!modalErrorMessage}>
      <div id="payment-element"></div>

      <div class="checkout-pay-container">
        {#if !modalErrorMessage}
          <Button
            disabled={processing || !isPaymentInfoComplete}
            testId="PayButton"
          >
            {#if processing}
              <ProcessingAnimation />
            {:else if productDetails.subscriptionOptions?.[purchaseOptionToUse.id]?.trial}
              <Localized
                key={LocalizationKeys.StateNeedsPaymentInfoButtonStartTrial}
              />
            {:else}
              <Localized
                key={LocalizationKeys.StateNeedsPaymentInfoButtonPay}
              />
            {/if}
          </Button>
        {/if}

        <div class="checkout-secure-container">
          <SecureCheckoutRc />
        </div>
      </div>
    </div>

    {#if modalErrorMessage}
      <MessageLayout
        title={null}
        type="error"
        closeButtonTitle={translator.translate(
          LocalizationKeys.StateErrorButtonTryAgain,
        )}
        onContinue={handleErrorTryAgain}
      >
        {#snippet icon()}
          <IconError />
        {/snippet}
        {#snippet message()}
          {modalErrorMessage}
        {/snippet}
      </MessageLayout>
    {/if}
  </form>
</div>

<style>
  .checkout-secure-container {
    margin-top: var(--rc-spacing-gapXLarge-mobile);
  }

  .checkout-container {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXLarge-mobile);
  }

  .checkout-pay-container {
    display: flex;
    flex-direction: column;
    margin-top: var(--rc-spacing-gapXLarge-mobile);
  }

  @media (min-width: 768px) {
    .checkout-secure-container {
      margin-top: var(--rc-spacing-gapXLarge-desktop);
    }

    .checkout-container {
      gap: var(--rc-spacing-gapXLarge-desktop);
      margin-top: var(--rc-spacing-gapXLarge-desktop);
    }

    .checkout-pay-container {
      margin-top: var(--rc-spacing-gapXLarge-desktop);
    }
  }

  .checkout-form-container {
    width: 100%;
    /* The standard height of the payment form from Stripe */
    /* Added to avoid the card getting smaller while loading */
    min-height: 320px;
  }
</style>
