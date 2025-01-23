import {
  type OfferingResponse,
  type PackageResponse,
  type TargetingResponse,
} from "../networking/responses/offerings-response";
import type {
  NonSubscriptionOptionResponse,
  PriceResponse,
  PricingPhaseResponse,
  ProductResponse,
  SubscriptionOptionResponse,
} from "../networking/responses/products-response";
import { notEmpty } from "../helpers/type-helper";
import { formatPrice } from "../helpers/price-labels";
import { Logger } from "../helpers/logger";
import { parseISODuration, type Period } from "../helpers/duration-helper";
import type { PaywallData } from "@revenuecat/purchases-ui-js";

/**
 * Enumeration of all possible Package types.
 * @public
 */
export enum PackageType {
  /**
   * A package that was defined with an unrecognized RC identifier.
   */
  Unknown = "unknown",
  /**
   * A package that was defined with a custom identifier.
   */
  Custom = "custom",
  /**
   * A package configured with the predefined lifetime identifier.
   */
  Lifetime = "$rc_lifetime",
  /**
   * A package configured with the predefined annual identifier.
   */
  Annual = "$rc_annual",
  /**
   * A package configured with the predefined six month identifier.
   */
  SixMonth = "$rc_six_month",
  /**
   * A package configured with the predefined three month identifier.
   */
  ThreeMonth = "$rc_three_month",
  /**
   * A package configured with the predefined two month identifier.
   */
  TwoMonth = "$rc_two_month",
  /**
   * A package configured with the predefined monthly identifier.
   */
  Monthly = "$rc_monthly",
  /**
   * A package configured with the predefined weekly identifier.
   */
  Weekly = "$rc_weekly",
}

/**
 * Possible product types
 * @public
 */
export enum ProductType {
  /**
   * A product that is an auto-renewing subscription.
   */
  Subscription = "subscription",
  /**
   * A product that does not renew and can be consumed to be purchased again.
   */
  Consumable = "consumable",
  /**
   * A product that does not renew and can only be purchased once.
   */
  NonConsumable = "non_consumable",
}

/**
 * Price information for a product.
 * @public
 */
export interface Price {
  /**
   * Price in cents of the currency.
   * @deprecated - Use {@link Price.amountMicros} instead.
   */
  readonly amount: number;
  /**
   * Price in micro-units of the currency. For example, $9.99 is represented as 9990000.
   */
  readonly amountMicros: number;
  /**
   * Returns ISO 4217 currency code for price.
   * For example, if price is specified in British pounds sterling,
   * currency is "GBP".
   * If currency code cannot be determined, currency symbol is returned.
   */
  readonly currency: string;
  /**
   * Formatted price string including price and currency.
   */
  readonly formattedPrice: string;
}

/**
 * Represents the price and duration information for a phase of the purchase option.
 * @public
 */
export interface PricingPhase {
  /**
   * The duration of the phase in ISO 8601 format.
   */
  readonly periodDuration: string | null;
  /**
   * The duration of the phase as a {@link Period}.
   */
  readonly period: Period | null;
  /**
   * The price for the purchase option.
   * Null in case of trials.
   */
  readonly price: Price | null;
  /**
   * The number of cycles this option's price repeats.
   * I.e. 2 subscription cycles, 0 if not applicable.
   */
  readonly cycleCount: number;
}

/**
 * Represents a possible option to purchase a product.
 * @public
 */
export interface PurchaseOption {
  /**
   * The unique id for a purchase option
   */
  readonly id: string;
  /**
   * The public price id for this subscription option.
   */
  readonly priceId: string;
}

/**
 * Represents a possible option to purchase a subscription product.
 * @public
 */
export interface SubscriptionOption extends PurchaseOption {
  /**
   * The base phase for a SubscriptionOption, represents
   * the price that the customer will be charged after all the discounts have
   * been consumed and the period at which it will renew.
   */
  readonly base: PricingPhase;
  /**
   * The trial information for this subscription option if available.
   */
  readonly trial: PricingPhase | null;
}

/**
 * Represents a possible option to purchase a non-subscription product.
 * @public
 */
export interface NonSubscriptionOption extends PurchaseOption {
  /**
   * The base price for the product.
   */
  readonly basePrice: Price;
}

/**
 * Contains information about the targeting context used to obtain an object.
 * @public
 */
export interface TargetingContext {
  /**
   * The rule id from the targeting used to obtain this object.
   */
  readonly ruleId: string;
  /**
   * The revision of the targeting used to obtain this object.
   */
  readonly revision: number;
}

/**
 * Contains data about the context in which an offering was presented.
 * @public
 */
export interface PresentedOfferingContext {
  /**
   * The identifier of the offering used to obtain this object.
   */
  readonly offeringIdentifier: string;
  /**
   * The targeting context used to obtain this object.
   */
  readonly targetingContext: TargetingContext | null;
  /**
   * If obtained this information from a placement,
   * the identifier of the placement.
   */
  readonly placementIdentifier: string | null;
}

/**
 * Represents product's listing details.
 * @public
 */
export interface Product {
  /**
   * The product ID.
   */
  readonly identifier: string;
  /**
   * Name of the product.
   * @deprecated - Use {@link Product.title} instead.
   */
  readonly displayName: string;
  /**
   * The title of the product as configured in the RevenueCat dashboard.
   */
  readonly title: string;
  /**
   * The description of the product as configured in the RevenueCat dashboard.
   */
  readonly description: string | null;
  /**
   * Price of the product. This will match the default option's base phase price
   * in subscriptions or the price in non-subscriptions.
   */
  readonly currentPrice: Price;
  /**
   * The type of product.
   */
  readonly productType: ProductType;
  /**
   * The period duration for a subscription product. This will match the default
   * option's base phase period duration. Null for non-subscriptions.
   */
  readonly normalPeriodDuration: string | null;
  /**
   * The offering ID used to obtain this product.
   * @deprecated - Use {@link Product.presentedOfferingContext} instead.
   */
  readonly presentedOfferingIdentifier: string;
  /**
   * The context from which this product was obtained.
   */
  readonly presentedOfferingContext: PresentedOfferingContext;
  /**
   * The default purchase option for this product.
   */
  readonly defaultPurchaseOption: PurchaseOption;
  /**
   * The default subscription option for this product.
   * Null if no subscription options are available like in the case of consumables and non-consumables.
   */
  readonly defaultSubscriptionOption: SubscriptionOption | null;
  /**
   * A dictionary with all the possible subscription options available for this
   * product. Each key contains the key to be used when executing a purchase.
   * Will be empty for non-subscriptions
   *
   * If retrieved through getOfferings the offers are only the ones the customer is
   * entitled to.
   */
  readonly subscriptionOptions: {
    [optionId: string]: SubscriptionOption;
  };
  /**
   * The default non-subscription option for this product.
   * Null in the case of subscriptions.
   */
  readonly defaultNonSubscriptionOption: NonSubscriptionOption | null;
}

/**
 * Contains information about the product available for the user to purchase.
 * For more info see https://docs.revenuecat.com/docs/entitlements
 * @public
 */
export interface Package {
  /**
   * Unique identifier for this package. Can be one a predefined package type or a custom one.
   */
  readonly identifier: string;
  /**
   * The {@link Product} assigned to this package.
   */
  readonly rcBillingProduct: Product;
  /**
   * The type of package.
   */
  readonly packageType: PackageType;
}

/**
 * An offering is a collection of {@link Package} available for the user to purchase.
 * For more info see https://docs.revenuecat.com/docs/entitlements
 * @public
 */
export interface Offering {
  /**
   * Unique identifier defined in RevenueCat dashboard.
   */
  readonly identifier: string;
  /**
   * Offering description defined in RevenueCat dashboard.
   */
  readonly serverDescription: string;
  /**
   * Offering metadata defined in RevenueCat dashboard.
   */
  readonly metadata: { [key: string]: unknown } | null;
  /**
   * A map of all the packages available for purchase keyed by package ID.
   */
  readonly packagesById: { [key: string]: Package };
  /**
   * A list of all the packages available for purchase.
   */
  readonly availablePackages: Package[];
  /**
   * Lifetime package type configured in the RevenueCat dashboard, if available.
   */
  readonly lifetime: Package | null;
  /**
   * Annual package type configured in the RevenueCat dashboard, if available.
   */
  readonly annual: Package | null;
  /**
   * Six month package type configured in the RevenueCat dashboard, if available.
   */
  readonly sixMonth: Package | null;
  /**
   * Three month package type configured in the RevenueCat dashboard, if available.
   */
  readonly threeMonth: Package | null;
  /**
   * Two month package type configured in the RevenueCat dashboard, if available.
   */
  readonly twoMonth: Package | null;
  /**
   * Monthly package type configured in the RevenueCat dashboard, if available.
   */
  readonly monthly: Package | null;
  /**
   * Weekly package type configured in the RevenueCat dashboard, if available.
   */
  readonly weekly: Package | null;

  readonly paywall_components: PaywallData | null;
}

/**
 * This class contains all the offerings configured in RevenueCat dashboard.
 * For more info see https://docs.revenuecat.com/docs/entitlements
 * @public
 */
export interface Offerings {
  /**
   * Dictionary containing all {@link Offering} objects, keyed by their identifier.
   */
  readonly all: { [offeringId: string]: Offering };
  /**
   * Current offering configured in the RevenueCat dashboard.
   * It can be `null` if no current offering is configured or if a specific offering
   * was requested that is not the current one.
   */
  readonly current: Offering | null;
}

export type PurchaseMetadata = Record<string, string | number | boolean | null>;

const toPrice = (priceData: PriceResponse): Price => {
  return {
    amount: priceData.amount_micros / 10000,
    amountMicros: priceData.amount_micros,
    currency: priceData.currency,
    formattedPrice: formatPrice(priceData.amount_micros, priceData.currency),
  };
};

const toPricingPhase = (optionPhase: PricingPhaseResponse): PricingPhase => {
  const periodDuration = optionPhase.period_duration;
  return {
    periodDuration: periodDuration,
    period: periodDuration ? parseISODuration(periodDuration) : null,
    cycleCount: optionPhase.cycle_count,
    price: optionPhase.price ? toPrice(optionPhase.price) : null,
  } as PricingPhase;
};

const toSubscriptionOption = (
  option: SubscriptionOptionResponse,
): SubscriptionOption | null => {
  if (option.base == null) {
    Logger.debugLog("Missing base phase for subscription option. Ignoring.");
    return null;
  }
  return {
    id: option.id,
    priceId: option.price_id,
    base: toPricingPhase(option.base),
    trial: option.trial ? toPricingPhase(option.trial) : null,
  } as SubscriptionOption;
};

const toNonSubscriptionOption = (
  option: NonSubscriptionOptionResponse,
): NonSubscriptionOption | null => {
  if (option.base_price == null) {
    Logger.debugLog(
      "Missing base price for non-subscription option. Ignoring.",
    );
    return null;
  }
  return {
    id: option.id,
    priceId: option.price_id,
    basePrice: toPrice(option.base_price),
  } as NonSubscriptionOption;
};

const toProduct = (
  productDetailsData: ProductResponse,
  presentedOfferingContext: PresentedOfferingContext,
): Product | null => {
  const productType = productDetailsData.product_type as ProductType;
  if (productType === ProductType.Subscription) {
    return toSubscriptionProduct(
      productDetailsData,
      presentedOfferingContext,
      productType,
    );
  } else {
    return toNonSubscriptionProduct(
      productDetailsData,
      presentedOfferingContext,
      productType,
    );
  }
};

const toNonSubscriptionProduct = (
  productDetailsData: ProductResponse,
  presentedOfferingContext: PresentedOfferingContext,
  productType: ProductType,
): Product | null => {
  const nonSubscriptionOptions: {
    [optionId: string]: NonSubscriptionOption;
  } = {};

  Object.entries(productDetailsData.purchase_options).forEach(
    ([key, value]) => {
      const option = toNonSubscriptionOption(
        value as NonSubscriptionOptionResponse,
      );
      if (option != null) {
        nonSubscriptionOptions[key] = option;
      }
    },
  );

  if (Object.keys(nonSubscriptionOptions).length === 0) {
    Logger.debugLog(
      `Product ${productDetailsData.identifier} has no purchase options. Ignoring.`,
    );
    return null;
  }

  const defaultOptionId = productDetailsData.default_purchase_option_id;
  const defaultOption =
    defaultOptionId && defaultOptionId in productDetailsData.purchase_options
      ? nonSubscriptionOptions[defaultOptionId]
      : null;

  if (defaultOption == null) {
    Logger.debugLog(
      `Product ${productDetailsData.identifier} has no default purchase option. Ignoring.`,
    );
    return null;
  }

  return {
    identifier: productDetailsData.identifier,
    displayName: productDetailsData.title,
    title: productDetailsData.title,
    description: productDetailsData.description,
    productType: productType,
    currentPrice: defaultOption.basePrice,
    normalPeriodDuration: null,
    presentedOfferingIdentifier: presentedOfferingContext.offeringIdentifier,
    presentedOfferingContext: presentedOfferingContext,
    defaultPurchaseOption: defaultOption,
    defaultSubscriptionOption: null,
    subscriptionOptions: {},
    defaultNonSubscriptionOption: defaultOption,
  };
};

const toSubscriptionProduct = (
  productDetailsData: ProductResponse,
  presentedOfferingContext: PresentedOfferingContext,
  productType: ProductType,
): Product | null => {
  const subscriptionOptions: { [optionId: string]: SubscriptionOption } = {};

  Object.entries(productDetailsData.purchase_options).forEach(
    ([key, value]) => {
      const option = toSubscriptionOption(value as SubscriptionOptionResponse);
      if (option != null) {
        subscriptionOptions[key] = option;
      }
    },
  );

  if (Object.keys(subscriptionOptions).length === 0) {
    Logger.debugLog(
      `Product ${productDetailsData.identifier} has no subscription options. Ignoring.`,
    );
    return null;
  }

  const defaultOptionId = productDetailsData.default_purchase_option_id;
  const defaultOption =
    defaultOptionId && defaultOptionId in subscriptionOptions
      ? subscriptionOptions[defaultOptionId]
      : null;
  if (defaultOption == null) {
    Logger.debugLog(
      `Product ${productDetailsData.identifier} has no default subscription option. Ignoring.`,
    );
    return null;
  }

  const currentPrice = defaultOption.base.price;
  if (currentPrice == null) {
    Logger.debugLog(
      `Product ${productDetailsData.identifier} default option has no base price. Ignoring.`,
    );
    return null;
  }
  return {
    identifier: productDetailsData.identifier,
    displayName: productDetailsData.title,
    title: productDetailsData.title,
    description: productDetailsData.description,
    productType: productType,
    currentPrice: currentPrice,
    normalPeriodDuration: defaultOption.base.periodDuration,
    presentedOfferingIdentifier: presentedOfferingContext.offeringIdentifier,
    presentedOfferingContext: presentedOfferingContext,
    defaultPurchaseOption: defaultOption,
    defaultSubscriptionOption: defaultOption,
    subscriptionOptions: subscriptionOptions,
    defaultNonSubscriptionOption: null,
  };
};

const toPackage = (
  presentedOfferingContext: PresentedOfferingContext,
  packageData: PackageResponse,
  productDetailsData: { [productId: string]: ProductResponse },
): Package | null => {
  const rcBillingProduct =
    productDetailsData[packageData.platform_product_identifier];
  if (rcBillingProduct === undefined) return null;
  const product = toProduct(rcBillingProduct, presentedOfferingContext);
  if (product === null) return null;

  return {
    identifier: packageData.identifier,
    rcBillingProduct: product,
    packageType: getPackageType(packageData.identifier),
  };
};

export const toOffering = (
  isCurrentOffering: boolean,
  offeringsData: OfferingResponse,
  productDetailsData: { [productId: string]: ProductResponse },
  targetingResponse?: TargetingResponse,
): Offering | null => {
  const presentedOfferingContext: PresentedOfferingContext = {
    offeringIdentifier: offeringsData.identifier,
    targetingContext:
      isCurrentOffering && targetingResponse
        ? {
            ruleId: targetingResponse.rule_id,
            revision: targetingResponse.revision,
          }
        : null,
    placementIdentifier: null,
  };
  const packages = offeringsData.packages
    .map((p: PackageResponse) =>
      toPackage(presentedOfferingContext, p, productDetailsData),
    )
    .filter(notEmpty);
  const packagesById: { [packageId: string]: Package } = {};
  for (const p of packages) {
    if (p != null) {
      packagesById[p.identifier] = p as Package;
    }
  }
  if (packages.length == 0) return null;
  return {
    identifier: offeringsData.identifier,
    serverDescription: offeringsData.description,
    metadata: offeringsData.metadata,
    packagesById: packagesById,
    availablePackages: packages as Package[],
    lifetime: packagesById[PackageType.Lifetime] ?? null,
    annual: packagesById[PackageType.Annual] ?? null,
    sixMonth: packagesById[PackageType.SixMonth] ?? null,
    threeMonth: packagesById[PackageType.ThreeMonth] ?? null,
    twoMonth: packagesById[PackageType.TwoMonth] ?? null,
    monthly: packagesById[PackageType.Monthly] ?? null,
    weekly: packagesById[PackageType.Weekly] ?? null,
    paywall_components: offeringsData.paywall_components
      ? (offeringsData.paywall_components as PaywallData)
      : null,
  };
};

function getPackageType(packageIdentifier: string): PackageType {
  switch (packageIdentifier) {
    case "$rc_lifetime":
      return PackageType.Lifetime;
    case "$rc_annual":
      return PackageType.Annual;
    case "$rc_six_month":
      return PackageType.SixMonth;
    case "$rc_three_month":
      return PackageType.ThreeMonth;
    case "$rc_two_month":
      return PackageType.TwoMonth;
    case "$rc_monthly":
      return PackageType.Monthly;
    case "$rc_weekly":
      return PackageType.Weekly;
    default:
      if (packageIdentifier.startsWith("$rc_")) {
        return PackageType.Unknown;
      } else {
        return PackageType.Custom;
      }
  }
}
