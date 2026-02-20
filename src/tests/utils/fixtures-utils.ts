import { type Period, PeriodUnit } from "../../helpers/duration-helper";
import type {
  SubscriptionOption,
  DiscountPricePhase,
  Price,
  PurchaseOption,
} from "../../entities/offerings";
import {
  type Offering,
  type Package,
  PackageType,
  type Product,
  ProductType,
  type NonSubscriptionOption,
} from "../../entities/offerings";
import { formatPrice } from "../../helpers/price-labels";

const DEFAULT_PURCHASE_OPTION: PurchaseOption = {
  id: "base_option",
  priceId: "prcb358d16d7b7744bb8ab0",
};

export interface MinimumBaseProductInfo {
  identifier: string;
  title: string;
  price: Price;
  productType: ProductType;
}

export interface MinimumSubscriptionProductInfo {
  identifier: string;
  title: string;
  period?: Period;
  basePriceMicros?: number; // Amount micros
  pricePerWeekMicros?: number;
  pricePerMonthMicros?: number;
  pricePerYearMicros?: number;
  currency?: string;
  trial?: SubscriptionOption["trial"];
  introPrice?: SubscriptionOption["introPrice"];
  discountPrice?: SubscriptionOption["discountPrice"];
}

export interface MinimumPackageInfo extends MinimumSubscriptionProductInfo {
  packageIdentifier: string;
}

export interface MinimumNonSubscriptionProductInfo {
  identifier: string;
  title: string;
  basePriceMicros?: number;
  currency?: string;
  discountPrice?: DiscountPricePhase | null;
  productType?: ProductType.Consumable | ProductType.NonConsumable;
}

export interface MinimumNonSubscriptionPackageInfo
  extends MinimumNonSubscriptionProductInfo {
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

export const toPrice = (amountMicros: number, currency: string): Price => ({
  amount: Math.floor(amountMicros / 10000),
  amountMicros: amountMicros,
  currency: currency,
  formattedPrice: formatPrice(amountMicros, currency),
});

export interface MinimumBaseProductInfo {
  identifier: string;
  title: string;
  price: Price;
  productType: ProductType;
}

const buildProduct: (
  data: MinimumBaseProductInfo & Partial<Product>,
) => Product = ({ identifier, title, price, ...rest }) => ({
  identifier: identifier,
  displayName: title,
  title: title,
  description: `Description for ${identifier}`,
  currentPrice: price,
  price: price,
  presentedOfferingIdentifier: "MultiCurrencyTest",
  presentedOfferingContext: {
    offeringIdentifier: "MultiCurrencyTest",
    targetingContext: null,
    placementIdentifier: null,
  },
  defaultPurchaseOption: DEFAULT_PURCHASE_OPTION,
  defaultSubscriptionOption: null,
  subscriptionOptions: {},
  defaultNonSubscriptionOption: null,
  freeTrialPhase: null,
  introPricePhase: null,
  discountPricePhase: null,
  normalPeriodDuration: null,
  period: null,
  ...rest,
});

const buildSubscriptionProduct: (
  data: MinimumSubscriptionProductInfo,
) => Product = ({
  identifier,
  title,
  period = { unit: PeriodUnit.Month, number: 1 },
  basePriceMicros = 9000000,
  pricePerWeekMicros = 2100000,
  pricePerMonthMicros = 9000000,
  pricePerYearMicros = 109500000,
  currency = "EUR",
  trial = null,
  introPrice = null,
  discountPrice = null,
}) => {
  const basePrice = toPrice(basePriceMicros, currency);

  const subscriptionOption: SubscriptionOption = {
    ...DEFAULT_PURCHASE_OPTION,
    base: {
      periodDuration: "P1M",
      period: period,
      cycleCount: 1,
      price: basePrice,
      pricePerWeek: toPrice(pricePerWeekMicros, currency),
      pricePerMonth: toPrice(pricePerMonthMicros, currency),
      pricePerYear: toPrice(pricePerYearMicros, currency),
    },
    trial,
    introPrice,
    discountPrice,
  };

  return buildProduct({
    identifier,
    title,
    price: basePrice,
    productType: ProductType.Subscription,
    period,
    normalPeriodDuration: "P1M",
    defaultSubscriptionOption: subscriptionOption,
    subscriptionOptions: {
      base_option: subscriptionOption,
    },
    freeTrialPhase: trial,
    introPricePhase: introPrice,
    discountPricePhase: discountPrice,
  });
};

export const toOffering = (productInfo: MinimumPackageInfo[]) => {
  return buildOffering(
    productInfo.map((pi) =>
      buildPackage(pi.packageIdentifier, buildSubscriptionProduct(pi)),
    ),
  );
};

export const buildNonSubscriptionProduct: (
  data: MinimumNonSubscriptionProductInfo,
) => Product = ({
  identifier,
  title,
  basePriceMicros = 100000000,
  currency = "EUR",
  discountPrice = null,
  productType = ProductType.NonConsumable,
}) => {
  const basePrice = toPrice(basePriceMicros, currency);

  const nonSubscriptionOption: NonSubscriptionOption = {
    ...DEFAULT_PURCHASE_OPTION,
    basePrice,
    discountPrice,
  };

  return buildProduct({
    identifier,
    title,
    price: basePrice,
    productType,
    defaultNonSubscriptionOption: nonSubscriptionOption,
    discountPricePhase: discountPrice,
  });
};

export const toNonSubscriptionOffering = (
  productInfo: MinimumNonSubscriptionPackageInfo[],
) => {
  return buildOffering(
    productInfo.map((pi) =>
      buildPackage(pi.packageIdentifier, buildNonSubscriptionProduct(pi)),
    ),
  );
};
