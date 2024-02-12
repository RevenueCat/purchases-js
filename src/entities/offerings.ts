import {
  OfferingResponse,
  PackageResponse,
} from "../networking/responses/offerings-response";
import { ProductResponse } from "../networking/responses/products-response";
import { notEmpty } from "../helpers/type-helper";

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
   * Price of the product.
   */
  readonly currentPrice: Price;
  /**
   * The period duration for a subscription product.
   */
  readonly normalPeriodDuration: string | null;
  /**
   * The offering ID used to obtain this product.
   */
  readonly presentedOfferingIdentifier: string;
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
  readonly packages: { [key: string]: Package };
  /**
   * Lifetime package type configured in the RevenueCat dashboard, if available.
   */
  readonly lifetimePackage: Package | null;
  /**
   * Annual package type configured in the RevenueCat dashboard, if available.
   */
  readonly annualPackage: Package | null;
  /**
   * Six month package type configured in the RevenueCat dashboard, if available.
   */
  readonly sixMonthPackage: Package | null;
  /**
   * Three month package type configured in the RevenueCat dashboard, if available.
   */
  readonly threeMonthPackage: Package | null;
  /**
   * Two month package type configured in the RevenueCat dashboard, if available.
   */
  readonly twoMonthPackage: Package | null;
  /**
   * Monthly package type configured in the RevenueCat dashboard, if available.
   */
  readonly monthlyPackage: Package | null;
  /**
   * Weekly package type configured in the RevenueCat dashboard, if available.
   */
  readonly weeklyPackage: Package | null;
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

const toProduct = (
  productDetailsData: ProductResponse,
  presentedOfferingIdentifier: string,
): Product => {
  return {
    identifier: productDetailsData.identifier,
    displayName: productDetailsData.title,
    currentPrice: productDetailsData.current_price as Price,
    normalPeriodDuration: productDetailsData.normal_period_duration,
    presentedOfferingIdentifier: presentedOfferingIdentifier,
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

  return {
    identifier: packageData.identifier,
    rcBillingProduct: toProduct(rcBillingProduct, presentedOfferingIdentifier),
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
      packagesById[p.identifier] = p;
    }
  }
  if (packages.length == 0) return null;
  return {
    identifier: offeringsData.identifier,
    serverDescription: offeringsData.description,
    metadata: offeringsData.metadata,
    packages: packagesById,
    lifetimePackage: packagesById[PackageType.Lifetime] ?? null,
    annualPackage: packagesById[PackageType.Annual] ?? null,
    sixMonthPackage: packagesById[PackageType.SixMonth] ?? null,
    threeMonthPackage: packagesById[PackageType.ThreeMonth] ?? null,
    twoMonthPackage: packagesById[PackageType.TwoMonth] ?? null,
    monthlyPackage: packagesById[PackageType.Monthly] ?? null,
    weeklyPackage: packagesById[PackageType.Weekly] ?? null,
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
