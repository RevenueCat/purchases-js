import {
  OfferingResponse,
  PackageResponse,
} from "../networking/responses/offerings-response";
import { ProductResponse } from "../networking/responses/products-response";
import { notEmpty } from "../helpers/type-helper";

export enum PackageType {
  Unknown = "unknown",
  Custom = "custom",
  Lifetime = "$rc_lifetime",
  Annual = "$rc_annual",
  SixMonth = "$rc_six_month",
  ThreeMonth = "$rc_three_month",
  TwoMonth = "$rc_two_month",
  Monthly = "$rc_monthly",
  Weekly = "$rc_weekly",
}

export interface Price {
  readonly amount: number;
  readonly currency: string;
}

export interface Product {
  readonly id: string;
  readonly displayName: string;
  readonly identifier: string;
  readonly currentPrice: Price | null;
  readonly normalPeriodDuration: string | null;
}

export interface Package {
  readonly id: string;
  readonly identifier: string;
  readonly rcBillingProduct: Product;
  readonly packageType: PackageType;
}

export interface Offering {
  readonly id: string;
  readonly identifier: string;
  readonly displayName: string;
  readonly metadata: { [key: string]: unknown } | null;
  readonly packages: { [key: string]: Package };
  readonly lifetimePackage: Package | null;
  readonly annualPackage: Package | null;
  readonly sixMonthPackage: Package | null;
  readonly threeMonthPackage: Package | null;
  readonly twoMonthPackage: Package | null;
  readonly monthlyPackage: Package | null;
  readonly weeklyPackage: Package | null;
}

export interface Offerings {
  readonly all: { [offeringId: string]: Offering };
  readonly current: Offering | null;
}

export const toProduct = (productDetailsData: ProductResponse): Product => {
  return {
    id: productDetailsData.identifier,
    identifier: productDetailsData.identifier,
    displayName: productDetailsData.title,
    currentPrice: productDetailsData.current_price as Price,
    normalPeriodDuration: productDetailsData.normal_period_duration,
  };
};

export const toPackage = (
  packageData: PackageResponse,
  productDetailsData: { [productId: string]: ProductResponse },
): Package | null => {
  const rcBillingProduct =
    productDetailsData[packageData.platform_product_identifier];
  if (rcBillingProduct === undefined) return null;

  return {
    id: packageData.identifier,
    identifier: packageData.identifier,
    rcBillingProduct: toProduct(rcBillingProduct),
    packageType: getPackageType(packageData.identifier),
  };
};

export const toOffering = (
  offeringsData: OfferingResponse,
  productDetailsData: { [productId: string]: ProductResponse },
): Offering | null => {
  const packages = offeringsData.packages
    .map((p: PackageResponse) => toPackage(p, productDetailsData))
    .filter(notEmpty);
  const packagesById: { [packageId: string]: Package } = {};
  for (const p of packages) {
    if (p != null) {
      packagesById[p.identifier] = p;
    }
  }
  if (packages.length == 0) return null;
  return {
    id: offeringsData.identifier,
    identifier: offeringsData.identifier,
    displayName: offeringsData.description,
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
