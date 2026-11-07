import { expect, test } from "vitest";
import { Translator } from "../../ui/localization/translator";
import { LocalizationKeys } from "../../ui/localization/supportedLanguages";
import { PeriodUnit } from "../../helpers/duration-helper";

test.each([
  [
    LocalizationKeys.ProductInfoIntroPricePhase,
    3,
    PeriodUnit.Day,
    "最初の3日は¥100",
  ],
  [
    LocalizationKeys.ProductInfoIntroPricePhase,
    1,
    PeriodUnit.Week,
    "最初の1週間は¥100",
  ],
  [
    LocalizationKeys.ProductInfoIntroPricePhase,
    2,
    PeriodUnit.Week,
    "最初の2週間は¥100",
  ],
  [
    LocalizationKeys.ProductInfoIntroPricePhase,
    1,
    PeriodUnit.Month,
    "最初の1ヶ月は¥100",
  ],
  [
    LocalizationKeys.ProductInfoIntroPricePhase,
    1,
    PeriodUnit.Year,
    "最初の1年は¥100",
  ],
  [
    LocalizationKeys.ProductInfoIntroPricePhaseAfterTrial,
    1,
    PeriodUnit.Week,
    "その後、1週間は¥100",
  ],
  [
    LocalizationKeys.ProductInfoIntroPricePhaseAfterTrial,
    3,
    PeriodUnit.Month,
    "その後、3ヶ月は¥100",
  ],
])(
  "ja intro price heading %s for %i %s shows the unit once",
  (key, amount, unit, expected) => {
    const translator = new Translator({}, "ja", "en");
    expect(
      translator.translate(key, {
        introPriceDuration: translator.translatePeriod(amount, unit),
        introPrice: "¥100",
      }),
    ).toEqual(expected);
  },
);
