import { type Period, PeriodUnit } from "../../helpers/duration-helper";
import {
  type Offering,
  type Package,
  PackageType,
  type Product,
  ProductType,
} from "../../entities/offerings";
import { formatPrice } from "../../helpers/price-labels";

export interface MinimumProductInfo {
  identifier: string;
  title: string;
  period?: Period;
  basePriceMicros?: number; // Amount micros
  pricePerWeekMicros?: number;
  pricePerMonthMicros?: number;
  pricePerYearMicros?: number;
  currency?: string;
}

export interface MinimumPackageInfo extends MinimumProductInfo {
  packageIdentifier: string;
}

export const buildOffering = (packages: Package[] = []) => {
  const packagesById = packages.reduce<{ [key: string]: Package }>((acc, p) => {
    acc[p.identifier] = p;
    return acc;
  }, {});

  const findByType = (type: PackageType): Package | null =>
    packages.find((p) => p.packageType === type) ?? null;

  const built: Offering = {
    identifier: "test",
    serverDescription: "test",
    metadata: null,
    packagesById,
    availablePackages: packages,
    lifetime: findByType(PackageType.Lifetime),
    annual: findByType(PackageType.Annual),
    sixMonth: findByType(PackageType.SixMonth),
    threeMonth: findByType(PackageType.ThreeMonth),
    twoMonth: findByType(PackageType.TwoMonth),
    monthly: findByType(PackageType.Monthly),
    weekly: findByType(PackageType.Weekly),
    paywallComponents: null,
  };

  return built;
};
export const buildPackage = (packageId: string, product: Product) => {
  return {
    identifier: packageId,
    rcBillingProduct: product,
    webBillingProduct: product,
    packageType: Object.values<string>(PackageType).includes(packageId)
      ? packageId
      : PackageType.Custom,
  } as Package;
};
export const buildProduct: (data: MinimumProductInfo) => Product = ({
  identifier,
  title,
  period = { unit: PeriodUnit.Month, number: 1 },
  basePriceMicros = 9000000,
  pricePerWeekMicros = 2100000,
  pricePerMonthMicros = 9000000,
  pricePerYearMicros = 109500000,
  currency = "EUR",
}) => {
  const toPrice = (amountMicros: number, currency: string) => ({
    amount: Math.floor(amountMicros / 10000),
    amountMicros: amountMicros,
    currency: currency,
    formattedPrice: formatPrice(amountMicros, currency),
  });

  const basePrice = toPrice(basePriceMicros, currency);
  const pricePerWeek = toPrice(pricePerWeekMicros, currency);
  const pricePerYear = toPrice(pricePerYearMicros, currency);
  const pricePerMonth = toPrice(pricePerMonthMicros, currency);

  const subscriptionOption = {
    id: "base_option",
    priceId: "prcb358d16d7b7744bb8ab0",
    base: {
      periodDuration: "P1M",
      period: period,
      cycleCount: 1,
      price: basePrice,
      pricePerWeek: pricePerWeek,
      pricePerMonth: pricePerMonth,
      pricePerYear: pricePerYear,
    },
    trial: null,
    introPrice: null,
  };

  return {
    identifier: identifier,
    displayName: title,
    title: title,
    description:
      "Just the best for Italian supercalifragilisticexpialidocious plumbers, groom them on a monthly basis",
    productType: ProductType.Subscription,
    currentPrice: basePrice,
    price: basePrice,
    period: period,
    normalPeriodDuration: "P1M",
    presentedOfferingIdentifier: "MultiCurrencyTest",
    presentedOfferingContext: {
      offeringIdentifier: "MultiCurrencyTest",
      targetingContext: null,
      placementIdentifier: null,
    },
    defaultPurchaseOption: {
      id: "base_option",
      priceId: "prcb358d16d7b7744bb8ab0",
    },
    defaultSubscriptionOption: subscriptionOption,
    subscriptionOptions: {
      base_option: subscriptionOption,
    },
    defaultNonSubscriptionOption: null,
    freeTrialPhase: null,
    introPricePhase: null,
  };
};
export const toOffering = (productInfo: MinimumPackageInfo[]) => {
  return buildOffering(
    productInfo.map((pi) =>
      buildPackage(pi.packageIdentifier, buildProduct(pi)),
    ),
  );
};
