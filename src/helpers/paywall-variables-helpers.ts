import { formatPrice, getFrequencyLabel, getLengthLabel } from "./price-labels";
import {
  type NonSubscriptionOption,
  type Offering,
  type Package,
  type Price,
  ProductType,
  type SubscriptionOption,
} from "../entities/offerings";
import type { Period } from "./duration-helper";
import { type VariableDictionary } from "@revenuecat/purchases-ui-js";

function getProductPerType(
  pkg: Package,
): SubscriptionOption | NonSubscriptionOption | undefined | null {
  const productType = pkg.rcBillingProduct.productType;
  switch (productType) {
    case ProductType.Subscription:
      return pkg.rcBillingProduct.defaultSubscriptionOption;
    case ProductType.Consumable || ProductType.NonConsumable:
      return pkg.rcBillingProduct.defaultNonSubscriptionOption;
  }
}

enum AbbreviatedPeriod {
  month = "mo",
  year = "yr",
  week = "wk",
  day = "d",
}

function getPricePerPeriod(
  formattedPrice: string,
  product: SubscriptionOption,
  full: boolean = false,
) {
  return `${formattedPrice}/${product.base.period?.number}${full ? (product.base.period as Period).unit : AbbreviatedPeriod[(product.base.period as Period).unit as keyof typeof AbbreviatedPeriod]}`;
}

function getDurationInMonths(period: Period) {
  if (period.unit === "week" || period.unit === "day") {
    return `${period.number} ${period.unit}`;
  }
  if (period.unit === "month") {
    return `${period.number > 1 ? period.number + "s" : period.number} ${period.unit}`;
  }
  if (period.unit === "year") {
    return `${period.number * 12} ${period.unit}`;
  }
}

function getPricePerWeek({
  price,
  period,
  selectedLocale,
}: {
  price: Price;
  period: Period | null;
  full?: boolean;
  selectedLocale: string;
}) {
  const fallback = formatPrice(
    price.amountMicros,
    price.currency,
    selectedLocale,
  );

  if (!period) return fallback;

  if (period.unit === "year") {
    return formatPrice(
      price.amountMicros / 12 / 4,
      price.currency,
      selectedLocale,
    );
  }
  if (period.unit === "month") {
    return formatPrice(
      price.amountMicros / period.number,
      price.currency,
      selectedLocale,
    );
  }
  if (period.unit === "week" && period.number > 1) {
    return formatPrice(
      price.amountMicros / period.number,
      price.currency,
      selectedLocale,
    );
  }
  if (period.unit === "day") {
    return formatPrice(
      (price.amountMicros * 7) / period.number,
      price.currency,
      selectedLocale,
    );
  }

  return fallback;
}

function getPricePerMonth({
  price,
  period,
  selectedLocale,
}: {
  price: Price;
  period: Period | null;
  full?: boolean;
  selectedLocale: string;
}) {
  const fallback = formatPrice(
    price.amountMicros,
    price.currency,
    selectedLocale,
  );
  if (!period || !period.number) return fallback;

  if (period.unit === "year") {
    return formatPrice(price.amountMicros / 12, price.currency, selectedLocale);
  }
  if (period.unit === "month" && period.number > 1) {
    return formatPrice(
      price.amountMicros / period.number,
      price.currency,
      selectedLocale,
    );
  }
  if (period.unit === "week") {
    return formatPrice(
      (price.amountMicros * 4) / period.number,
      price.currency,
      selectedLocale,
    );
  }
  if (period.unit === "day") {
    return formatPrice(
      (price.amountMicros * 30) / period.number,
      price.currency,
      selectedLocale,
    );
  }

  return fallback;
}

function getTotalPriceAndPerMonth({
  price,
  period,
  full = false,
  selectedLocale,
}: {
  price: Price;
  period: Period | null;
  full?: boolean;
  selectedLocale: string;
}) {
  if (!period || !period.number) return price.formattedPrice;
  let pricePerMonth = "";
  const monthPeriodString = full ? "month" : "mo";
  const periodString = full ? period.unit : AbbreviatedPeriod[period.unit];
  if (period.unit === "year") {
    pricePerMonth = formatPrice(
      price.amountMicros / 12,
      price.currency,
      selectedLocale,
    );
    return `${price.formattedPrice}/${period.number}${periodString}($${pricePerMonth}/(${monthPeriodString})`;
  }
  if (period.unit === "month") {
    pricePerMonth = formatPrice(
      price.amountMicros / period.number,
      price.currency,
      selectedLocale,
    );
    if (period.number > 1) {
      return `${price.formattedPrice}/${period.number}${periodString}(${pricePerMonth}/${monthPeriodString})`;
    } else {
      return `${price.formattedPrice}`;
    }
  }
  if (period.unit === "week") {
    pricePerMonth = formatPrice(
      (price.amountMicros * 4) / period.number,
      price.currency,
      selectedLocale,
    );
    return `${price.formattedPrice}/${period.number}${periodString}(${pricePerMonth}/${monthPeriodString})`;
  }
  if (period.unit === "day") {
    pricePerMonth = formatPrice(
      (price.amountMicros * 30) / period.number,
      price.currency,
      selectedLocale,
    );
    return `${price.formattedPrice}/${period.number}${periodString}(${pricePerMonth}/${monthPeriodString})`;
  }
  return price.formattedPrice;
}

export function parseOfferingIntoVariables(
  offering: Offering,
  selectedLocale: string,
): Record<string, VariableDictionary> {
  const packages = offering.availablePackages;

  const highestPricePackage = packages.reduce((prev, current) => {
    return prev.rcBillingProduct.currentPrice.amountMicros >
      current.rcBillingProduct.currentPrice.amountMicros
      ? prev
      : current;
  });

  const reducedPackages = packages.reduce(
    (packagesById, pkg) => {
      packagesById[pkg.identifier] = parsePackageIntoVariables(
        pkg,
        highestPricePackage,
        selectedLocale,
      );
      return packagesById;
    },
    {} as Record<string, VariableDictionary>,
  );
  return reducedPackages;
}

function parsePackageIntoVariables(
  pkg: Package,
  highestPricePackage: Package,
  selectedLocale: string,
) {
  const rcBillingProduct = pkg.rcBillingProduct;
  const formattedPrice = rcBillingProduct.currentPrice.formattedPrice;
  const product = getProductPerType(pkg);
  const productType = rcBillingProduct.productType;

  const baseObject: VariableDictionary = {
    product_name: rcBillingProduct.title,
    price: formattedPrice,
    price_per_period: "",
    price_per_period_full: "",
    total_price_and_per_month: "",
    total_price_and_per_month_full: "",
    sub_price_per_month: "",
    sub_price_per_week: "",
    sub_duration: "",
    sub_duration_in_months: "",
    sub_period: "",
    sub_period_length: "",
    sub_period_abbreviated: "",
    sub_offer_duration: undefined,
    sub_offer_duration_2: undefined, // doesn't apply - only google play
    sub_offer_price: undefined,
    sub_offer_price_2: undefined, // doesn't apply - only google play
    sub_relative_discount: "",
  };
  if (productType === ProductType.Subscription && product) {
    const pricePerPeriod = getPricePerPeriod(
      formattedPrice,
      product as SubscriptionOption,
    );
    baseObject.price_per_period = pricePerPeriod;
    baseObject.price_per_period_full = getPricePerPeriod(
      formattedPrice,
      product as SubscriptionOption,
      true,
    );

    baseObject.total_price_and_per_month = getTotalPriceAndPerMonth({
      price: rcBillingProduct.currentPrice,
      period: (product as SubscriptionOption).base.period,
      selectedLocale,
    });

    baseObject.total_price_and_per_month_full = getTotalPriceAndPerMonth({
      price: rcBillingProduct.currentPrice,
      period: (product as SubscriptionOption).base.period,
      full: true,
      selectedLocale,
    });

    baseObject.sub_price_per_month = getPricePerMonth({
      price: rcBillingProduct.currentPrice,
      period: (product as SubscriptionOption).base.period,
      selectedLocale,
    });

    baseObject.sub_price_per_week = getPricePerWeek({
      price: rcBillingProduct.currentPrice,
      period: (product as SubscriptionOption).base.period,
      selectedLocale,
    });

    baseObject.sub_duration = getLengthLabel(
      (product as SubscriptionOption).base.period as Period,
    );

    baseObject.sub_duration_in_months = getDurationInMonths(
      (product as SubscriptionOption).base.period as Period,
    );

    baseObject.sub_period = getFrequencyLabel(
      (product as SubscriptionOption).base.period as Period,
    );

    baseObject.sub_period_length = `${(product as SubscriptionOption).base.period?.unit}`;

    baseObject.sub_period_abbreviated = `${AbbreviatedPeriod[((product as SubscriptionOption).base.period as Period).unit]}`;

    const packagePrice = rcBillingProduct.currentPrice.amountMicros;
    const highestPrice =
      highestPricePackage.rcBillingProduct.currentPrice.amountMicros;
    const discount = (
      ((highestPrice - packagePrice) * 100) /
      highestPrice
    ).toFixed(0);

    baseObject.sub_relative_discount =
      packagePrice === highestPrice ? "" : `${discount}% off`;
  }

  if (
    (productType === ProductType.NonConsumable ||
      productType === ProductType.Consumable) &&
    product
  ) {
    baseObject.price = formattedPrice;
    baseObject.price_per_period = formattedPrice;
    baseObject.price_per_period_full = formattedPrice;
    baseObject.total_price_and_per_month = formattedPrice;
    baseObject.sub_price_per_month = formattedPrice;
    baseObject.sub_duration = "Lifetime";
    baseObject.sub_duration_in_months = "Lifetime";
    baseObject.sub_period = "Lifetime";
    baseObject.sub_price_per_week = undefined;
    baseObject.sub_relative_discount = undefined;
    baseObject.price_per_period_full = formattedPrice;
    baseObject.total_price_and_per_month_full = formattedPrice;
    baseObject.sub_period_length = undefined;
    baseObject.sub_period_abbreviated = undefined;
  }

  return baseObject;
}
