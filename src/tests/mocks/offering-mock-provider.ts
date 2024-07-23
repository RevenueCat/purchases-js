import {
  type Package,
  PackageType,
  type TargetingContext,
} from "../../entities/offerings";
import { PeriodUnit } from "../../helpers/duration-helper";

export function createMonthlyPackageMock(
  targetingContext: TargetingContext | null = {
    ruleId: "test_rule_id",
    revision: 123,
  },
): Package {
  return {
    identifier: "$rc_monthly",
    packageType: PackageType.Monthly,
    rcBillingProduct: {
      currentPrice: {
        currency: "USD",
        amount: 300,
        formattedPrice: "$3.00",
      },
      displayName: "Monthly test",
      title: "Monthly test",
      description: null,
      identifier: "monthly",
      normalPeriodDuration: "P1M",
      presentedOfferingIdentifier: "offering_1",
      presentedOfferingContext: {
        offeringIdentifier: "offering_1",
        targetingContext: targetingContext,
      },
      defaultSubscriptionOption: {
        id: "base_option",
        base: {
          cycleCount: 1,
          periodDuration: "P1M",
          period: {
            number: 1,
            unit: PeriodUnit.Month,
          },
          price: {
            amount: 300,
            currency: "USD",
            formattedPrice: "$3.00",
          },
        },
        trial: null,
      },
      subscriptionOptions: {
        base_option: {
          id: "base_option",
          base: {
            cycleCount: 1,
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: PeriodUnit.Month,
            },
            price: {
              amount: 300,
              currency: "USD",
              formattedPrice: "$3.00",
            },
          },
          trial: null,
        },
      },
    },
  };
}
