// src/tests/locale/free-trial-duration.test.ts
import { expect, test } from "vitest";
import { getTranslatedPeriodLength } from "../../helpers/price-labels";
import { Translator } from "../../ui/localization/translator";
import { LocalizationKeys } from "../../ui/localization/supportedLanguages";

test.each([
  ["ja", "P1W", "1週間無料トライアル"],
  ["ko", "P7D", "7일 무료 체험"],
  ["pl", "P1W", "Bezpłatny okres próbny: 1 tydzień"],
  ["zh_Hans", "P1W", "1 周免费试用"],
  ["zh_Hans", "P1M", "1 个月免费试用"],
  ["zh_Hant", "P1W", "1 週免費試用"],
])(
  "free trial duration in %s for %s shows the unit once",
  (locale, duration, expected) => {
    const translator = new Translator({}, locale, "en");
    expect(
      translator.translate(LocalizationKeys.ProductInfoFreeTrialDuration, {
        trialDuration: getTranslatedPeriodLength(duration, translator),
      }),
    ).toEqual(expected);
  },
);
