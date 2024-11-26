import en from "./locale/en.json";
import es from "./locale/es.json";
import it from "./locale/it.json";
import type { PeriodUnit } from "../../helpers/duration-helper";

export class Translator {
  private readonly locales: Record<string, LocaleTranslations> = {};

  public static fallback() {
    return new Translator();
  }

  public constructor(
    customTranslations?: Record<string, Record<string, string>>,
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

  public override(customTranslations: Record<string, Record<string, string>>) {
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

  public translate(
    labelId: string,
    variables?: Record<string, string>,
  ): string | undefined {
    const localeInstance = this.getLocaleInstance(this.selectedLocale);
    const fallbackInstance = this.getLocaleInstance(this.defaultLocale);

    return (
      localeInstance?.translate(labelId, variables) ||
      fallbackInstance?.translate(labelId, variables)
    );
  }

  public translatePeriod(
    amount: number,
    period: PeriodUnit,
  ): string | undefined {
    const localeInstance = this.getLocaleInstance(this.selectedLocale);
    const fallbackInstance = this.getLocaleInstance(this.defaultLocale);

    return (
      localeInstance?.translatePeriod(amount, period) ||
      fallbackInstance?.translatePeriod(amount, period)
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

  public translate(
    labelId: string,
    variables?: Record<string, string>,
  ): string | undefined {
    const label = this.labels[labelId];
    if (!label) return undefined;

    return Object.entries(variables || {}).reduce(
      (acc, [key, value]) => acc.replace(`{{${key}}}`, value),
      label,
    );
  }

  public translatePeriod(
    amount: number,
    period: PeriodUnit,
  ): string | undefined {
    const key =
      Math.abs(amount) === 1 ? `periods.${period}` : `periods.${period}Plural`;

    return this.translate(key, { amount: amount.toString() });
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
