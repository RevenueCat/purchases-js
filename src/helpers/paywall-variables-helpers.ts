import {
  type NonSubscriptionOption,
  type Offering,
  type Package,
  type Price,
  ProductType,
  type SubscriptionOption,
} from "../entities/offerings";
import type { Period } from "./duration-helper";

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

type VariableDictionary = {
  product_name: string | number | undefined;
  price: string | number | undefined;
  price_per_period: string | number | undefined;
  price_per_period_full: string | number | undefined;
  total_price_and_per_month: string | number | undefined;
  total_price_and_per_month_full: string | number | undefined;
  sub_price_per_month: string | number | undefined;
  sub_price_per_week: string | number | undefined;
  sub_duration: string | number | undefined;
  sub_duration_in_months: string | number | undefined;
  sub_period: string | number | undefined;
  sub_period_length: string | number | undefined;
  sub_period_abbreviated: string | number | undefined;
  sub_offer_duration: undefined;
  sub_offer_duration_2: undefined;
  sub_offer_price: undefined;
  sub_offer_price_2: undefined;
  sub_relative_discount: string | number | undefined;
  [key: string]: string | number | undefined;
};

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
}: {
  price: Price;
  period: Period | null;
  full?: boolean;
}) {
  const fallback = (price.amountMicros / 1000000).toFixed(2);
  if (!period) return fallback;

  if (period.unit === "year") {
    return (price.amountMicros / 1000000 / 12 / 4).toFixed(2);
  }
  if (period.unit === "month") {
    return (price.amountMicros / 1000000 / period.number).toFixed(2);
  }
  if (period.unit === "week" && period.number > 1) {
    return (price.amountMicros / 1000000 / period.number).toFixed(2);
  }
  if (period.unit === "day") {
    return (((price.amountMicros / 1000000) * 7) / period.number).toFixed(2);
  }

  return fallback;
}

function getPricePerMonth({
  price,
  period,
}: {
  price: Price;
  period: Period | null;
  full?: boolean;
}) {
  const fallback = (price.amountMicros / 1000000).toFixed(2);
  if (!period) return fallback;

  if (period.unit === "year") {
    return (price.amountMicros / 1000000 / 12).toFixed(2);
  }
  if (period.unit === "month" && period.number > 1) {
    return (price.amountMicros / 1000000 / period.number).toFixed(2);
  }
  if (period.unit === "week") {
    return (((price.amountMicros / 1000000) * 4) / period.number).toFixed(2);
  }
  if (period.unit === "day") {
    return (((price.amountMicros / 1000000) * 30) / period.number).toFixed(2);
  }

  return fallback;
}

function getTotalPriceAndPerMonth({
  price,
  period,
  full = false,
}: {
  price: Price;
  period: Period | null;
  full?: boolean;
}) {
  // TODO: Format per locale/currency
  if (!period) return price.formattedPrice;
  let pricePerMonth = "";
  const periodString = full ? "month" : "mo";
  if (period.unit === "year") {
    pricePerMonth = (price.amountMicros / 1000000 / 12).toFixed(2);
    return `($${pricePerMonth}/${periodString})`;
  }
  if (period.unit === "month" && period.number > 1) {
    pricePerMonth = (price.amountMicros / 1000000 / period.number).toFixed(2);
    return `($${pricePerMonth}/${periodString})`;
  }
  if (period.unit === "week") {
    pricePerMonth = (
      ((price.amountMicros / 1000000) * 4) /
      period.number
    ).toFixed(2);
    return `($${pricePerMonth}/${periodString})`;
  }
  if (period.unit === "day") {
    pricePerMonth = (
      ((price.amountMicros / 1000000) * 30) /
      period.number
    ).toFixed(2);
    return `($${pricePerMonth}/${periodString})`;
  }

  return price.formattedPrice;
}

export function parseOfferingIntoVariables(
  offering: Offering,
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
      );
      return packagesById;
    },
    {} as Record<string, VariableDictionary>,
  );
  return reducedPackages;
}

function parsePackageIntoVariables(pkg: Package, highestPricePackage: Package) {
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
    });

    baseObject.total_price_and_per_month_full = getTotalPriceAndPerMonth({
      price: rcBillingProduct.currentPrice,
      period: (product as SubscriptionOption).base.period,
      full: true,
    });

    baseObject.sub_price_per_month = getPricePerMonth({
      price: rcBillingProduct.currentPrice,
      period: (product as SubscriptionOption).base.period,
    });

    baseObject.sub_price_per_week = getPricePerWeek({
      price: rcBillingProduct.currentPrice,
      period: (product as SubscriptionOption).base.period,
    });

    baseObject.sub_duration = `${(product as SubscriptionOption).base.period?.number} ${(product as SubscriptionOption).base.period?.unit}`;

    baseObject.sub_duration_in_months = getDurationInMonths(
      (product as SubscriptionOption).base.period as Period,
    );

    baseObject.sub_period = `${(product as SubscriptionOption).base.period?.unit.toUpperCase()}ly`;

    baseObject.sub_period_length = `${(product as SubscriptionOption).base.period?.unit}`;

    baseObject.sub_period_abbreviated = `${AbbreviatedPeriod[((product as SubscriptionOption).base.period as Period).unit]}`;

    const discount =
      ((highestPricePackage.rcBillingProduct.currentPrice.amountMicros -
        rcBillingProduct.currentPrice.amountMicros) /
        highestPricePackage.rcBillingProduct.currentPrice.amountMicros) *
      100;

    baseObject.sub_relative_discount =
      rcBillingProduct.currentPrice.amountMicros ===
      highestPricePackage.rcBillingProduct.currentPrice.amountMicros
        ? ""
        : `${discount.toFixed(0)}% off`;
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
