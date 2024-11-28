import {
  type Offering,
  type Package,
  type Price,
  ProductType,
  type PurchaseOption,
  type SubscriptionOption,
} from "../entities/offerings";
import { Period, PeriodUnit } from "./duration-helper";
import { type VariableDictionary } from "@revenuecat/purchases-ui-js";
import { Translator } from "../ui/localization/translator";

function getProductPerType(pkg: Package): PurchaseOption | undefined | null {
  return pkg.rcBillingProduct.defaultPurchaseOption;
}

function getPricePerPeriod(
  formattedPrice: string,
  product: SubscriptionOption,
  translator: Translator,
  full: boolean = false,
) {
  return translator.translate(`paywall_variables.price_per_period`, {
    formattedPrice,
    period: product.base.period
      ? translator.translatePeriod(
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
    return translator.formatPrice(price.amountMicros / 12 / 4, price.currency);
  }
  if (period.unit === "month") {
    return translator.formatPrice(
      price.amountMicros / period.number,
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

function getPricePerMonth({
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
  if (!period || !period.number) return fallback;

  if (period.unit === "year") {
    return translator.formatPrice(price.amountMicros / 12, price.currency);
  }
  if (period.unit === "month" && period.number > 1) {
    return translator.formatPrice(
      price.amountMicros / period.number,
      price.currency,
    );
  }
  if (period.unit === "week") {
    return translator.formatPrice(
      (price.amountMicros * 4) / period.number,
      price.currency,
    );
  }
  if (period.unit === "day") {
    return translator.formatPrice(
      (price.amountMicros * 30) / period.number,
      price.currency,
    );
  }

  return fallback;
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
  if (!period || !period.number) return price.formattedPrice;
  let pricePerMonth: string | undefined = "";

  if (period.unit === "year") {
    pricePerMonth = translator.formatPrice(
      price.amountMicros / 12,
      price.currency,
    );
  }

  if (period.unit === "month") {
    pricePerMonth = translator.formatPrice(
      price.amountMicros / period.number,
      price.currency,
    );

    if (period.number === 1) {
      return price.formattedPrice;
    }
  }

  if (period.unit === "week") {
    pricePerMonth = translator.formatPrice(
      (price.amountMicros * 4) / period.number,
      price.currency,
    );
  }

  if (period.unit === "day") {
    pricePerMonth = translator.formatPrice(
      (price.amountMicros * 30) / period.number,
      price.currency,
    );
  }

  return translator.translate("paywall_variables.total_price_and_per_month", {
    formattedPrice: price.formattedPrice,
    period: translator.translatePeriod(period.number, period.unit, {
      noWhitespace: true,
      short: !full,
    }),
    formattedPricePerMonth: pricePerMonth,
    monthPeriod: translator.translatePeriodUnit(PeriodUnit.Month, {
      noWhitespace: true,
      short: !full,
    }),
  });
}

export function parseOfferingIntoVariables(
  offering: Offering,
  selectedLocale: string,
  defaultLocale?: string,
): Record<string, VariableDictionary> {
  const packages = offering.availablePackages;
  const translator = new Translator({}, selectedLocale, defaultLocale);
  const highestPricePackage = packages.reduce((prev, current) => {
    return prev.rcBillingProduct.currentPrice.amountMicros >
      current.rcBillingProduct.currentPrice.amountMicros
      ? prev
      : current;
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
    baseObject.price_per_period = getPricePerPeriod(
      formattedPrice,
      product as SubscriptionOption,
      translator,
    );
    baseObject.price_per_period_full = getPricePerPeriod(
      formattedPrice,
      product as SubscriptionOption,
      translator,
      true,
    );

    const basePeriod = (product as SubscriptionOption).base.period;

    baseObject.total_price_and_per_month = getTotalPriceAndPerMonth({
      price: rcBillingProduct.currentPrice,
      period: basePeriod,
      translator,
    });

    baseObject.total_price_and_per_month_full = getTotalPriceAndPerMonth({
      price: rcBillingProduct.currentPrice,
      period: basePeriod,
      full: true,
      translator,
    });

    baseObject.sub_price_per_month = getPricePerMonth({
      price: rcBillingProduct.currentPrice,
      period: basePeriod,
      translator,
    });

    baseObject.sub_price_per_week = getPricePerWeek({
      price: rcBillingProduct.currentPrice,
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

    const packagePrice = rcBillingProduct.currentPrice.amountMicros;
    const highestPrice =
      highestPricePackage.rcBillingProduct.currentPrice.amountMicros;
    const discount = (
      ((highestPrice - packagePrice) * 100) /
      highestPrice
    ).toFixed(0);

    baseObject.sub_relative_discount =
      packagePrice === highestPrice
        ? ""
        : translator.translate("paywall_variables.sub_relative_discount", {
            discount: discount,
          });
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
    baseObject.sub_duration = translator.translate("periods.lifetime");
    baseObject.sub_duration_in_months =
      translator.translate("periods.lifetime");
    baseObject.sub_period = translator.translate("periods.lifetime");
    baseObject.sub_price_per_week = undefined;
    baseObject.sub_relative_discount = undefined;
    baseObject.price_per_period_full = formattedPrice;
    baseObject.total_price_and_per_month_full = formattedPrice;
    baseObject.sub_period_length = undefined;
    baseObject.sub_period_abbreviated = undefined;
  }

  return baseObject;
}
