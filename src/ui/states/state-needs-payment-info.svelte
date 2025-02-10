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
  import {
    PurchaseFlowError,
    PurchaseOperationHelper,
  } from "../../helpers/purchase-operation-helper";
  import { DEFAULT_FONT_FAMILY } from "../theme/text";
  import { StripeService } from "../../stripe/stripe-service";

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
    try {
      const { stripe: stripeInstance, elements: elementsInstance } =
        await StripeService.initializeStripe(
          paymentInfoCollectionMetadata,
          brandingInfo,
          localeToUse,
          stripeVariables,
          viewport,
        );

      stripe = stripeInstance;
      elements = elementsInstance;

      const paymentElement = StripeService.createPaymentElement(
        elements,
        brandingInfo?.app_name,
      );

      paymentElement.mount("#payment-element");
      paymentElement.on("change", (event) => {
        isPaymentInfoComplete = event.complete;
      });
    } catch (error) {
      console.error("Failed to initialize Stripe:", error);
      modalErrorMessage = "Failed to initialize payment system";
    }
  });

  const handleContinue = async () => {
    if (processing || !stripe || !safeElements) return;

    processing = true;

    const { error: submitError } = await safeElements.submit();
    if (submitError) {
      handlePaymentError(submitError);
    } else {
      const checkoutError = await completeCheckout(stripe);

      if (checkoutError) {
        handlePaymentError(checkoutError);
      } else {
        onContinue();
      }
    }
  };

  function handlePaymentError(error: StripeError | PurchaseFlowError) {
    processing = false;

    if (error instanceof PurchaseFlowError) {
      modalErrorMessage = error.getPublicErrorMessage(productDetails);
    } else if (!StripeService.isStripeHandledCardError(error)) {
      modalErrorMessage = error.message;
    }
  }

  const completeCheckout = async (stripe: Stripe) => {
    // Get client secret if not already present
    if (!clientSecret) {
      try {
        const response = await purchaseOperationHelper.checkoutComplete();
        clientSecret = response?.gateway_params?.client_secret;
        if (!clientSecret) {
          throw new Error("Failed to complete checkout");
        }
      } catch (error) {
        return error as PurchaseFlowError;
      }
    }

    // Confirm payment or setup intent with Stripe
    const isSetupIntent = clientSecret.startsWith("seti_");
    const result = await stripe[
      isSetupIntent ? "confirmSetup" : "confirmPayment"
    ]({
      elements: safeElements,
      clientSecret,
      redirect: "if_required",
    });

    return result.error;
  };

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
