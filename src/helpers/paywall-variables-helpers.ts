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
) {
  return translator.translate(LocalizationKeys.PaywallVariablesPricePerPeriod, {
    formattedPrice,
    period: product.base.period
      ? product.base.period.number === 1
        ? translator.translatePeriodUnit(product.base.period.unit, {
            noWhitespace: true,
          })
        : translator.translatePeriod(
            product.base.period.number,
            product.base.period.unit,
            {
              noWhitespace: true,
              short: false,
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
      (price.amountMicros * WEEKS_PER_MONTH) / period.number,
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

function getTotalPriceAndPerMonth({
  price,
  period,
  full = false,
  translator,
}: {
  price: Price;
  period: Period | null;
  full?: boolean;
  translator: Translator;
}) {
  if (!period || !period.number)
    return translator.formatPrice(price.amountMicros, price.currency);

  if (period.unit === PeriodUnit.Month && period.number == 1) {
    return translator.formatPrice(price.amountMicros, price.currency);
  }

  let pricePerMonth: string | undefined = "";

  switch (period.unit) {
    case PeriodUnit.Year:
      pricePerMonth = translator.formatPrice(
        price.amountMicros / MONTHS_PER_YEAR,
        price.currency,
      );
      break;

    case PeriodUnit.Month:
      pricePerMonth = translator.formatPrice(
        price.amountMicros / period.number,
        price.currency,
      );
      break;

    case PeriodUnit.Week:
      pricePerMonth = translator.formatPrice(
        (price.amountMicros * WEEKS_PER_MONTH) / period.number,
        price.currency,
      );
      break;

    case PeriodUnit.Day:
      pricePerMonth = translator.formatPrice(
        (price.amountMicros * DAYS_PER_MONTH) / period.number,
        price.currency,
      );
      break;
  }

  return translator.translate(
    LocalizationKeys.PaywallVariablesTotalPriceAndPerMonth,
    {
      formattedPrice: translator.formatPrice(
        price.amountMicros,
        price.currency,
      ),
      period: translator.translatePeriod(period.number, period.unit, {
        noWhitespace: true,
        short: !full,
      }),
      formattedPricePerMonth: pricePerMonth,
      monthPeriod: translator.translatePeriodUnit(PeriodUnit.Month, {
        noWhitespace: true,
        short: !full,
      }),
    },
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
    product_name: webBillingProduct.title,
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
    relative_discount: "",
    periodly: "",
    price_per_month: "",
  };
  if (productType === ProductType.Subscription && product) {
    baseObject.price_per_period = getPricePerPeriod(
      formattedPrice,
      product as SubscriptionOption,
      translator,
    );
    baseObject.price_per_period_full = baseObject.price_per_period;

    const basePeriod =
      webBillingProduct.period || (product as SubscriptionOption).base.period;

    baseObject.total_price_and_per_month = getTotalPriceAndPerMonth({
      price: productPrice,
      period: basePeriod,
      translator,
    });

    baseObject.total_price_and_per_month_full = getTotalPriceAndPerMonth({
      price: productPrice,
      period: basePeriod,
      full: true,
      translator,
    });

    baseObject.sub_price_per_month = getPricePerMonth({
      price: productPrice,
      period: basePeriod,
      translator,
    });
    baseObject.price_per_month = baseObject.sub_price_per_month;

    baseObject.sub_price_per_week = getPricePerWeek({
      price: productPrice,
      period: basePeriod,
      translator,
    });

    baseObject.sub_duration = translator.translatePeriod(
      basePeriod?.number as number,
      basePeriod?.unit as PeriodUnit,
    );

    baseObject.sub_duration_in_months = getDurationInMonths(
      basePeriod as Period,
      translator,
    );

    baseObject.sub_period = translator.translatePeriodFrequency(
      basePeriod?.number as number,
      basePeriod?.unit as PeriodUnit,
    );

    baseObject.sub_period_length = basePeriod
      ? translator.translatePeriodUnit(basePeriod.unit as PeriodUnit, {
          noWhitespace: true,
        })
      : undefined;

    baseObject.sub_period_abbreviated = basePeriod
      ? translator.translatePeriodUnit(basePeriod.unit as PeriodUnit, {
          noWhitespace: true,
          short: true,
        })
      : undefined;

    // Calculate discount based on monthly equivalent prices
    const packageMonthlyPrice = getPackageMonthlyPrice(pkg);
    const highestMonthlyPrice = getPackageMonthlyPrice(highestPricePackage);
    const discount = (
      ((highestMonthlyPrice - packageMonthlyPrice) * 100) /
      highestMonthlyPrice
    ).toFixed(0);

    baseObject.sub_relative_discount =
      packageMonthlyPrice === highestMonthlyPrice
        ? ""
        : translator.translate(
            LocalizationKeys.PaywallVariablesSubRelativeDiscount,
            {
              discount: discount,
            },
          );
    baseObject.relative_discount = baseObject.sub_relative_discount;

    // Set periodly based on period unit
    if (basePeriod) {
      switch (basePeriod.unit) {
        case PeriodUnit.Year:
          baseObject.periodly = "Yearly";
          break;
        case PeriodUnit.Month:
          baseObject.periodly = "Monthly";
          break;
        case PeriodUnit.Week:
          baseObject.periodly = "Weekly";
          break;
        case PeriodUnit.Day:
          baseObject.periodly = "Daily";
          break;
        default:
          baseObject.periodly = "";
      }
    }
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
    baseObject.sub_duration = translator.translate(
      LocalizationKeys.PeriodsLifetime,
    );
    baseObject.sub_duration_in_months = translator.translate(
      LocalizationKeys.PeriodsLifetime,
    );
    baseObject.sub_period = translator.translate(
      LocalizationKeys.PeriodsLifetime,
    );
    baseObject.sub_price_per_week = undefined;
    baseObject.sub_relative_discount = undefined;
    baseObject.price_per_period_full = formattedPrice;
    baseObject.total_price_and_per_month_full = formattedPrice;
    baseObject.sub_period_length = undefined;
    baseObject.sub_period_abbreviated = undefined;
  }

  return { ...baseObject, product: baseObject };
}
