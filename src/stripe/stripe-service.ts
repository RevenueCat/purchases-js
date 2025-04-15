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
import type { StripeElementsConfiguration } from "../networking/responses/stripe-elements";

export enum StripeServiceErrorCode {
  ErrorLoadingStripe = 0,
  HandledFormSubmissionError = 1,
  UnhandledFormSubmissionError = 2,
}

export type StripeServiceError = {
  code: StripeServiceErrorCode;
  gatewayErrorCode: string | undefined;
  message: string | undefined;
};

export type TaxCustomerDetails = {
  countryCode: string | undefined;
  postalCode: string | undefined;
};

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
   * @param locale
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
    stripeAccountId: string,
    publishableApiKey: string,
    elementsConfiguration: StripeElementsConfiguration,
    brandingInfo: BrandingInfoResponse | null,
    localeToUse: StripeElementLocale,
    stripeVariables: Appearance["variables"],
    viewport: "mobile" | "desktop",
  ): Promise<{ stripe: Stripe; elements: StripeElements }> {
    if (!publishableApiKey || !stripeAccountId || !elementsConfiguration) {
      throw {
        code: StripeServiceErrorCode.ErrorLoadingStripe,
        gatewayErrorCode: undefined,
        message: "Stripe configuration is missing",
      };
    }

    const stripe = await loadStripe(publishableApiKey, {
      stripeAccount: stripeAccountId,
    }).catch((error) => {
      throw this.mapError(error);
    });

    if (!stripe) {
      throw {
        code: StripeServiceErrorCode.ErrorLoadingStripe,
        gatewayErrorCode: undefined,
        message: "Stripe client not found",
      };
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
    elements.update({
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

  static async submitElements(elements: StripeElements) {
    const { error: submitError } = await elements.submit();
    if (submitError) {
      throw this.mapError(submitError);
    }
  }

  static mapError(error: StripeError) {
    if (this.isStripeHandledCardError(error)) {
      return {
        code: StripeServiceErrorCode.HandledFormSubmissionError,
        gatewayErrorCode: error.code,
        message: error.message,
      };
    }

    return {
      code: StripeServiceErrorCode.UnhandledFormSubmissionError,
      gatewayErrorCode: error.code,
      message: error.message,
    };
  }

  static async confirmElements(
    stripe: Stripe,
    elements: StripeElements,
    clientSecret: string,
    confirmationTokenId?: string,
  ) {
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

    if (result?.error) {
      throw this.mapError(result.error);
    }
  }

  static async extractTaxCustomerDetails(
    elements: StripeElements,
    stripe: Stripe,
  ): Promise<TaxCustomerDetails | undefined> {
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
}
