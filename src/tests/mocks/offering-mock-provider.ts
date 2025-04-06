import {
  type NonSubscriptionOption,
  type Package,
  PackageType,
  ProductType,
  type SubscriptionOption,
  type TargetingContext,
} from "../../entities/offerings";
import { PeriodUnit } from "../../helpers/duration-helper";

export function createMonthlyPackageMock(
  targetingContext: TargetingContext | null = {
    ruleId: "test_rule_id",
    revision: 123,
  },
): Package {
  const subscriptionOption: SubscriptionOption = {
    id: "base_option",
    priceId: "test_price_id",
    base: {
      cycleCount: 1,
      periodDuration: "P1M",
      period: {
        number: 1,
        unit: PeriodUnit.Month,
      },
      price: {
        amount: 300,
        amountMicros: 3000000,
        currency: "USD",
        formattedPrice: "$3.00",
      },
      pricePerWeek: {
        amount: 68.9882,
        amountMicros: 689882,
        currency: "USD",
        formattedPrice: "$0.69",
      },
      pricePerMonth: {
        amount: 300,
        amountMicros: 3000000,
        currency: "USD",
        formattedPrice: "$3.00",
      },
      pricePerYear: {
        amount: 3599.7043,
        amountMicros: 35997043,
        currency: "USD",
        formattedPrice: "$36.00",
      },
    },
    trial: null,
  };

  const webBillingProduct = {
    currentPrice: {
      currency: "USD",
      amount: 300,
      amountMicros: 3000000,
      formattedPrice: "$3.00",
    },
    displayName: "Monthly test",
    title: "Monthly test",
    description: null,
    identifier: "monthly",
    productType: ProductType.Subscription,
    normalPeriodDuration: "P1M",
    presentedOfferingIdentifier: "offering_1",
    presentedOfferingContext: {
      offeringIdentifier: "offering_1",
      targetingContext: targetingContext,
      placementIdentifier: null,
    },
    defaultPurchaseOption: subscriptionOption,
    defaultSubscriptionOption: subscriptionOption,
    defaultNonSubscriptionOption: null,
    subscriptionOptions: {
      base_option: subscriptionOption,
    },
  };

  return {
    identifier: "$rc_monthly",
    packageType: PackageType.Monthly,
    rcBillingProduct: webBillingProduct,
    webBillingProduct: webBillingProduct,
  };
}

export function createConsumablePackageMock(): Package {
  const webBillingProduct = {
    currentPrice: {
      currency: "USD",
      amount: 100,
      amountMicros: 1000000,
      formattedPrice: "$1.00",
    },
    displayName: "Consumable test",
    title: "Consumable test",
    description: "Consumable description",
    identifier: "test-consumable-product",
    productType: ProductType.Consumable,
    normalPeriodDuration: null,
    presentedOfferingIdentifier: "offering_consumables",
    presentedOfferingContext: {
      offeringIdentifier: "offering_consumables",
      placementIdentifier: null,
      targetingContext: null,
    },
    defaultPurchaseOption: {
      id: "base_option",
      priceId: "test_price_id",
      basePrice: {
        amount: 100,
        amountMicros: 1000000,
        currency: "USD",
        formattedPrice: "$1.00",
      },
    } as NonSubscriptionOption,
    defaultSubscriptionOption: null,
    defaultNonSubscriptionOption: {
      id: "base_option",
      priceId: "test_price_id",
      basePrice: {
        amount: 100,
        amountMicros: 1000000,
        currency: "USD",
        formattedPrice: "$1.00",
      },
    },
    subscriptionOptions: {},
  };

  return {
    identifier: "test-consumable-package",
    packageType: PackageType.Custom,
    rcBillingProduct: webBillingProduct,
    webBillingProduct: webBillingProduct,
  };
}
