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

  private constructor() {
    this.locales = {
      en: new LocaleTranslations(en),
      es: new LocaleTranslations(es),
      it: new LocaleTranslations(it),
    };
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
    return (
      Translator.getInstance().locales[locale] ||
      Translator.getInstance().locales[potentialLocaleCode]
    );
  }

  public static translate(
    locale: string,
    labelId: string,
    variables?: Record<string, string>,
  ): string | undefined {
    const localeInstance = Translator.getInstance().getLocaleInstance(locale);
    if (!localeInstance) return undefined;

    return localeInstance.translate(labelId, variables);
  }

  public static translatePeriod(
    locale: string,
    amount: number,
    period: PeriodUnit,
  ): string | undefined {
    const localeInstance = Translator.getInstance().getLocaleInstance(locale);
    if (!localeInstance) return undefined;

    return localeInstance.translatePeriod(amount, period);
  }

  public static translateFrequency(
    locale: string,
    amount: number,
    period: PeriodUnit,
  ): string | undefined {
    const localeInstance = Translator.getInstance().getLocaleInstance(locale);
    if (!localeInstance) return undefined;

    return localeInstance.translateFrequency(amount, period);
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

  public translateFrequency(
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
