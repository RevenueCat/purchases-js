import { type Price } from "../entities/offerings";
import { type Translator } from "../ui/localization/translator";
import { type Period } from "./duration-helper";
import { getPricePerPeriodFactors } from "./price-conversion-helper";
import { floorMicrosToCurrencyUnit } from "./price-labels";

function formatFlooredPrice(
  micros: number,
  currency: string,
  translator: Translator,
): string {
  return translator.formatPrice(
    floorMicrosToCurrencyUnit(micros, currency),
    currency,
  );
}

interface PriceVariables {
  pricePerDay: string;
  pricePerWeek: string;
  pricePerMonth: string;
  pricePerYear: string;
}

export function getPriceVariables(
  price: Price,
  period: Period | null,
  translator: Translator,
): PriceVariables {
  if (period === null) {
    const priceString = translator.formatPrice(
      price.amountMicros,
      price.currency,
    );
    return {
      pricePerDay: priceString,
      pricePerWeek: priceString,
      pricePerMonth: priceString,
      pricePerYear: priceString,
    };
  }

  const priceFactors = getPricePerPeriodFactors(period);
  return {
    pricePerDay: formatFlooredPrice(
      price.amountMicros * priceFactors.perDay,
      price.currency,
      translator,
    ),
    pricePerWeek: formatFlooredPrice(
      price.amountMicros * priceFactors.perWeek,
      price.currency,
      translator,
    ),
    pricePerMonth: formatFlooredPrice(
      price.amountMicros * priceFactors.perMonth,
      price.currency,
      translator,
    ),
    pricePerYear: formatFlooredPrice(
      price.amountMicros * priceFactors.perYear,
      price.currency,
      translator,
    ),
  };
}
