import { type Price } from "../entities/offerings";
import { type Translator } from "../ui/localization/translator";
import { PeriodUnit, type Period } from "./duration-helper";
import {
  DAYS_PER_MONTH,
  DAYS_PER_WEEK,
  DAYS_PER_YEAR,
  MONTHS_PER_YEAR,
  WEEKS_PER_MONTH,
  WEEKS_PER_YEAR,
} from "./paywall-period-helpers";

function getPricePeDay(
  price: Price,
  period: Period | null,
  translator: Translator,
) {
  const fallback = translator.formatPrice(price.amountMicros, price.currency);

  if (!period) {
    return fallback;
  }

  if (period.unit === PeriodUnit.Year) {
    return translator.formatPrice(
      price.amountMicros / DAYS_PER_YEAR / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Month) {
    return translator.formatPrice(
      price.amountMicros / DAYS_PER_MONTH / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Week) {
    return translator.formatPrice(
      price.amountMicros / DAYS_PER_WEEK / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Day) {
    return translator.formatPrice(
      price.amountMicros / period.number,
      price.currency,
    );
  }

  return fallback;
}

function getPricePerWeek(
  price: Price,
  period: Period | null,
  translator: Translator,
) {
  const fallback = translator.formatPrice(price.amountMicros, price.currency);

  if (!period) {
    return fallback;
  }

  if (period.unit === PeriodUnit.Year) {
    return translator.formatPrice(
      price.amountMicros / WEEKS_PER_YEAR / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Month) {
    return translator.formatPrice(
      price.amountMicros / WEEKS_PER_MONTH / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Week) {
    return translator.formatPrice(
      price.amountMicros / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Day) {
    return translator.formatPrice(
      (price.amountMicros * DAYS_PER_WEEK) / period.number,
      price.currency,
    );
  }

  return fallback;
}

function getPricePerMonth(
  price: Price,
  period: Period | null,
  translator: Translator,
) {
  if (!period) {
    return translator.formatPrice(price.amountMicros, price.currency);
  }

  if (period.unit === PeriodUnit.Year) {
    return translator.formatPrice(
      price.amountMicros / MONTHS_PER_YEAR,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Month) {
    return translator.formatPrice(
      price.amountMicros / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Week) {
    return translator.formatPrice(
      (price.amountMicros * WEEKS_PER_MONTH) / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Day) {
    return translator.formatPrice(
      (price.amountMicros * DAYS_PER_MONTH) / period.number,
      price.currency,
    );
  }

  // Fallback: treat as monthly if unit is unrecognized
  return translator.formatPrice(
    price.amountMicros / (period.number || 1),
    price.currency,
  );
}

function getPricePerYear(
  price: Price,
  period: Period | null,
  translator: Translator,
) {
  const fallback = translator.formatPrice(price.amountMicros, price.currency);

  if (!period) {
    return fallback;
  }

  if (period.unit === PeriodUnit.Year) {
    return translator.formatPrice(
      price.amountMicros / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Month) {
    return translator.formatPrice(
      (price.amountMicros * MONTHS_PER_YEAR) / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Week) {
    return translator.formatPrice(
      (price.amountMicros * WEEKS_PER_YEAR) / period.number,
      price.currency,
    );
  }
  if (period.unit === PeriodUnit.Day) {
    return translator.formatPrice(
      (price.amountMicros * DAYS_PER_YEAR) / period.number,
      price.currency,
    );
  }

  return fallback;
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
  return {
    pricePerDay: getPricePeDay(price, period, translator),
    pricePerWeek: getPricePerWeek(price, period, translator),
    pricePerMonth: getPricePerMonth(price, period, translator),
    pricePerYear: getPricePerYear(price, period, translator),
  };
}
