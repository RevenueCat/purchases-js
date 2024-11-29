import en from "./locale/en.json";
import es from "./locale/es.json";
import it from "./locale/it.json";
import type { PeriodUnit } from "../../helpers/duration-helper";

export enum LocalizationKeys {
  PeriodsWeek = "periods.week",
  PeriodsMonth = "periods.month",
  PeriodsYear = "periods.year",
  PeriodsDay = "periods.day",
  PeriodsWeekShort = "periods.weekShort",
  PeriodsMonthShort = "periods.monthShort",
  PeriodsYearShort = "periods.yearShort",
  PeriodsDayShort = "periods.dayShort",
  PeriodsLifetime = "periods.lifetime",
  PeriodsWeekPlural = "periods.weekPlural",
  PeriodsMonthPlural = "periods.monthPlural",
  PeriodsYearPlural = "periods.yearPlural",
  PeriodsDayPlural = "periods.dayPlural",
  PeriodsWeekFrequency = "periods.weekFrequency",
  PeriodsMonthFrequency = "periods.monthFrequency",
  PeriodsYearFrequency = "periods.yearFrequency",
  PeriodsDayFrequency = "periods.dayFrequency",
  PeriodsUnknownFrequency = "periods.unknownFrequency",
  PeriodsWeekFrequencyPlural = "periods.weekFrequencyPlural",
  PeriodsMonthFrequencyPlural = "periods.monthFrequencyPlural",
  PeriodsYearFrequencyPlural = "periods.yearFrequencyPlural",
  PeriodsDayFrequencyPlural = "periods.dayFrequencyPlural",
  StatePresentOfferProductTitle = "state_present_offer.product_title",
  StatePresentOfferProductDescription = "state_present_offer.product_description",
  StatePresentOfferProductPrice = "state_present_offer.product_price",
  StatePresentOfferFreeTrialDuration = "state_present_offer.free_trial_duration",
  StatePresentOfferPriceAfterFreeTrial = "state_present_offer.price_after_free_trial",
  StatePresentOfferRenewalFrequency = "state_present_offer.renewal_frequency",
  StatePresentOfferContinuesUntilCancelled = "state_present_offer.continues_until_cancelled",
  StatePresentOfferCancelAnytime = "state_present_offer.cancel_anytime",
  StateNeedsAuthInfoEmailStepTitle = "state_needs_auth_info.email_step_title",
  StateNeedsAuthInfoEmailInputLabel = "state_needs_auth_info.email_input_label",
  StateNeedsAuthInfoEmailInputPlaceholder = "state_needs_auth_info.email_input_placeholder",
  StateNeedsAuthInfoButtonContinue = "state_needs_auth_info.button_continue",
  StateNeedsPaymentInfoPaymentStepTitle = "state_needs_payment_info.payment_step_title",
  StateNeedsPaymentInfoButtonPay = "state_needs_payment_info.button_pay",
  StateNeedsPaymentInfoButtonStartTrial = "state_needs_payment_info.button_start_trial",
  StateSuccessPurchaseSuccessful = "state_success.purchase_successful",
  StateSuccessSubscriptionNowActive = "state_success.subscription_now_active",
  StateSuccessButtonClose = "state_success.button_close",
  StateErrorIfErrorPersists = "state_error.if_error_persists",
  StateErrorErrorTitleAlreadySubscribed = "state_error.error_title_already_subscribed",
  StateErrorErrorTitleAlreadyPurchased = "state_error.error_title_already_purchased",
  StateErrorErrorTitleOtherErrors = "state_error.error_title_other_errors",
  StateErrorErrorMessageAlreadySubscribed = "state_error.error_message_already_subscribed",
  StateErrorErrorMessageAlreadyPurchased = "state_error.error_message_already_purchased",
  StateErrorErrorMessageMissingEmailError = "state_error.error_message_missing_email_error",
  StateErrorErrorMessageNetworkError = "state_error.error_message_network_error",
  StateErrorErrorMessageErrorChargingPayment = "state_error.error_message_error_charging_payment",
  StateErrorErrorMessageErrorSettingUpPurchase = "state_error.error_message_error_setting_up_purchase",
  StateErrorErrorMessageUnknownError = "state_error.error_message_unknown_error",
  StateErrorButtonTryAgain = "state_error.button_try_again",
  PaywallVariablesPricePerPeriod = "paywall_variables.price_per_period",
  PaywallVariablesSubRelativeDiscount = "paywall_variables.sub_relative_discount",
  PaywallVariablesTotalPriceAndPerMonth = "paywall_variables.total_price_and_per_month",
}

/**
 * Custom translations to be used in the purchase flow.
 * This class allows you to override the default translations used in the purchase flow.
 * The main level keys are the locale codes and the values are objects with the same keys as the default translations.
 * @public
 * @example
 * This example will override the default translation for the email step title in the English locale.
 * ```typescript
 * const customTranslations = {
 *  en: {
 *    "state_needs_auth_info.email_step_title": "Billing email",
 *   }
 * }
 * ```
 */
export type CustomTranslations = Record<string, Record<string, string>>;

/**
 * Translation variables to be used in the translation.
 * This class allows you to pass variables to the translate method.
 * @public
 * @example Given a label with id `periods.monthPlural` and value `{{amount}} months`. This example will replace the variable `{{amount}}` with the value `10`.
 * ```typescript
 * translator.translate('periods.monthPlural', { amount: 10 });
 * // Output: 10 months
 * ```
 */
export type TranslationVariables = Record<
  string,
  string | number | undefined | null
>;

export interface TranslatePeriodOptions {
  noWhitespace?: boolean;
  short?: boolean;
}

const defaultTranslatePeriodOptions: TranslatePeriodOptions = {
  noWhitespace: false,
  short: false,
};

export class Translator {
  public readonly locales: Record<string, LocaleTranslations> = {};

  public static fallback() {
    return new Translator();
  }

  public constructor(
    customTranslations: CustomTranslations = {},
    public readonly selectedLocale: string = "en",
    public readonly defaultLocale: string = "en",
  ) {
    this.locales = {
      en: new LocaleTranslations(en, "en"),
      es: new LocaleTranslations(es, "es"),
      it: new LocaleTranslations(it, "it"),
    };
    if (customTranslations) {
      this.override(customTranslations);
    }
  }

  public override(customTranslations: CustomTranslations) {
    Object.entries(customTranslations).forEach(([locale, translations]) => {
      this.locales[locale] = new LocaleTranslations(
        {
          ...(this.locales[locale].labels || {}),
          ...translations,
        },
        this.getLanguageCodeString(locale),
      );
    });
  }

  public formatPrice(priceInMicros: number, currency: string): string {
    const price = priceInMicros / 1000000;
    const formatter = new Intl.NumberFormat(this.locale, {
      style: "currency",
      currency,
    });

    return formatter.format(price);
  }

  get locale(): string {
    return (
      this.getLocaleInstance(this.selectedLocale)?.localeKey ||
      this.getLanguageCodeString(this.selectedLocale)
    );
  }

  get fallbackLocale(): string {
    return (
      this.getLocaleInstance(this.defaultLocale)?.localeKey ||
      this.getLanguageCodeString(this.defaultLocale)
    );
  }

  private getLanguageCodeString(locale: string): string {
    return locale.split("_")[0].split("-")[0];
  }

  private getLocaleInstance(locale: string): LocaleTranslations | undefined {
    const potentialLocaleCode = this.getLanguageCodeString(locale);
    return this.locales[locale] || this.locales[potentialLocaleCode];
  }

  public translate(labelId: string, variables?: TranslationVariables): string {
    const localeInstance = this.getLocaleInstance(this.selectedLocale);
    const fallbackInstance = this.getLocaleInstance(this.defaultLocale);

    return (
      localeInstance?.translate(labelId, variables) ||
      fallbackInstance?.translate(labelId, variables) ||
      ""
    );
  }

  public translatePeriod(
    amount: number,
    period: PeriodUnit,
    options: TranslatePeriodOptions = defaultTranslatePeriodOptions,
  ): string | undefined {
    const localeInstance = this.getLocaleInstance(this.selectedLocale);
    const fallbackInstance = this.getLocaleInstance(this.defaultLocale);

    return (
      localeInstance?.translatePeriod(amount, period, options) ||
      fallbackInstance?.translatePeriod(amount, period, options)
    );
  }

  public translatePeriodUnit(
    period: PeriodUnit,
    options: TranslatePeriodOptions = defaultTranslatePeriodOptions,
  ): string | undefined {
    const localeInstance = this.getLocaleInstance(this.selectedLocale);
    const fallbackInstance = this.getLocaleInstance(this.defaultLocale);

    return (
      localeInstance?.translatePeriodUnit(period, options) ||
      fallbackInstance?.translatePeriodUnit(period, options)
    );
  }

  public translatePeriodFrequency(
    amount: number,
    period: PeriodUnit,
  ): string | undefined {
    const localeInstance = this.getLocaleInstance(this.selectedLocale);
    const fallbackInstance = this.getLocaleInstance(this.defaultLocale);

    return (
      localeInstance?.translatePeriodFrequency(amount, period) ||
      fallbackInstance?.translatePeriodFrequency(amount, period)
    );
  }
}

export class LocaleTranslations {
  public constructor(
    public readonly labels: Record<string, string> = {},
    public readonly localeKey: string,
  ) {}

  private replaceVariables(
    label: string,
    variables: TranslationVariables,
  ): string {
    return Object.entries(variables).reduce(
      (acc, [key, value]) =>
        acc.replace(
          `{{${key}}}`,
          `${value === undefined || value === null ? "" : value}`,
        ),
      label,
    );
  }

  public translate(
    labelId: string,
    variables?: TranslationVariables,
  ): string | undefined {
    const label = this.labels[labelId];
    if (!label) return undefined;

    return this.replaceVariables(label, variables || {});
  }

  public translatePeriod(
    amount: number,
    period: PeriodUnit,
    options: TranslatePeriodOptions = defaultTranslatePeriodOptions,
  ): string | undefined {
    const { noWhitespace, short } = {
      ...defaultTranslatePeriodOptions,
      ...options,
    };

    const key = short
      ? `periods.${period}Short`
      : Math.abs(amount) === 1
        ? `periods.${period}`
        : `periods.${period}Plural`;

    return this.translate(key, { amount: amount.toString() })?.replace(
      " ",
      noWhitespace ? "" : " ",
    );
  }

  public translatePeriodUnit(
    period: PeriodUnit,
    options: TranslatePeriodOptions = defaultTranslatePeriodOptions,
  ): string | undefined {
    const { noWhitespace, short } = {
      ...defaultTranslatePeriodOptions,
      ...options,
    };
    const key = `periods.${period}${short ? "Short" : ""}`;

    return this.translate(key, { amount: "" })?.replace(
      " ",
      noWhitespace ? "" : " ",
    );
  }

  public translatePeriodFrequency(
    amount: number,
    period: PeriodUnit,
  ): string | undefined {
    const key =
      Math.abs(amount) === 1
        ? `periods.${period}Frequency`
        : `periods.${period}FrequencyPlural`;

    return this.translate(key, { amount: amount.toString() });
  }
}
