import type {
  Appearance,
  PaymentIntentResult,
  SetupIntentResult,
  Stripe,
  StripeElementLocale,
  StripeElements,
  StripeError,
} from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import { Theme } from "../ui/theme/theme";
import { DEFAULT_TEXT_STYLES } from "../ui/theme/text";
import type {
  GatewayParams,
  StripeElementsConfiguration,
} from "../networking/responses/stripe-elements";
export class StripeService {
  private static FORM_VALIDATED_CARD_ERROR_CODES = [
    "card_declined",
    "expired_card",
    "incorrect_cvc",
    "incorrect_number",
  ];

  /**
   * This function converts some particular locales to the ones that stripe supports.
   * Finally falls back to 'auto' if the initialLocale is not supported by stripe.
   * @param locael
   */
  static getStripeLocale(locale: string): StripeElementLocale {
    // These locale that we support are not supported by stripe.
    // if any of these is passed we fallback to 'auto' so that
    // stripe will pick up the locale from the browser.
    const stripeUnsupportedLocale = ["ca", "hi", "uk"];

    if (stripeUnsupportedLocale.includes(locale)) {
      return "auto";
    }

    const mappedLocale: Record<string, StripeElementLocale> = {
      zh_Hans: "zh",
      zh_Hant: "zh",
    };

    if (Object.keys(mappedLocale).includes(locale)) {
      return mappedLocale[locale];
    }

    return locale as StripeElementLocale;
  }

  static async initializeStripe(
    gatewayParams: GatewayParams,
    brandingInfo: BrandingInfoResponse | null,
    localeToUse: StripeElementLocale,
    stripeVariables: Appearance["variables"],
    viewport: "mobile" | "desktop",
  ) {
    const stripePk = gatewayParams.publishable_api_key;
    const stripeAcctId = gatewayParams.stripe_account_id;
    const elementsConfiguration = gatewayParams.elements_configuration;

    if (!stripePk || !stripeAcctId || !elementsConfiguration) {
      throw new Error("Stripe configuration is missing");
    }

    const stripe = await loadStripe(stripePk, {
      stripeAccount: stripeAcctId,
    });

    if (!stripe) {
      throw new Error("Stripe client not found");
    }

    const theme = new Theme(brandingInfo?.appearance);
    const customShape = theme.shape;
    const customColors = theme.formColors;
    const textStyles = theme.textStyles;

    const baseFontSize =
      DEFAULT_TEXT_STYLES.bodyBase[viewport].fontSize ||
      DEFAULT_TEXT_STYLES.bodyBase["mobile"].fontSize;

    const elements = stripe.elements({
      loader: "always",
      locale: localeToUse,
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
          fontSizeBase: baseFontSize,
          ...stripeVariables,
        },
        rules: {
          ".Input": {
            boxShadow: "none",
            paddingTop: "6px",
            paddingBottom: "6px",
            fontSize: baseFontSize,
            border: `1px solid ${customColors["grey-ui-dark"]}`,
            backgroundColor: customColors["input-background"],
            color: customColors["grey-text-dark"],
          },
          ".Input:focus": {
            border: `1px solid ${customColors["focus"]}`,
            outline: "none",
          },
          ".Label": {
            fontWeight: textStyles.bodyBase[viewport].fontWeight,
            lineHeight: "22px",
            color: customColors["grey-text-dark"],
          },
          ".Label--floating": {
            opacity: "1",
          },
          ".Input--invalid": {
            boxShadow: "none",
          },
          ".TermsText": {
            fontSize: textStyles.captionDefault[viewport].fontSize,
            lineHeight: textStyles.captionDefault[viewport].lineHeight,
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

    await this.updateElementsConfiguration(elements, elementsConfiguration);

    return { stripe, elements };
  }

  static async updateElementsConfiguration(
    elements: StripeElements,
    elementsConfiguration: StripeElementsConfiguration,
  ) {
    await elements.update({
      mode: elementsConfiguration.mode,
      paymentMethodTypes: elementsConfiguration.payment_method_types,
      setupFutureUsage: elementsConfiguration.setup_future_usage,
      amount: elementsConfiguration.amount,
      currency: elementsConfiguration.currency,
    });
  }

  static isStripeHandledCardError(error: StripeError) {
    if (
      error.type === "card_error" &&
      error.code &&
      this.FORM_VALIDATED_CARD_ERROR_CODES.includes(error.code)
    ) {
      return true;
    }

    return false;
  }

  static createPaymentElement(
    elements: StripeElements,
    appName?: string | null,
  ) {
    return elements.create("payment", {
      business: appName ? { name: appName } : undefined,
      layout: {
        type: "tabs",
      },
      terms: {
        applePay: "never",
        auBecsDebit: "never",
        bancontact: "never",
        card: "never",
        cashapp: "never",
        googlePay: "never",
        ideal: "never",
        paypal: "never",
        sepaDebit: "never",
        sofort: "never",
        usBankAccount: "never",
      },
    });
  }

  static createLinkAuthenticationElement(
    elements: StripeElements,
    email?: string,
  ) {
    return elements.create("linkAuthentication", {
      defaultValues: {
        email: email ?? "",
      },
    });
  }

  static async confirmIntent(
    stripe: Stripe,
    elements: StripeElements,
    clientSecret: string,
    confirmationTokenId?: string,
  ): Promise<StripeError | undefined> {
    const baseOptions = {
      clientSecret,
      redirect: "if_required" as const,
    };

    const confirmOptions = confirmationTokenId
      ? {
          ...baseOptions,
          confirmParams: { confirmation_token: confirmationTokenId },
        }
      : {
          ...baseOptions,
          elements: elements,
        };

    const isSetupIntent = clientSecret.startsWith("seti_");
    let result: SetupIntentResult | PaymentIntentResult | undefined;
    if (isSetupIntent) {
      result = await stripe.confirmSetup(confirmOptions);
    } else {
      result = await stripe.confirmPayment(confirmOptions);
    }

    return result?.error;
  }
}
