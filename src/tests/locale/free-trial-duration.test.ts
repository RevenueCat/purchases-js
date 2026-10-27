// src/tests/locale/free-trial-duration.test.ts
import { expect, test } from "vitest";
import { getTranslatedPeriodLength } from "../../helpers/price-labels";
import { Translator } from "../../ui/localization/translator";
import { LocalizationKeys } from "../../ui/localization/supportedLanguages";

test.each([
  ["ja", "P1W", "1週間無料トライアル"],
  ["ko", "P7D", "7일 무료 체험"],
  ["pl", "P1W", "Bezpłatny okres próbny: 1 tydzień"],
  ["pl", "P2W", "Bezpłatny okres próbny: 2 tygodnie"],
  ["pl", "P3W", "Bezpłatny okres próbny: 3 tygodnie"],
  ["pl", "P4W", "Bezpłatny okres próbny: 4 tygodnie"],
  ["pl", "P5W", "Bezpłatny okres próbny: 5 tygodni"],
  ["pl", "P12W", "Bezpłatny okres próbny: 12 tygodni"],
  ["pl", "P14W", "Bezpłatny okres próbny: 14 tygodni"],
  ["pl", "P21W", "Bezpłatny okres próbny: 21 tygodni"],
  ["pl", "P22W", "Bezpłatny okres próbny: 22 tygodnie"],
  ["pl", "P23W", "Bezpłatny okres próbny: 23 tygodnie"],
  ["pl", "P24W", "Bezpłatny okres próbny: 24 tygodnie"],
  ["pl", "P25W", "Bezpłatny okres próbny: 25 tygodni"],
  ["pl-PL", "P2M", "Bezpłatny okres próbny: 2 miesiące"],
  ["pl_PL", "P2Y", "Bezpłatny okres próbny: 2 lata"],
  ["pl", "P5M", "Bezpłatny okres próbny: 5 miesięcy"],
  ["pl", "P5Y", "Bezpłatny okres próbny: 5 lat"],
  ["zh_Hans", "P1W", "1 周免费试用"],
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
