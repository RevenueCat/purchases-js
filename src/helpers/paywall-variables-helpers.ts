import {
  type Offering,
  type Package,
  type Price,
  ProductType,
  type PurchaseOption,
  type SubscriptionOption,
} from "../entities/offerings";
import { type Period, PeriodUnit } from "./duration-helper";
import { type VariableDictionary } from "@revenuecat/purchases-ui-js";
import { type Translator } from "../ui/localization/translator";

import { LocalizationKeys } from "../ui/localization/supportedLanguages";

// Conversion constants for consistent pricing calculations
const WEEKS_PER_MONTH = 4.33; // More accurate: 52 weeks / 12 months
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;

// Helper function to get monthly equivalent price for any package
function getPackageMonthlyPrice(pkg: Package): number {
  const price = pkg.webBillingProduct.price;
  const product = getProductPerType(pkg);
  const period =
    pkg.webBillingProduct.period ||
    (product as SubscriptionOption)?.base?.period;

  if (!period || !period.number || period.number <= 0) {
    return price.amountMicros;
  }

  switch (period.unit) {
    case "year":
      return price.amountMicros / MONTHS_PER_YEAR;
    case "month":
      return price.amountMicros / period.number;
    case "week":
      return (price.amountMicros * WEEKS_PER_MONTH) / period.number;
    case "day":
      return (price.amountMicros * DAYS_PER_MONTH) / period.number;
    default:
      return price.amountMicros / (period.number || 1);
  }
}

function getProductPerType(pkg: Package): PurchaseOption | undefined | null {
  return pkg.webBillingProduct.defaultPurchaseOption;
}

function getPricePerPeriod(
  formattedPrice: string,
  product: SubscriptionOption,
  translator: Translator,
  full: boolean = false,
) {
  return translator.translate(LocalizationKeys.PaywallVariablesPricePerPeriod, {
    formattedPrice,
    period: product.base.period
      ? product.base.period.number === 1
        ? translator.translatePeriodUnit(product.base.period.unit, {
            noWhitespace: true,
            short: !full,
          })
        : translator.translatePeriod(
            product.base.period.number,
            product.base.period.unit,
            {
              noWhitespace: true,
              short: !full,
            },
          )
      : "",
  });
}

function getDurationInMonths(period: Period, translator: Translator) {
  if (period.unit === "year") {
    return translator.translatePeriod(period.number * 12, PeriodUnit.Month);
  }
  return translator.translatePeriod(period.number, period.unit);
}

function getPricePerWeek({
  price,
  period,
  translator,
}: {
  price: Price;
  period: Period | null;
  translator: Translator;
  full?: boolean;
}) {
  const fallback = translator.formatPrice(price.amountMicros, price.currency);

  if (!period) return fallback;

  if (period.unit === "year") {
    return translator.formatPrice(
      price.amountMicros / MONTHS_PER_YEAR / WEEKS_PER_MONTH,
      price.currency,
    );
  }
  if (period.unit === "month") {
    return translator.formatPrice(
      price.amountMicros / WEEKS_PER_MONTH / period.number,
      price.currency,
    );
  }
  if (period.unit === "week" && period.number > 1) {
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

export function getPricePerMonth({
  price,
  period,
  translator,
}: {
  price: Price;
  period: Period | null;
  translator: Translator;
  full?: boolean;
}) {
  // Check if price is valid
  if (!price || price.amountMicros === 0 || !price.currency) {
    return "N/A";
  }

  // If no period info, assume it's a monthly price
  if (!period || !period.number || period.number <= 0) {
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

export function parseOfferingIntoVariables(
  offering: Offering,
  translator: Translator,
): Record<string, VariableDictionary> {
  const packages = offering.availablePackages;

  const highestPricePackage = packages.reduce((prev, current) => {
    const prevMonthlyPrice = getPackageMonthlyPrice(prev);
    const currentMonthlyPrice = getPackageMonthlyPrice(current);
    return prevMonthlyPrice > currentMonthlyPrice ? prev : current;
  });

  return packages.reduce(
    (packagesById, pkg) => {
      packagesById[pkg.identifier] = parsePackageIntoVariables(
        pkg,
        highestPricePackage,
        translator,
      );
      return packagesById;
    },
    {} as Record<string, VariableDictionary>,
  );
}

function parsePackageIntoVariables(
  pkg: Package,
  highestPricePackage: Package,
  translator: Translator,
) {
  const webBillingProduct = pkg.webBillingProduct;
  const productPrice = webBillingProduct.price;
  const formattedPrice = translator.formatPrice(
    productPrice.amountMicros,
    productPrice.currency,
  );
  const product = getProductPerType(pkg);
  const productType = webBillingProduct.productType;

  const baseObject: VariableDictionary = {
    "product.store_product_name": webBillingProduct.title,
    "product.price": formattedPrice,
    "product.price_per_period": "",
    "product.price_per_period_abbreviated": "",
    "product.price_per_day": "",
    "product.price_per_week": "",
    "product.price_per_month": "",
    "product.price_per_year": "",
    "product.period": "",
    "product.period_abbreviated": "",
    "product.periodly": "",
    "product.period_in_days": "",
    "product.period_in_weeks": "",
    "product.period_in_months": "",
    "product.period_in_years": "",
    "product.period_with_unit": "",
    "product.currency_code": productPrice.currency,
    "product.currency_symbol": "",
    "product.offer_price": "",
    "product.offer_price_per_day": "",
    "product.offer_price_per_week": "",
    "product.offer_price_per_month": "",
    "product.offer_price_per_year": "",
    "product.offer_period": "",
    "product.offer_period_abbreviated": "",
    "product.offer_period_in_days": "",
    "product.offer_period_in_weeks": "",
    "product.offer_period_in_months": "",
    "product.offer_period_in_years": "",
    "product.offer_period_with_unit": "",
    "product.offer_end_date": "",
    "product.secondary_offer_price": "",
    "product.secondary_offer_period": "",
    "product.secondary_offer_period_abbreviated": "",
    "product.relative_discount": "",
  };
  if (productType === ProductType.Subscription && product) {
    // price per period (full and abbreviated)
    baseObject["product.price_per_period_abbreviated"] = getPricePerPeriod(
      formattedPrice,
      product as SubscriptionOption,
      translator,
    );
    baseObject["product.price_per_period"] = getPricePerPeriod(
      formattedPrice,
      product as SubscriptionOption,
      translator,
      true,
    );

    const basePeriod =
      webBillingProduct.period || (product as SubscriptionOption).base.period;

    // price per week/month
    baseObject["product.price_per_month"] = getPricePerMonth({
      price: productPrice,
      period: basePeriod,
      translator,
    });

    baseObject["product.price_per_week"] = getPricePerWeek({
      price: productPrice,
      period: basePeriod,
      translator,
    });

    // periods
    baseObject["product.period_with_unit"] =
      translator.translatePeriod(
        basePeriod?.number as number,
        basePeriod?.unit as PeriodUnit,
      ) || "";

    baseObject["product.period_in_months"] =
      getDurationInMonths(basePeriod as Period, translator) || "";

    baseObject["product.periodly"] =
      translator.translatePeriodFrequency(
        basePeriod?.number as number,
        basePeriod?.unit as PeriodUnit,
      ) || "";

    baseObject["product.period"] = basePeriod
      ? translator.translatePeriodUnit(basePeriod.unit as PeriodUnit, {
          noWhitespace: true,
        }) || ""
      : "";

    baseObject["product.period_abbreviated"] = basePeriod
      ? translator.translatePeriodUnit(basePeriod.unit as PeriodUnit, {
          noWhitespace: true,
          short: true,
        }) || ""
      : "";

    // Calculate discount based on monthly equivalent prices
    const packageMonthlyPrice = getPackageMonthlyPrice(pkg);
    const highestMonthlyPrice = getPackageMonthlyPrice(highestPricePackage);
    const discount =
      ((highestMonthlyPrice - packageMonthlyPrice) * 100) / highestMonthlyPrice;

    baseObject["product.relative_discount"] =
      discount < 1
        ? ""
        : translator.translate(
            LocalizationKeys.PaywallVariablesSubRelativeDiscount,
            {
              discount: discount.toFixed(0),
            },
          );
  }

  if (
    (productType === ProductType.NonConsumable ||
      productType === ProductType.Consumable) &&
    product
  ) {
    baseObject["product.price"] = formattedPrice;
    baseObject["product.price_per_period"] = formattedPrice;
    baseObject["product.price_per_period_abbreviated"] = formattedPrice;
    baseObject["product.price_per_month"] = formattedPrice;
    baseObject["product.period_with_unit"] = translator.translate(
      LocalizationKeys.PeriodsLifetime,
    );
    baseObject["product.period_in_months"] = translator.translate(
      LocalizationKeys.PeriodsLifetime,
    );
    baseObject["product.periodly"] = translator.translate(
      LocalizationKeys.PeriodsLifetime,
    );
    baseObject["product.price_per_week"] = "";
    baseObject["product.relative_discount"] = "";
    baseObject["product.period"] = "";
    baseObject["product.period_abbreviated"] = "";
  }

  return baseObject;
}
