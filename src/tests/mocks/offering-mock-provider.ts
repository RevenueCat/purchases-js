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
        amount: 70,
        amountMicros: 700000,
        currency: "USD",
        formattedPrice: "$0.70",
      },
      pricePerMonth: {
        amount: 300,
        amountMicros: 3000000,
        currency: "USD",
        formattedPrice: "$3.00",
      },
      pricePerYear: {
        amount: 3650,
        amountMicros: 36500000,
        currency: "USD",
        formattedPrice: "$36.50",
      },
    },
    trial: null,
    introPrice: null,
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

export function createMonthlyPackageWithIntroPriceMock(): Package {
  const subscriptionOptionWithIntroPrice: SubscriptionOption = {
    id: "intro_option",
    priceId: "test_intro_price_id",
    base: {
      cycleCount: 1,
      periodDuration: "P1M",
      period: {
        number: 1,
        unit: PeriodUnit.Month,
      },
      price: {
        amount: 999,
        amountMicros: 9990000,
        currency: "USD",
        formattedPrice: "$9.99",
      },
      pricePerWeek: {
        amount: 230,
        amountMicros: 2300000,
        currency: "USD",
        formattedPrice: "$2.30",
      },
      pricePerMonth: {
        amount: 999,
        amountMicros: 9990000,
        currency: "USD",
        formattedPrice: "$9.99",
      },
      pricePerYear: {
        amount: 11988,
        amountMicros: 119880000,
        currency: "USD",
        formattedPrice: "$119.88",
      },
    },
    trial: null,
    introPrice: {
      periodDuration: "P1M",
      period: {
        number: 1,
        unit: PeriodUnit.Month,
      },
      cycleCount: 3,
      price: {
        amount: 199,
        amountMicros: 1990000,
        currency: "USD",
        formattedPrice: "$1.99",
      },
      pricePerWeek: {
        amount: 46,
        amountMicros: 460000,
        currency: "USD",
        formattedPrice: "$0.46",
      },
      pricePerMonth: {
        amount: 199,
        amountMicros: 1990000,
        currency: "USD",
        formattedPrice: "$1.99",
      },
      pricePerYear: {
        amount: 2388,
        amountMicros: 23880000,
        currency: "USD",
        formattedPrice: "$23.88",
      },
    },
  };

  const webBillingProduct = {
    currentPrice: {
      currency: "USD",
      amount: 999,
      amountMicros: 9990000,
      formattedPrice: "$9.99",
    },
    displayName: "Monthly with Intro Price",
    title: "Monthly with Intro Price",
    description: "Monthly subscription with introductory pricing",
    identifier: "monthly_intro",
    productType: ProductType.Subscription,
    normalPeriodDuration: "P1M",
    presentedOfferingIdentifier: "offering_intro",
    presentedOfferingContext: {
      offeringIdentifier: "offering_intro",
      targetingContext: {
        ruleId: "test_intro_rule_id",
        revision: 456,
      },
      placementIdentifier: null,
    },
    defaultPurchaseOption: subscriptionOptionWithIntroPrice,
    defaultSubscriptionOption: subscriptionOptionWithIntroPrice,
    defaultNonSubscriptionOption: null,
    subscriptionOptions: {
      intro_option: subscriptionOptionWithIntroPrice,
    },
  };

  return {
    identifier: "$rc_monthly_intro",
    packageType: PackageType.Monthly,
    rcBillingProduct: webBillingProduct,
    webBillingProduct: webBillingProduct,
  };
}

export function createMonthlyPackageWithTrialAndIntroPriceMock(): Package {
  const subscriptionOptionWithTrialAndIntroPrice: SubscriptionOption = {
    id: "trial_intro_option",
    priceId: "test_trial_intro_price_id",
    base: {
      cycleCount: 1,
      periodDuration: "P1M",
      period: {
        number: 1,
        unit: PeriodUnit.Month,
      },
      price: {
        amount: 1499,
        amountMicros: 14990000,
        currency: "USD",
        formattedPrice: "$14.99",
      },
      pricePerWeek: {
        amount: 346,
        amountMicros: 3460000,
        currency: "USD",
        formattedPrice: "$3.46",
      },
      pricePerMonth: {
        amount: 1499,
        amountMicros: 14990000,
        currency: "USD",
        formattedPrice: "$14.99",
      },
      pricePerYear: {
        amount: 17988,
        amountMicros: 179880000,
        currency: "USD",
        formattedPrice: "$179.88",
      },
    },
    trial: {
      periodDuration: "P1W",
      period: {
        number: 1,
        unit: PeriodUnit.Week,
      },
      cycleCount: 1,
      price: null,
      pricePerWeek: null,
      pricePerMonth: null,
      pricePerYear: null,
    },
    introPrice: {
      periodDuration: "P1M",
      period: {
        number: 1,
        unit: PeriodUnit.Month,
      },
      cycleCount: 6,
      price: {
        amount: 499,
        amountMicros: 4990000,
        currency: "USD",
        formattedPrice: "$4.99",
      },
      pricePerWeek: {
        amount: 115,
        amountMicros: 1150000,
        currency: "USD",
        formattedPrice: "$1.15",
      },
      pricePerMonth: {
        amount: 499,
        amountMicros: 4990000,
        currency: "USD",
        formattedPrice: "$4.99",
      },
      pricePerYear: {
        amount: 5988,
        amountMicros: 59880000,
        currency: "USD",
        formattedPrice: "$59.88",
      },
    },
  };

  const webBillingProduct = {
    currentPrice: {
      currency: "USD",
      amount: 1499,
      amountMicros: 14990000,
      formattedPrice: "$14.99",
    },
    displayName: "Monthly with Trial and Intro Price",
    title: "Monthly with Trial and Intro Price",
    description: "Monthly subscription with trial and intro pricing",
    identifier: "monthly_trial_intro",
    productType: ProductType.Subscription,
    normalPeriodDuration: "P1M",
    presentedOfferingIdentifier: "offering_trial_intro",
    presentedOfferingContext: {
      offeringIdentifier: "offering_trial_intro",
      targetingContext: {
        ruleId: "test_trial_intro_rule_id",
        revision: 789,
      },
      placementIdentifier: null,
    },
    defaultPurchaseOption: subscriptionOptionWithTrialAndIntroPrice,
    defaultSubscriptionOption: subscriptionOptionWithTrialAndIntroPrice,
    defaultNonSubscriptionOption: null,
    subscriptionOptions: {
      trial_intro_option: subscriptionOptionWithTrialAndIntroPrice,
    },
  };

  return {
    identifier: "$rc_monthly_trial_intro",
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
