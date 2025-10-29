import type { VariableDictionary } from "@revenuecat/purchases-ui-js";
import { type Price } from "../entities/offerings";
import { type Translator } from "../ui/localization/translator";
import { type Period } from "./duration-helper";
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

  if (period.unit === "year") {
    return translator.formatPrice(
      price.amountMicros / DAYS_PER_YEAR / period.number,
      price.currency,
    );
  }
  if (period.unit === "month") {
    return translator.formatPrice(
      price.amountMicros / DAYS_PER_MONTH / period.number,
      price.currency,
    );
  }
  if (period.unit === "week") {
    return translator.formatPrice(
      price.amountMicros / DAYS_PER_WEEK / period.number,
      price.currency,
    );
  }
  if (period.unit === "day") {
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

  if (period.unit === "year") {
    return translator.formatPrice(
      price.amountMicros / WEEKS_PER_YEAR / period.number,
      price.currency,
    );
  }
  if (period.unit === "month") {
    return translator.formatPrice(
      price.amountMicros / WEEKS_PER_MONTH / period.number,
      price.currency,
    );
  }
  if (period.unit === "week") {
    return translator.formatPrice(
      price.amountMicros / period.number,
      price.currency,
    );
  }
  if (period.unit === "day") {
    return translator.formatPrice(
      (price.amountMicros * 7) / period.number,
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

  if (period.unit === "year") {
    return translator.formatPrice(
      price.amountMicros / MONTHS_PER_YEAR,
      price.currency,
    );
  }
  if (period.unit === "month") {
    return translator.formatPrice(
      price.amountMicros / period.number,
      price.currency,
    );
  }
  if (period.unit === "week") {
    return translator.formatPrice(
      (price.amountMicros * WEEKS_PER_MONTH) / period.number,
      price.currency,
    );
  }
  if (period.unit === "day") {
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

  if (period.unit === "year") {
    return translator.formatPrice(
      price.amountMicros / period.number,
      price.currency,
    );
  }
  if (period.unit === "month") {
    return translator.formatPrice(
      (price.amountMicros * MONTHS_PER_YEAR) / period.number,
      price.currency,
    );
  }
  if (period.unit === "week") {
    return translator.formatPrice(
      (price.amountMicros * WEEKS_PER_YEAR) / period.number,
      price.currency,
    );
  }
  if (period.unit === "day") {
    return translator.formatPrice(
      (price.amountMicros * DAYS_PER_YEAR) / period.number,
      price.currency,
    );
  }

  return fallback;
}

export function setPriceVariables(
  price: Price,
  period: Period | null,
  translator: Translator,
  variables: VariableDictionary,
) {
  variables["product.price_per_day"] = getPricePeDay(price, period, translator);
  variables["product.price_per_week"] = getPricePerWeek(
    price,
    period,
    translator,
  );
  variables["product.price_per_month"] = getPricePerMonth(
    price,
    period,
    translator,
  );
  variables["product.price_per_year"] = getPricePerYear(
    price,
    period,
    translator,
  );
}
