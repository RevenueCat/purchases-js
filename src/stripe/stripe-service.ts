import type {
  Appearance,
  PaymentIntentResult,
  SetupIntentResult,
  Stripe,
  StripeElementLocale,
  StripeElements,
  StripeError,
} from "@stripe/stripe-js";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import { Theme } from "../ui/theme/theme";
import { DEFAULT_TEXT_STYLES } from "../ui/theme/text";
import type { StripeElementsConfiguration } from "../networking/responses/stripe-elements";
import type { Product, SubscriptionOption } from "../entities/offerings";
import type { Translator } from "../ui/localization/translator";
import { LocalizationKeys } from "../ui/localization/supportedLanguages";
import type { StripeExpressCheckoutElementOptions } from "@stripe/stripe-js/dist/stripe-js/elements/index";
import { type Period, PeriodUnit } from "../helpers/duration-helper";
import type { StripeExpressCheckoutConfiguration } from "./stripe-express-checkout-configuration";
import type { PriceBreakdown } from "../ui/ui-types";
import { loadStripe } from "@stripe/stripe-js";

export enum StripeServiceErrorCode {
  ErrorLoadingStripe = 0,
  HandledFormError = 1,
  UnhandledFormError = 2,
}

export class StripeServiceError {
  constructor(
    public code: StripeServiceErrorCode,
    public gatewayErrorCode: string | undefined,
    public message: string | undefined,
  ) {}
}

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
      throw this.mapInitializationError(error);
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

    let elements: StripeElements;
    try {
      elements = stripe.elements({
        mode: elementsConfiguration.mode,
        paymentMethodTypes: elementsConfiguration.payment_method_types,
        setupFutureUsage: elementsConfiguration.setup_future_usage,
        amount: elementsConfiguration.amount,
        currency: elementsConfiguration.currency,
        loader: "always",
        locale: localeToUse,
        appearance: {
          theme: "stripe",
          labels: "floating",
          variables: {
            borderRadius: customShape["input-border-radius"],
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
              fontWeight: textStyles.labelDefault[viewport].fontWeight,
              lineHeight: "22px",
              color: customColors["grey-text-dark"],
            },
            ".Label--floating": {
              opacity: "1",
            },
            ".Input--invalid": {
              boxShadow: "none",
            },
          },
        },
      });
    } catch (error) {
      throw this.mapInitializationError(error as StripeError);
    }

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

  static isStripeHandledFormError(error: StripeError) {
    const isValidationError = error.type === "validation_error";

    const isCardError =
      error.type === "card_error" &&
      error.code &&
      this.FORM_VALIDATED_CARD_ERROR_CODES.includes(error.code);

    return isValidationError || isCardError;
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

  static createExpressCheckoutElement(
    elements: StripeElements,
    billingAddressRequired: boolean,
    expressCheckoutOptions?: StripeExpressCheckoutConfiguration,
  ) {
    const options = {
      billingAddressRequired,
      emailRequired: true,
      ...(expressCheckoutOptions ? expressCheckoutOptions : {}),
    } as StripeExpressCheckoutElementOptions;

    return elements.create("expressCheckout", options);
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

  static mapInitializationError(error: StripeError) {
    return new StripeServiceError(
      StripeServiceErrorCode.ErrorLoadingStripe,
      error.code,
      error.message,
    );
  }

  static mapError(error: StripeError) {
    if (this.isStripeHandledFormError(error)) {
      return new StripeServiceError(
        StripeServiceErrorCode.HandledFormError,
        error.code,
        error.message,
      );
    }

    return new StripeServiceError(
      StripeServiceErrorCode.UnhandledFormError,
      error.code,
      error.message,
    );
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
  ): Promise<{
    customerDetails: TaxCustomerDetails;
    confirmationTokenId: string;
  }> {
    const { error: confirmationError, confirmationToken } =
      await stripe.createConfirmationToken({
        elements: elements,
      });

    if (confirmationError) {
      throw this.mapError(confirmationError);
    }

    const billingAddress =
      confirmationToken.payment_method_preview?.billing_details?.address;

    return {
      customerDetails: {
        countryCode: billingAddress?.country ?? undefined,
        postalCode: billingAddress?.postal_code ?? undefined,
      },
      confirmationTokenId: confirmationToken.id,
    };
  }

  static nextDateForPeriod(period: Period, startDate: Date) {
    if (period.unit === PeriodUnit.Year) {
      startDate.setFullYear(startDate.getFullYear() + period.number);
      return startDate;
    }

    if (period.unit === PeriodUnit.Month) {
      startDate.setMonth(startDate.getMonth() + period.number);
      return startDate;
    }

    if (period.unit === PeriodUnit.Week) {
      startDate.setDate(startDate.getDate() + period.number * 7);
      return startDate;
    }

    if (period.unit === PeriodUnit.Day) {
      startDate.setDate(startDate.getDate() + period.number);
      return startDate;
    }

    return startDate;
  }

  static applePayPeriod(period: Period): {
    recurringPaymentIntervalUnit?: "year" | "month" | "day" | "hour" | "minute";
    recurringPaymentIntervalCount?: number;
  } {
    if (period.unit === PeriodUnit.Week) {
      return {
        recurringPaymentIntervalUnit: "day",
        recurringPaymentIntervalCount: period.number * 7,
      };
    }
    return {
      recurringPaymentIntervalUnit: period.unit,
      recurringPaymentIntervalCount: period.number,
    };
  }

  // https://docs.stripe.com/js/elements_object/create_without_intent#stripe_elements_no_intent-options-amount
  static microsToMinimumAmountPrice(
    priceMicros: number,
    currency: string,
  ): number {
    const zeroDecimalCurrencies = [
      "BIF",
      "CLP",
      "DJF",
      "GNF",
      "JPY",
      "KMF",
      "KRW",
      "MGA",
      "PYG",
      "RWF",
      "UGX",
      "VND",
      "VUV",
      "XAF",
      "XOF",
      "XPF",
    ];

    if (zeroDecimalCurrencies.includes(currency)) {
      return Math.floor(priceMicros / 1_000_000);
    }

    return Math.floor(priceMicros / 10_000);
  }

  static buildStripeExpressCheckoutOptionsForSubscription(
    productDetails: Product,
    priceBreakdown: PriceBreakdown,
    subscriptionOption: SubscriptionOption,
    translator: Translator,
    managementUrl: string,
  ): StripeExpressCheckoutConfiguration {
    const priceMinimumAmount = StripeService.microsToMinimumAmountPrice(
      priceBreakdown.totalAmountInMicros,
      priceBreakdown.currency,
    );

    const hasTrial = subscriptionOption.trial;
    const trialPeriod = subscriptionOption.trial?.period;
    const basePeriod = subscriptionOption.base.period;

    const recurringPaymentStartDate =
      hasTrial && trialPeriod
        ? StripeService.nextDateForPeriod(trialPeriod, new Date())
        : undefined;

    const recurringPeriod = basePeriod
      ? StripeService.applePayPeriod(basePeriod)
      : {};

    return {
      applePay: {
        recurringPaymentRequest: {
          paymentDescription: productDetails.title,
          managementURL: managementUrl,
          trialBilling: hasTrial
            ? {
                label: translator.translate(LocalizationKeys.ApplePayFreeTrial),
                amount: 0,
              }
            : undefined,
          regularBilling: {
            label: productDetails.title,
            amount: priceMinimumAmount,
            recurringPaymentStartDate: recurringPaymentStartDate,
            ...recurringPeriod,
          },
        },
      },
    };
  }
}
