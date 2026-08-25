import type {
  Appearance,
  PaymentIntentResult,
  SetupIntentResult,
  Stripe,
  StripeElementLocale,
  StripeElements,
  StripeElementsOptionsMode,
  StripeEmbeddedCheckout,
  StripeError,
} from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";

import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import { Theme } from "../ui/theme/theme";
import { DEFAULT_TEXT_STYLES } from "../ui/theme/text";
import type { StripeElementsConfiguration } from "../networking/responses/stripe-elements";
import {
  type PricingPhase,
  type Product,
  type SubscriptionOption,
} from "../entities/offerings";
import type { Translator } from "../ui/localization/translator";
import { LocalizationKeys } from "../ui/localization/supportedLanguages";
import type { StripeExpressCheckoutElementOptions } from "@stripe/stripe-js/dist/stripe-js/elements/index";
import type { LineItem } from "@stripe/stripe-js/dist/stripe-js/elements/express-checkout";
import {
  getNextRenewalDate,
  type Period,
  PeriodUnit,
} from "../helpers/duration-helper";
import type { ResolvedDiscountBreakdown } from "../helpers/discount-breakdown-helper";
import type { StripeExpressCheckoutConfiguration } from "./stripe-express-checkout-configuration";
import type { PriceBreakdown } from "../ui/ui-types";
import type { StripeBillingParams } from "../networking/responses/checkout-start-response";
import type { ApplePayRegularBilling } from "@stripe/stripe-js/dist/stripe-js/elements/apple-pay";

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
  state: string | undefined;
  city: string | undefined;
  addressLine1: string | undefined;
  addressLine2: string | undefined;
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
      "zh-Hans": "zh",
      zh_Hant: "zh-TW",
      "zh-Hant": "zh-TW",
    };

    if (Object.keys(mappedLocale).includes(locale)) {
      return mappedLocale[locale];
    }

    return locale as StripeElementLocale;
  }

  static async getStripeClient(
    stripeAccountId: string,
    publishableApiKey: string,
  ): Promise<{ stripe: Stripe }> {
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

    return { stripe };
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

    const { stripe } = await this.getStripeClient(
      stripeAccountId,
      publishableApiKey,
    );

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
        // Backend guarantees payment-mode amount/currency; v9 types elements()
        // options as a discriminated union, so assert the union shape.
      } as StripeElementsOptionsMode);
    } catch (error) {
      throw this.mapInitializationError(error as StripeError);
    }

    return { stripe, elements };
  }

  static async initializeStripeCheckout(
    stripeAccountId?: string,
    publishableApiKey?: string,
    StripeBillingParams?: StripeBillingParams,
    onComplete?: () => void,
  ): Promise<{ stripe: Stripe; embeddedCheckout: StripeEmbeddedCheckout }> {
    if (!stripeAccountId || !publishableApiKey || !StripeBillingParams) {
      throw {
        code: StripeServiceErrorCode.ErrorLoadingStripe,
        gatewayErrorCode: undefined,
        message: "Stripe configuration is missing",
      };
    }

    const { stripe } = await this.getStripeClient(
      stripeAccountId,
      publishableApiKey,
    );

    let embeddedCheckout: StripeEmbeddedCheckout;

    try {
      // createEmbeddedCheckoutPage works on every Stripe.js release train and is
      // the only name that works on dahlia (initEmbeddedCheckout throws there).
      embeddedCheckout = await stripe.createEmbeddedCheckoutPage({
        fetchClientSecret: () =>
          Promise.resolve(StripeBillingParams.client_secret),
        onComplete,
      });
    } catch (error) {
      throw this.mapInitializationError(error as StripeError);
    }

    return { stripe, embeddedCheckout };
  }

  static updateElementsConfiguration(
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

  /**
   * Country codes (ISO 3166-1 alpha-2) that require the full billing address to
   * be collected when tax collection is enabled, because country alone is not
   * enough to resolve the tax rate.
   * See https://docs.stripe.com/tax/customer-locations?#supported-formats
   */
  private static FULL_ADDRESS_REQUIRED_TAX_COUNTRY_CODES = ["CA", "PR", "IN"];

  /**
   * Whether the given country requires the full billing address to be collected
   * to resolve taxes via Stripe Tax.
   */
  static countryRequiresFullAddressForTaxes(
    countryCode?: string | null,
  ): boolean {
    return (
      !!countryCode &&
      StripeService.FULL_ADDRESS_REQUIRED_TAX_COUNTRY_CODES.includes(
        countryCode,
      )
    );
  }

  static createAddressElement(
    elements: StripeElements,
    defaultCountryCode?: string,
  ) {
    return elements.create("address", {
      mode: "billing",
      display: {
        name: "full",
      },
      // Seed the country with the one already selected in the payment element so
      // the full address form opens on the country the customer just picked.
      ...(defaultCountryCode
        ? { defaultValues: { address: { country: defaultCountryCode } } }
        : {}),
    });
  }

  static createExpressCheckoutElement(
    elements: StripeElements,
    forceEnableWalletMethods: boolean,
    expressCheckoutOptions?: StripeExpressCheckoutConfiguration,
  ) {
    const options = {
      billingAddressRequired: true,
      emailRequired: true,
      ...(forceEnableWalletMethods
        ? {
            paymentMethods: {
              applePay: "always",
              googlePay: "always",
            },
          }
        : {}),
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
        state: billingAddress?.state ?? undefined,
        city: billingAddress?.city ?? undefined,
        addressLine1: billingAddress?.line1 ?? undefined,
        addressLine2: billingAddress?.line2 ?? undefined,
      },
      confirmationTokenId: confirmationToken.id,
    };
  }

  static nextDateForPeriod(period: Period, startDate: Date) {
    return getNextRenewalDate(startDate, period, true) ?? startDate;
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

  private static nextDateAfterPricingPhases(
    phases: PricingPhase[],
    startDate: Date,
  ): Date | undefined {
    let date = startDate;
    for (const phase of phases) {
      const period = phase.period;
      if (!period) {
        return undefined;
      }
      const cycleCount = Math.max(phase.cycleCount, 1);
      date = StripeService.nextDateForPeriod(
        {
          ...period,
          number: period.number * cycleCount,
        },
        date,
      );
    }
    return date;
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

  static toExpressCheckoutLineItems(
    productTitle: string,
    priceBreakdown: PriceBreakdown,
    resolvedDiscount: ResolvedDiscountBreakdown,
  ): LineItem[] {
    const { currency } = priceBreakdown;
    const totalMinimumAmount = StripeService.microsToMinimumAmountPrice(
      priceBreakdown.totalAmountInMicros,
      currency,
    );
    const discountMinimumAmount = StripeService.microsToMinimumAmountPrice(
      resolvedDiscount.discountAmountInMicros,
      currency,
    );

    return [
      {
        name: productTitle,
        amount: totalMinimumAmount + discountMinimumAmount,
      },
      { name: resolvedDiscount.label, amount: -discountMinimumAmount },
    ];
  }

  static buildStripeExpressCheckoutOptionsForSubscription(
    productDetails: Product,
    priceBreakdown: PriceBreakdown,
    subscriptionOption: SubscriptionOption,
    translator: Translator,
    managementUrl: string,
    resolvedDiscount: ResolvedDiscountBreakdown | null,
    maxRows?: number,
    maxColumns?: number,
    overflow?: "auto" | "never",
  ): StripeExpressCheckoutConfiguration {
    const layout = { maxRows, maxColumns, overflow };

    const lineItems =
      resolvedDiscount && resolvedDiscount.discountAmountInMicros > 0
        ? StripeService.toExpressCheckoutLineItems(
            productDetails.title,
            priceBreakdown,
            resolvedDiscount,
          )
        : undefined;

    const trialPhase = subscriptionOption.trial;
    const introPricePhase = subscriptionOption.introPrice;
    const basePeriod = subscriptionOption.base.period;
    const currentDate = new Date();
    const initialPhases = [trialPhase, introPricePhase].filter(
      (phase): phase is PricingPhase => phase !== null,
    );

    const recurringPaymentStartDate =
      initialPhases.length > 0
        ? StripeService.nextDateAfterPricingPhases(
            initialPhases,
            new Date(currentDate),
          )
        : undefined;

    const recurringPeriod = basePeriod
      ? StripeService.applePayPeriod(basePeriod)
      : {};

    const basePrice = subscriptionOption.base.price;
    const regularBillingAmount = StripeService.microsToMinimumAmountPrice(
      basePrice?.amountMicros ?? priceBreakdown.totalAmountInMicros,
      basePrice?.currency ?? priceBreakdown.currency,
    );

    const trialBilling = (() => {
      if (introPricePhase?.price) {
        const introBillingStartDate = trialPhase
          ? StripeService.nextDateAfterPricingPhases(
              [trialPhase],
              new Date(currentDate),
            )
          : undefined;
        const canCalculateIntroDates = !trialPhase || introBillingStartDate;
        const introCycleCount = Math.max(introPricePhase.cycleCount, 1);

        const baseBillingInfo: ApplePayRegularBilling = {
          label: productDetails.title,
          amount: StripeService.microsToMinimumAmountPrice(
            introPricePhase.price.amountMicros,
            introPricePhase.price.currency,
          ),
        };

        if (!canCalculateIntroDates || !introPricePhase.period) {
          return baseBillingInfo;
        }

        // Cycle length and number of cycles for the introductory period.
        const recurringPaymentIntervalUnitAndCount =
          StripeService.applePayPeriod(introPricePhase.period);

        // Start date of the introductory period. In case of an initial trial it will be at the end of that trial.
        const recurringPaymentStartDate = introBillingStartDate
          ? { recurringPaymentStartDate: introBillingStartDate }
          : {};

        // Date where the sequence of introductory cycles ends. I.e. weekly, 4 cycles, ending one month from now.
        const recurrentPaymentEndDate =
          introCycleCount > 1
            ? {
                recurringPaymentEndDate: StripeService.nextDateForPeriod(
                  {
                    ...introPricePhase.period,
                    number:
                      introPricePhase.period.number * (introCycleCount - 1),
                  },
                  new Date(introBillingStartDate ?? currentDate),
                ),
              }
            : {};

        // Apple calls this field trialBilling, but it is the only initial
        // recurring summary item available for a paid introductory phase.
        return {
          ...baseBillingInfo,
          ...recurringPaymentIntervalUnitAndCount,
          ...recurringPaymentStartDate,
          ...recurrentPaymentEndDate,
        };
      }

      if (trialPhase) {
        return {
          label: translator.translate(LocalizationKeys.ApplePayFreeTrial),
          amount: 0,
        };
      }

      return undefined;
    })();

    return {
      layout,
      ...(lineItems ? { lineItems } : {}),
      applePay: {
        recurringPaymentRequest: {
          paymentDescription: productDetails.title,
          managementURL: managementUrl,
          ...(trialBilling ? { trialBilling } : {}),
          regularBilling: {
            label: productDetails.title,
            amount: regularBillingAmount,
            recurringPaymentStartDate: recurringPaymentStartDate,
            ...recurringPeriod,
          },
        },
      },
    };
  }

  static buildStripeExpressCheckoutOptionsForNonSubscription(
    productDetails: Product,
    priceBreakdown: PriceBreakdown,
    resolvedDiscount: ResolvedDiscountBreakdown | null,
    maxRows?: number,
    maxColumns?: number,
    overflow?: "auto" | "never",
  ): StripeExpressCheckoutConfiguration {
    const layout = { maxRows, maxColumns, overflow };

    const lineItems =
      resolvedDiscount && resolvedDiscount.discountAmountInMicros > 0
        ? StripeService.toExpressCheckoutLineItems(
            productDetails.title,
            priceBreakdown,
            resolvedDiscount,
          )
        : undefined;

    return {
      layout,
      ...(lineItems ? { lineItems } : {}),
    };
  }
}
