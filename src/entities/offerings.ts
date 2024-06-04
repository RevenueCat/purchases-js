import {
  type OfferingResponse,
  type PackageResponse,
} from "../networking/responses/offerings-response";
import {
  type ProductResponse,
  type PurchaseOptionPhaseResponse,
  type SubscriptionPurchaseOptionResponse,
} from "../networking/responses/products-response";
import { notEmpty } from "../helpers/type-helper";
import { formatPrice } from "../helpers/price-labels";
import { Logger } from "../helpers/logger";

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
 * Price information for a product.
 * @public
 */
export interface Price {
  /**
   * Price in full units of the currency.
   */
  readonly amount: number;
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
export interface PurchaseOptionPhase {
  /**
   * The duration of the purchase option price in ISO 8601 format.
   * For applicable options (trials, initial/promotional prices), otherwise null
   */
  readonly periodDuration: string | null;
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
}

/**
 * Represents a possible option to purchase a subscription product.
 * @public
 */
export interface SubscriptionPurchaseOption extends PurchaseOption {
  /**
   * The base phase for a SubscriptionPurchaseOption, represents
   * the price that the customer will be charged after all the discounts have
   * been consumed and the period at which it will renew.
   */
  readonly basePhase: PurchaseOptionPhase;
  /**
   * The trial information for this subscription option if available.
   */
  readonly trialPhase: PurchaseOptionPhase | null;
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
   */
  readonly displayName: string;
  /**
   * Price of the product. In the case of subscriptions, this will match the
   * default option's base phase price.
   */
  readonly currentPrice: Price;
  /**
   * The period duration for a subscription product. This will match the default
   * option's base phase period duration.
   */
  readonly normalPeriodDuration: string | null;
  /**
   * The offering ID used to obtain this product.
   */
  readonly presentedOfferingIdentifier: string;
  /**
   * The default subscription option for this product. Null if no subscription
   * options are available like in the case of consumables and non-consumables.
   */
  readonly defaultSubscriptionOption: SubscriptionPurchaseOption | null;
  /**
   * A dictionary with all the possible subscription options available for this
   * product. Each key contains the key to be used when executing a purchase.
   *
   * If retrieved through getOfferings the offers are only the ones the customer is
   * entitled to.
   */
  readonly subscriptionPurchaseOptions: {
    [optionId: string]: SubscriptionPurchaseOption;
  };
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
}

/**
 * This class contains all the offerings configured in RevenueCat dashboard.
 * For more info see https://docs.revenuecat.com/docs/entitlements
 * @public
 */
export interface Offerings {
  /**
   * Dictionary of all {@link Offering} objects keyed by their identifier.
   */
  readonly all: { [offeringId: string]: Offering };
  /**
   * Current offering configured in the RevenueCat dashboard.
   */
  readonly current: Offering | null;
}

const toPrice = (priceData: { amount: number; currency: string }): Price => {
  return {
    amount: priceData.amount,
    currency: priceData.currency,
    formattedPrice: formatPrice(priceData.amount, priceData.currency),
  };
};

const toPurchaseOptionPhase = (
  optionPhase: PurchaseOptionPhaseResponse,
): PurchaseOptionPhase => {
  return {
    periodDuration: optionPhase.period_duration,
    cycleCount: optionPhase.cycle_count,
    price: optionPhase.price ? toPrice(optionPhase.price) : null,
  } as PurchaseOptionPhase;
};

const toSubscriptionPurchaseOption = (
  option: SubscriptionPurchaseOptionResponse,
): SubscriptionPurchaseOption | null => {
  if (option.base_phase == null) {
    Logger.debugLog(
      "Missing base phase for subscription purchase option. Ignoring.",
    );
    return null;
  }
  return {
    id: option.id,
    basePhase: toPurchaseOptionPhase(option.base_phase),
    trialPhase: option.trial_phase
      ? toPurchaseOptionPhase(option.trial_phase)
      : null,
  } as SubscriptionPurchaseOption;
};

const toProduct = (
  productDetailsData: ProductResponse,
  presentedOfferingIdentifier: string,
): Product | null => {
  const options: { [optionId: string]: SubscriptionPurchaseOption } = {};

  Object.entries(productDetailsData.subscription_purchase_options).forEach(
    ([key, value]) => {
      const option = toSubscriptionPurchaseOption(value);
      if (option != null) {
        options[key] = option;
      }
    },
  );

  if (Object.keys(options).length === 0) {
    Logger.debugLog(
      `Product ${productDetailsData.identifier} has no subscription options. Ignoring.`,
    );
    return null;
  }

  const defaultOptionId =
    productDetailsData.default_subscription_purchase_option_id;
  const defaultOption =
    defaultOptionId && defaultOptionId in options
      ? options[defaultOptionId]
      : null;
  if (defaultOption == null) {
    Logger.debugLog(
      `Product ${productDetailsData.identifier} has no default subscription option. Ignoring.`,
    );
    return null;
  }

  const currentPrice = defaultOption.basePhase.price;
  if (currentPrice == null) {
    Logger.debugLog(
      `Product ${productDetailsData.identifier} default option has no base price. Ignoring.`,
    );
    return null;
  }

  return {
    identifier: productDetailsData.identifier,
    displayName: productDetailsData.title,
    currentPrice: currentPrice,
    normalPeriodDuration: defaultOption.basePhase.periodDuration,
    presentedOfferingIdentifier: presentedOfferingIdentifier,
    defaultSubscriptionOption: defaultOption,
    subscriptionPurchaseOptions: options,
  };
};

const toPackage = (
  presentedOfferingIdentifier: string,
  packageData: PackageResponse,
  productDetailsData: { [productId: string]: ProductResponse },
): Package | null => {
  const rcBillingProduct =
    productDetailsData[packageData.platform_product_identifier];
  if (rcBillingProduct === undefined) return null;
  const product = toProduct(rcBillingProduct, presentedOfferingIdentifier);
  if (product === null) return null;

  return {
    identifier: packageData.identifier,
    rcBillingProduct: product,
    packageType: getPackageType(packageData.identifier),
  };
};

export const toOffering = (
  offeringsData: OfferingResponse,
  productDetailsData: { [productId: string]: ProductResponse },
): Offering | null => {
  const packages = offeringsData.packages
    .map((p: PackageResponse) =>
      toPackage(offeringsData.identifier, p, productDetailsData),
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
