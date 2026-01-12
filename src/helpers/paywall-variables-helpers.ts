import { type VariableDictionary } from "@revenuecat/purchases-ui-js";
import {
  type Offering,
  type Package,
  ProductType,
  type PurchaseOption,
  type SubscriptionOption,
} from "../entities/offerings";
import {
  Translator,
  type CustomTranslations,
} from "../ui/localization/translator";
import { PeriodUnit } from "./duration-helper";

import { LocalizationKeys } from "../ui/localization/supportedLanguages";
import {
  DAYS_PER_MONTH,
  getPeriodVariables,
  MONTHS_PER_YEAR,
  WEEKS_PER_MONTH,
} from "./paywall-period-helpers";
import { getPriceVariables } from "./paywall-price-helpers";
import { setOfferVariables } from "./paywall-offer-helpers";
import { englishLocale } from "../ui/localization/constants";

export interface BuildVariablesPerPackageOptions {
  selectedLocale?: string;
  fallbackLocale?: string;
  customTranslations?: CustomTranslations;
  translator?: Translator;
}

export function buildVariablesPerPackage(
  offering: Offering,
  options: BuildVariablesPerPackageOptions = {},
): Record<string, VariableDictionary> {
  if (options.translator) {
    return parseOfferingIntoVariables(offering, options.translator);
  }

  const defaultLocale =
    offering.paywallComponents?.default_locale || englishLocale;
  const translator = new Translator(
    options.customTranslations ?? {},
    options.selectedLocale ?? defaultLocale,
    options.fallbackLocale ?? defaultLocale,
  );

  return parseOfferingIntoVariables(offering, translator);
}

// Helper function to get monthly equivalent price for any package
function getPackageMonthlyPrice(pkg: Package): number {
  const price = pkg.webBillingProduct.price;
  const purchaseOption = getDefaultPurchaseOption(pkg);
  const period =
    pkg.webBillingProduct.period ||
    (purchaseOption as SubscriptionOption)?.base?.period;

  if (!period || !period.number || period.number <= 0) {
    return price.amountMicros;
  }

  switch (period.unit) {
    case PeriodUnit.Year:
      return price.amountMicros / MONTHS_PER_YEAR;
    case PeriodUnit.Month:
      return price.amountMicros / period.number;
    case PeriodUnit.Week:
      return (price.amountMicros * WEEKS_PER_MONTH) / period.number;
    case PeriodUnit.Day:
      return (price.amountMicros * DAYS_PER_MONTH) / period.number;
    default:
      return price.amountMicros / (period.number || 1);
  }
}

function getDefaultPurchaseOption(
  pkg: Package,
): PurchaseOption | undefined | null {
  if (pkg.webBillingProduct.productType === ProductType.Subscription) {
    return pkg.webBillingProduct.defaultSubscriptionOption;
  }
  return pkg.webBillingProduct.defaultPurchaseOption;
}

function productIsSubscription(
  productType: ProductType,
  product: PurchaseOption | undefined | null,
): product is SubscriptionOption {
  return productType === ProductType.Subscription && product != null;
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
  const purchaseOption = getDefaultPurchaseOption(pkg);
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
    "product.currency_symbol": translator
      .formatPrice(0, productPrice.currency)
      .replace("0", ""),
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

  if (productIsSubscription(productType, purchaseOption)) {
    // price per period (full and abbreviated)
    baseObject["product.price_per_period_abbreviated"] = getPricePerPeriod(
      formattedPrice,
      purchaseOption,
      translator,
    );
    baseObject["product.price_per_period"] = getPricePerPeriod(
      formattedPrice,
      purchaseOption,
      translator,
      true,
    );

    const basePeriod = webBillingProduct.period || purchaseOption.base.period;

    const priceVariables = getPriceVariables(
      productPrice,
      basePeriod,
      translator,
    );
    baseObject["product.price_per_day"] = priceVariables.pricePerDay;
    baseObject["product.price_per_week"] = priceVariables.pricePerWeek;
    baseObject["product.price_per_month"] = priceVariables.pricePerMonth;
    baseObject["product.price_per_year"] = priceVariables.pricePerYear;

    // periods
    if (basePeriod) {
      const periodVars = getPeriodVariables(basePeriod, translator);
      baseObject["product.period"] = periodVars.period;
      baseObject["product.period_abbreviated"] = periodVars.periodAbbreviated;
      baseObject["product.period_with_unit"] = periodVars.periodWithUnit;
      baseObject["product.period_in_days"] = periodVars.periodInDays;
      baseObject["product.period_in_weeks"] = periodVars.periodInWeeks;
      baseObject["product.period_in_months"] = periodVars.periodInMonths;
      baseObject["product.period_in_years"] = periodVars.periodInYears;

      baseObject["product.periodly"] =
        translator.translatePeriodFrequency(
          basePeriod.number,
          basePeriod.unit,
        ) || "";
    }

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

    setOfferVariables(purchaseOption, translator, baseObject);
  }

  if (
    (productType === ProductType.NonConsumable ||
      productType === ProductType.Consumable) &&
    purchaseOption
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
