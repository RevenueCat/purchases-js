import en from "./locale/en.json";
import es from "./locale/es.json";
import it from "./locale/it.json";
import type { PeriodUnit } from "../../helpers/duration-helper";

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
        this.simplifyLocaleString(locale),
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
      this.simplifyLocaleString(this.selectedLocale)
    );
  }

  get fallbackLocale(): string {
    return (
      this.getLocaleInstance(this.defaultLocale)?.localeKey ||
      this.simplifyLocaleString(this.defaultLocale)
    );
  }

  private simplifyLocaleString(locale: string): string {
    return locale.split("_")[0].split("-")[0];
  }

  private getLocaleInstance(locale: string): LocaleTranslations | undefined {
    const potentialLocaleCode = this.simplifyLocaleString(locale);
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
