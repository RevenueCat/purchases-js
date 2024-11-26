import en from "./locale/en.json";
import es from "./locale/es.json";
import it from "./locale/it.json";
import { PeriodUnit } from "../../helpers/duration-helper";

export class Translator {
  private readonly locales: Record<string, LocaleTranslations> = {};

  private static instance: Translator;

  public static getInstance(): Translator {
    if (!Translator.instance) {
      Translator.instance = new Translator();
    }
    return Translator.instance;
  }

  public static fallback() {
    return new Translator();
  }

  public constructor(
    customTranslations?: Record<string, Record<string, string>>,
    private readonly selectedLocale: string = "en",
    private readonly defaultLocale: string = "en",
  ) {
    this.locales = {
      en: new LocaleTranslations(en),
      es: new LocaleTranslations(es),
      it: new LocaleTranslations(it),
    };
    if (customTranslations) {
      this.override(customTranslations);
    }
  }

  public override(customTranslations: Record<string, Record<string, string>>) {
    Object.entries(customTranslations).forEach(([locale, translations]) => {
      this.locales[locale] = new LocaleTranslations({
        ...(this.locales[locale].labels || {}),
        ...translations,
      });
    });
  }

  private getLocaleInstance(locale: string): LocaleTranslations | undefined {
    const potentialLocaleCode = locale.split("_")[0].split("-")[0];
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
  public constructor(public readonly labels: Record<string, string> = {}) {}

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
