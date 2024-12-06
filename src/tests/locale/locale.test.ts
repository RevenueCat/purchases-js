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
              LocalizationKeys.StateNeedsAuthInfoEmailStepTitle,
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
        translator.translate(LocalizationKeys.StateNeedsAuthInfoEmailStepTitle),
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
});
