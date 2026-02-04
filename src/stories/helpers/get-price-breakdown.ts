import {
  type NonSubscriptionOption,
  type SubscriptionOption,
} from "../../entities/offerings";

import { type PriceBreakdown } from "../../ui/ui-types";

const getPriceFromOption = (
  option: SubscriptionOption | NonSubscriptionOption,
) => {
  return (
    (option as SubscriptionOption).introPrice?.price?.amountMicros ??
    (option as SubscriptionOption).base?.price?.amountMicros ??
    (option as NonSubscriptionOption).basePrice?.amountMicros ??
    0
  );
};

export const getPriceBreakdownTaxDisabled = (
  option: SubscriptionOption | NonSubscriptionOption,
): PriceBreakdown => {
  const price = getPriceFromOption(option);
  return {
    currency: "USD",
    totalAmountInMicros: price,
    totalExcludingTaxInMicros: price,
    taxCalculationStatus: "unavailable",
    taxAmountInMicros: 0,
    taxBreakdown: null,
  };
};

export const getPriceBreakdownTaxInclusive = (
  option: SubscriptionOption | NonSubscriptionOption,
): PriceBreakdown => {
  const price = getPriceFromOption(option);
  const totalExcludingTaxInMicros = Math.round(price / 1.21);
  const taxAmountInMicros = price - totalExcludingTaxInMicros;
  return {
    currency: "USD",
    totalAmountInMicros: price,
    totalExcludingTaxInMicros: totalExcludingTaxInMicros,
    taxAmountInMicros: taxAmountInMicros,
    taxCalculationStatus: "calculated",
    taxBreakdown: [
      {
        tax_amount_in_micros: taxAmountInMicros,
        display_name: "VAT - Spain (21%)",
      },
    ],
  };
};

export const getPriceBreakdownTaxExclusive = (
  option: SubscriptionOption,
): PriceBreakdown => {
  const price = getPriceFromOption(option);
  const taxAmountInMicros = Math.round(price * 0.07);
  return {
    currency: "USD",
    totalAmountInMicros: price + taxAmountInMicros,
    totalExcludingTaxInMicros: price,
    taxAmountInMicros: taxAmountInMicros,
    taxCalculationStatus: "calculated",
    taxBreakdown: [
      {
        tax_amount_in_micros: taxAmountInMicros,
        display_name: "Tax Rate - NY (7%)",
      },
    ],
  };
};
