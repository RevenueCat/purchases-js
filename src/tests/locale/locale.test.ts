import { describe, expect, test } from "vitest";

import {
  LocalizationKeys,
  supportedLanguages,
} from "../../ui/localization/supportedLanguages";
import * as fs from "node:fs";
import type { Price } from "../../entities/offerings";
import { Translator } from "../../ui/localization/translator";
import { type Period, PeriodUnit } from "../../helpers/duration-helper";

const eqSet = (xs: Set<unknown>, ys: Set<unknown>) =>
  xs.size === ys.size && [...xs].every((x) => ys.has(x));

describe("The Translator class", () => {
  test("should have the expected keys in all supported languages", () => {
    const expectedKeysSet = new Set(Object.values(LocalizationKeys));
    Object.entries(supportedLanguages).forEach(([lang, translations]) => {
      const otherLabelKeys = new Set(Object.keys(translations));

      expect(
        eqSet(expectedKeysSet, otherLabelKeys),
        `Language ${lang} doesn't have all the expected keys`,
      ).toBe(true);
    });
  });

  test("should not fail for any language/fallbackLanguage when formatting prices", () => {
    const price: Price = {
      amountMicros: 10000000,
      currency: "USD",
      formattedPrice: "$10.00",
      amount: 10,
    };

    Object.entries(supportedLanguages).forEach(([lang]) => {
      Object.entries(supportedLanguages).forEach(([fallbackLang]) => {
        const translator = new Translator({}, lang, fallbackLang);
        expect(
          () => translator.formatPrice(price.amountMicros, price.currency),
          `Formatting price failed for language ${lang}/${fallbackLang}`,
        ).not.toThrow();
      });
    });
  });

  test("should not fail for any language/fallbackLanguage when translating labels", () => {
    Object.entries(supportedLanguages).forEach(([lang]) => {
      Object.entries(supportedLanguages).forEach(([fallbackLang]) => {
        const translator = new Translator({}, lang, fallbackLang);
        expect(
          () =>
            translator.translate(
              LocalizationKeys.PaymentEntryPagePaymentStepTitle,
            ),
          `Translating failed for language ${lang}/${fallbackLang}`,
        ).not.toThrow();
      });
    });
  });

  test("should not fail for wrong languages when translating labels", () => {
    const translator = new Translator({}, "clearly_not_a_locale", "me_neither");
    expect(
      () =>
        translator.translate(LocalizationKeys.PaymentEntryPagePaymentStepTitle),
      `Translating failed for language`,
    ).not.toThrow();
  });

  test("should not fail for any language/fallbackLanguage when translating periods", () => {
    const period: Period = {
      number: 10,
      unit: PeriodUnit.Month,
    };

    Object.entries(supportedLanguages).forEach(([lang]) => {
      Object.entries(supportedLanguages).forEach(([fallbackLang]) => {
        const translator = new Translator({}, lang, fallbackLang);
        expect(
          () => translator.translatePeriod(period.number, period.unit),
          `Translating failed for language ${lang}/${fallbackLang}`,
        ).not.toThrow();
      });
    });
  });

  test("should not fail for wrong languages when translating periods", () => {
    const period: Period = {
      number: 10,
      unit: PeriodUnit.Month,
    };
    const translator = new Translator({}, "clearly_not_a_locale", "me_neither");
    expect(
      () => translator.translatePeriod(period.number, period.unit),
      `Translating failed for language`,
    ).not.toThrow();
  });

  test("should correctly translate 'per {labels}' for day", () => {
    const translator = new Translator({}, "en", "en");
    expect(
      translator.translatePeriodFrequency(1, PeriodUnit.Day, {
        useMultipleWords: true,
      }),
    ).toBe("per day");
    expect(
      translator.translatePeriodFrequency(1, PeriodUnit.Week, {
        useMultipleWords: true,
      }),
    ).toBe("per week");
    expect(
      translator.translatePeriodFrequency(1, PeriodUnit.Month, {
        useMultipleWords: true,
      }),
    ).toBe("per month");
    expect(
      translator.translatePeriodFrequency(1, PeriodUnit.Year, {
        useMultipleWords: true,
      }),
    ).toBe("per year");

    expect(
      translator.translatePeriodFrequency(2, PeriodUnit.Day, {
        useMultipleWords: true,
      }),
    ).toBe("every 2 days");
    expect(
      translator.translatePeriodFrequency(2, PeriodUnit.Week, {
        useMultipleWords: true,
      }),
    ).toBe("every 2 weeks");
    expect(
      translator.translatePeriodFrequency(2, PeriodUnit.Month, {
        useMultipleWords: true,
      }),
    ).toBe("every 2 months");
    expect(
      translator.translatePeriodFrequency(2, PeriodUnit.Year, {
        useMultipleWords: true,
      }),
    ).toBe("every 2 years");
  });
});

describe("The supportedLanguages", () => {
  test("should include all the files present in /locales", () => {
    const files: string[] = [];
    fs.readdirSync("src/ui/localization/locale").forEach((file) => {
      if (file.endsWith(".json")) {
        files.push(file.replace(".json", ""));
      }
    });

    expect(
      eqSet(new Set(Object.keys(supportedLanguages)), new Set(files)),
      "Not all files in /locales are imported as supportedLanguages",
    ).toBe(true);
  });

  test("should have the same variables in all translations as in English", () => {
    // Function to extract variables from a string (e.g., "{{amount}} week" -> ["amount"])
    const extractVariables = (str: string): string[] => {
      const matches = str.match(/\{\{([^}]+)\}\}/g) || [];
      return matches.map((match) => match.slice(2, -2)); // Remove {{ and }}
    };

    // English is our reference language
    const englishTranslations = supportedLanguages["en"];

    // For each key in the English translations
    Object.entries(englishTranslations).forEach(([key, englishValue]) => {
      // Get variables in the English version
      const englishVariables = new Set(extractVariables(englishValue));

      // Check each other language
      Object.entries(supportedLanguages).forEach(([lang, translations]) => {
        // Skip English as it's our reference
        if (lang === "en") return;

        const translation = translations[key as LocalizationKeys];
        if (!translation) {
          throw new Error(
            `Missing translation for key ${key} in language ${lang}`,
          );
        }

        // Get variables in this language's translation
        const translationVariables = new Set(extractVariables(translation));

        // Check if the variables match
        expect(
          eqSet(englishVariables, translationVariables),
          `Variables don't match for key "${key}" in language "${lang}". ` +
            `English has ${[...englishVariables].join(", ")} but ${lang} has ${[...translationVariables].join(", ")}`,
        ).toBe(true);
      });
    });
  });
});
