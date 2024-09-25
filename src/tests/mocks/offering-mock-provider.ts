import {
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
    },
    trial: null,
  };
  return {
    identifier: "$rc_monthly",
    packageType: PackageType.Monthly,
    rcBillingProduct: {
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
    },
  };
}
