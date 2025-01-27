<script lang="ts">
  import { getContext, onMount } from "svelte";

  import Button from "../button.svelte";
  import { Elements, ExpressCheckout, PaymentElement } from "svelte-stripe";
  import type {
    Stripe,
    StripeElementLocale,
    StripeElements,
    StripeError,
  } from "@stripe/stripe-js";
  import { loadStripe } from "@stripe/stripe-js";
  import StateLoading from "./state-loading.svelte";
  import { type PurchaseResponse } from "../../networking/responses/purchase-response";
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
  import TextSeparator from "../text-separator.svelte";
  import SecureCheckoutRc from "../secure-checkout-rc.svelte";

  export let onClose: any;
  export let onContinue: any;
  export let paymentInfoCollectionMetadata: PurchaseResponse;
  export let processing = false;
  export let productDetails: Product;
  export let purchaseOptionToUse: PurchaseOption;
  export let brandingInfo: BrandingInfoResponse | null;

  const clientSecret = paymentInfoCollectionMetadata.data.client_secret;

  let stripe: Stripe | null = null;
  let elements: StripeElements;
  let safeElements: StripeElements;
  let modalErrorMessage: string | undefined = undefined;
  let isPaymentInfoComplete = false;

  let textStyles = new Theme().textStyles;
  let spacing = new Theme().spacing;

  let stripeVariables: undefined | Elements["variables"];
  let viewport: "mobile" | "desktop" = "mobile";

  // Maybe extract this to a
  function updateStripeVariables() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
      viewport = "mobile";
    } else {
      viewport = "desktop";
    }

    stripeVariables = {
      fontSizeBase: textStyles.body1[viewport].fontSize,
      spacingGridRow: spacing.gapLarge[viewport],
    };
  }

  let resizeTimeout: number | undefined;
  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateStripeVariables();
    }, 150);
  }

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

    console.log(elements);
  }

  onMount(async () => {
    const stripePk = paymentInfoCollectionMetadata.data.publishable_api_key;
    const stripeAcctId = paymentInfoCollectionMetadata.data.stripe_account_id;

    if (!stripePk || !stripeAcctId) {
      throw new Error("Stripe publishable key or account ID not found");
    }

    stripe = await loadStripe(stripePk, {
      stripeAccount: stripeAcctId,
    });
  });

  const handleContinue = async () => {
    if (processing || !stripe || !safeElements || !clientSecret) return;

    processing = true;

    const isSetupIntent = clientSecret.startsWith("seti_");

    // confirm payment with stripe
    let error: StripeError | undefined = undefined;
    if (isSetupIntent) {
      const result = await stripe.confirmSetup({
        elements: safeElements,
        redirect: "if_required",
      });
      error = result.error;
    } else {
      const result = await stripe.confirmPayment({
        elements: safeElements,
        redirect: "if_required",
      });
      error = result.error;
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

  const theme = new Theme(brandingInfo?.appearance);

  let customShape = theme.shape;
  let customColors = theme.formColors;

  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();
  const stripeElementLocale = (translator.locale ||
    translator.fallbackLocale) as StripeElementLocale;

  type OnChangeEvent = CustomEvent<{ complete: boolean }>;

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
</script>

<div class="checkout-container">
  <TextSeparator text="Pay by card" />
  <ExpressCheckout
    on:continue={handleContinue}
    on:click={handleContinue}
    buttonHeight={48}
    buttonTheme={{
      googlePay: "white",
    }}
    buttonType={{ googlePay: "buy", applePay: "buy" }}
    paymentMethodOrder={["applePay", "googlePay", "amazonPay"]}
  />
  <TextSeparator text="Pay by card" />
  {#if stripe && clientSecret}
    <form on:submit|preventDefault={handleContinue}>
      <Elements
        {stripe}
        {clientSecret}
        loader="always"
        locale={localeToUse}
        bind:elements
        theme="stripe"
        labels="floating"
        variables={{
          borderRadius: customShape["input-border-radius"],
          spacingGridRow: "0px",
          fontLineHeight: "10px",
          focusBoxShadow: "none",
          colorDanger: customColors["error"],
          colorTextPlaceholder: customColors["grey-text-light"],
          colorText: customColors["grey-text-dark"],
          colorTextSecondary: customColors["grey-text-light"],
          ...stripeVariables,
        }}
        rules={{
          ".Input": {
            boxShadow: "none",
            paddingTop: "0px",
            paddingBottom: "0px",
            border: `1px solid ${customColors["grey-ui-dark"]}`,
            backgroundColor: customColors["input-background"],
            color: customColors["grey-text-dark"],
          },
          ".Input:focus": {
            border: `1px solid ${customColors["focus"]}`,
            outline: "none",
          },
          ".Label": {
            fontWeight: textStyles.body1.desktop.fontWeight,
            lineHeight: "22px",
            color: customColors["grey-text-dark"],
          },
          ".Input--invalid": {
            boxShadow: "none",
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
        }}
      >
        <div class="checkout-form-container" hidden={!!modalErrorMessage}>
          <PaymentElement
            options={{
              terms: {
                card: "never",
              },
              business: brandingInfo?.app_name
                ? { name: brandingInfo.app_name }
                : undefined,
              layout: {
                type: "tabs",
              },
            }}
            on:change={(event: OnChangeEvent) => {
              isPaymentInfoComplete = event.detail.complete;
            }}
          />

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
            <p class="terms">
              By providing your card information you allow Igify to charge your
              card for future payments in accordance with their terms.
            </p>

            <SecureCheckoutRc />
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
            brandingInfo={null}
          >
            {#snippet icon()}
              <IconError />
            {/snippet}
            {#snippet message()}
              {modalErrorMessage}
            {/snippet}
          </MessageLayout>
        {/if}
      </Elements>
    </form>
  {:else}
    <StateLoading />
  {/if}
</div>

<style>
  .terms {
    font: var(--rc-text-caption-mobile);
    margin-top: var(--rc-spacing-gapLarge-mobile);
    margin-bottom: var(--rc-spacing-gapLarge-mobile);
  }

  @media (min-width: 768px) {
    .terms {
      font: var(--rc-text-caption-desktop);
      color: var(--rc-color-grey-text-light);
    }
  }

  .checkout-container {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapLarge-mobile);
  }

  .checkout-pay-container {
    display: flex;
    flex-direction: column;
    margin-top: var(--rc-spacing-gapLarge-mobile);
  }

  @media (min-width: 768px) {
    .checkout-container {
      gap: var(--rc-spacing-gapLarge-desktop);
    }

    .checkout-pay-container {
      margin-top: var(--rc-spacing-gapLarge-desktop);
    }

    .terms {
      margin-top: var(--rc-spacing-gapLarge-desktop);
      margin-bottom: var(--rc-spacing-gapLarge-desktop);
    }
  }

  .checkout-form-container {
    width: 100%;
    /* The standard height of the payment form from Stripe */
    /* Added to avoid the card getting smaller while loading */
    min-height: 320px;
  }
</style>
