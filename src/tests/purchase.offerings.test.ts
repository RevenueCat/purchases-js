import { assert, describe, expect, test } from "vitest";
import {
  createConsumablePackageMock,
  createMonthlyPackageMock,
} from "./mocks/offering-mock-provider";
import { configurePurchases } from "./base.purchases_test";
import {
  type Offering,
  type Offerings,
  type Package,
  PackageType,
  ProductType,
} from "../entities/offerings";
import { PeriodUnit } from "../helpers/duration-helper";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { OfferingKeyword } from "../entities/get-offerings-params";

describe("getOfferings", () => {
  const expectedMonthlyPackage = createMonthlyPackageMock();

  const subscriptionOption = {
    id: "offer_12345",
    priceId: "test_price_id",
    base: {
      cycleCount: 1,
      periodDuration: "P1M",
      period: {
        number: 1,
        unit: PeriodUnit.Month,
      },
      price: {
        amount: 500,
        amountMicros: 5000000,
        currency: "USD",
        formattedPrice: "$5.00",
      },
      pricePerWeek: {
        amount: 116.6667,
        amountMicros: 1166667,
        currency: "USD",
        formattedPrice: "$1.17",
      },
      pricePerMonth: {
        amount: 500,
        amountMicros: 5000000,
        currency: "USD",
        formattedPrice: "$5.00",
      },
      pricePerYear: {
        amount: 6083.3333,
        amountMicros: 60833333,
        currency: "USD",
        formattedPrice: "$60.83",
      },
    },
    trial: {
      cycleCount: 1,
      periodDuration: "P1W",
      period: {
        number: 1,
        unit: PeriodUnit.Week,
      },
      price: null,
      pricePerWeek: null,
      pricePerMonth: null,
      pricePerYear: null,
    },
    introPrice: null,
  };

  test("can get offerings", async () => {
    const purchases = configurePurchases();
    const offerings = await purchases.getOfferings();

    const currentOffering: Offering = {
      paywall_components: null,
      serverDescription: "Offering 1",
      identifier: "offering_1",
      metadata: null,
      packagesById: {
        $rc_monthly: expectedMonthlyPackage,
      },
      availablePackages: [expectedMonthlyPackage],
      lifetime: null,
      annual: null,
      sixMonth: null,
      threeMonth: null,
      twoMonth: null,
      monthly: expectedMonthlyPackage,
      weekly: null,
    };

    const webBillingProduct = {
      currentPrice: {
        currency: "USD",
        amount: 500,
        amountMicros: 5000000,
        formattedPrice: "$5.00",
      },
      displayName: "Monthly test 2",
      title: "Monthly test 2",
      description: "monthly description",
      identifier: "monthly_2",
      productType: ProductType.Subscription,
      normalPeriodDuration: "P1M",
      presentedOfferingIdentifier: "offering_2",
      presentedOfferingContext: {
        offeringIdentifier: "offering_2",
        targetingContext: null,
        placementIdentifier: null,
      },
      defaultPurchaseOption: subscriptionOption,
      defaultSubscriptionOption: subscriptionOption,
      defaultNonSubscriptionOption: null,
      subscriptionOptions: {
        offer_12345: subscriptionOption,
      },
      price: {
        currency: "USD",
        amount: 500,
        amountMicros: 5000000,
        formattedPrice: "$5.00",
      },
      period: {
        number: 1,
        unit: PeriodUnit.Month,
      },
      freeTrialPhase: {
        cycleCount: 1,
        periodDuration: "P1W",
        period: {
          number: 1,
          unit: PeriodUnit.Week,
        },
        price: null,
        pricePerWeek: null,
        pricePerMonth: null,
        pricePerYear: null,
      },
      introPricePhase: null,
    };

    const package2: Package = {
      identifier: "package_2",
      packageType: PackageType.Custom,
      rcBillingProduct: webBillingProduct,
      webBillingProduct: webBillingProduct,
    };

    const expectedOfferings: Offerings = {
      all: {
        offering_1: currentOffering,
        offering_2: {
          paywall_components: null,
          serverDescription: "Offering 2",
          identifier: "offering_2",
          metadata: null,
          packagesById: {
            package_2: package2,
          },
          availablePackages: [package2],
          lifetime: null,
          annual: null,
          sixMonth: null,
          threeMonth: null,
          twoMonth: null,
          monthly: null,
          weekly: null,
        },
      },
      current: currentOffering,
    };

    expect(offerings).toEqual(expectedOfferings);
  });

  test("can get offerings without current offering id", async () => {
    const purchases = configurePurchases("appUserIdWithoutCurrentOfferingId");
    const offerings = await purchases.getOfferings();

    const webBillingProduct = {
      currentPrice: {
        currency: "USD",
        amount: 500,
        amountMicros: 5000000,
        formattedPrice: "$5.00",
      },
      displayName: "Monthly test 2",
      title: "Monthly test 2",
      description: "monthly description",
      identifier: "monthly_2",
      productType: ProductType.Subscription,
      normalPeriodDuration: "P1M",
      presentedOfferingIdentifier: "offering_2",
      presentedOfferingContext: {
        offeringIdentifier: "offering_2",
        targetingContext: null,
        placementIdentifier: null,
      },
      defaultPurchaseOption: subscriptionOption,
      defaultSubscriptionOption: subscriptionOption,
      defaultNonSubscriptionOption: null,
      subscriptionOptions: {
        offer_12345: subscriptionOption,
      },
      price: {
        currency: "USD",
        amount: 500,
        amountMicros: 5000000,
        formattedPrice: "$5.00",
      },
      period: {
        number: 1,
        unit: PeriodUnit.Month,
      },
      freeTrialPhase: {
        cycleCount: 1,
        periodDuration: "P1W",
        period: {
          number: 1,
          unit: PeriodUnit.Week,
        },
        price: null,
        pricePerWeek: null,
        pricePerMonth: null,
        pricePerYear: null,
      },
      introPricePhase: null,
    };
    const package2: Package = {
      identifier: "package_2",
      packageType: PackageType.Custom,
      rcBillingProduct: webBillingProduct,
      webBillingProduct: webBillingProduct,
    };
    const packageWithoutTargeting = createMonthlyPackageMock(null);
    const expectedOfferings: Offerings = {
      all: {
        offering_1: {
          paywall_components: null,
          serverDescription: "Offering 1",
          identifier: "offering_1",
          metadata: null,
          packagesById: {
            $rc_monthly: packageWithoutTargeting,
          },
          availablePackages: [packageWithoutTargeting],
          lifetime: null,
          annual: null,
          sixMonth: null,
          threeMonth: null,
          twoMonth: null,
          monthly: packageWithoutTargeting,
          weekly: null,
        },
        offering_2: {
          paywall_components: null,
          serverDescription: "Offering 2",
          identifier: "offering_2",
          metadata: null,
          packagesById: {
            package_2: package2,
          },
          availablePackages: [package2],
          lifetime: null,
          annual: null,
          sixMonth: null,
          threeMonth: null,
          twoMonth: null,
          monthly: null,
          weekly: null,
        },
      },
      current: null,
    } as Offerings;

    expect(offerings).toEqual(expectedOfferings);
  });

  test("can get offerings with missing products", async () => {
    const purchases = configurePurchases("appUserIdWithMissingProducts");
    const offerings = await purchases.getOfferings();

    const packageWithoutTargeting = createMonthlyPackageMock(null);

    const offering_1: Offering = {
      paywall_components: null,
      serverDescription: "Offering 1",
      identifier: "offering_1",
      metadata: null,
      packagesById: {
        $rc_monthly: packageWithoutTargeting,
      },
      availablePackages: [packageWithoutTargeting],
      lifetime: null,
      annual: null,
      sixMonth: null,
      threeMonth: null,
      twoMonth: null,
      monthly: packageWithoutTargeting,
      weekly: null,
    };
    expect(offerings).toEqual({
      all: {
        offering_1: offering_1,
      },
      current: null,
    });
  });

  test("can get offering with consumable product", async () => {
    const purchases = configurePurchases(
      "appUserIdWithNonSubscriptionProducts",
    );
    const offerings = await purchases.getOfferings();
    const expectedConsumablePackage = createConsumablePackageMock();
    const expectedOffering: Offering = {
      paywall_components: null,
      serverDescription: "Offering consumable",
      identifier: "offering_consumables",
      metadata: null,
      packagesById: {
        "test-consumable-package": expectedConsumablePackage,
      },
      availablePackages: [expectedConsumablePackage],
      lifetime: null,
      annual: null,
      sixMonth: null,
      threeMonth: null,
      twoMonth: null,
      monthly: null,
      weekly: null,
    };
    expect(offerings).toEqual({
      all: {
        offering_consumables: expectedOffering,
      },
      current: expectedOffering,
    });
  });

  test("gets offerings with valid currency", async () => {
    const purchases = configurePurchases();
    await purchases.getOfferings({ currency: "EUR" }).then(
      (offerings) => {
        expect(offerings.current).not.toBeNull();
      },
      () => assert.fail("Getting offerings with valid currency failed"),
    );
  });

  test("fails to get offerings with invalid currency", async () => {
    const purchases = configurePurchases();
    await purchases.getOfferings({ currency: "invalid" }).then(
      () => assert.fail("Promise was expected to raise an error"),
      (e) => {
        expect(e).toBeInstanceOf(PurchasesError);
        expect(e.errorCode).toEqual(ErrorCode.ConfigurationError);
      },
    );
  });

  test("can get offerings with a specific offering identifier", async () => {
    const purchases = configurePurchases();
    const offerings = await purchases.getOfferings({
      offeringIdentifier: "offering_2",
    });

    const webBillingProduct = {
      currentPrice: {
        currency: "USD",
        amount: 500,
        amountMicros: 5000000,
        formattedPrice: "$5.00",
      },
      displayName: "Monthly test 2",
      title: "Monthly test 2",
      description: "monthly description",
      identifier: "monthly_2",
      productType: ProductType.Subscription,
      normalPeriodDuration: "P1M",
      presentedOfferingIdentifier: "offering_2",
      presentedOfferingContext: {
        offeringIdentifier: "offering_2",
        targetingContext: null,
        placementIdentifier: null,
      },
      defaultPurchaseOption: subscriptionOption,
      defaultSubscriptionOption: subscriptionOption,
      defaultNonSubscriptionOption: null,
      subscriptionOptions: {
        offer_12345: subscriptionOption,
      },
      price: {
        currency: "USD",
        amount: 500,
        amountMicros: 5000000,
        formattedPrice: "$5.00",
      },
      period: {
        number: 1,
        unit: PeriodUnit.Month,
      },
      freeTrialPhase: {
        cycleCount: 1,
        periodDuration: "P1W",
        period: {
          number: 1,
          unit: PeriodUnit.Week,
        },
        price: null,
        pricePerWeek: null,
        pricePerMonth: null,
        pricePerYear: null,
      },
      introPricePhase: null,
    };

    const package2: Package = {
      identifier: "package_2",
      packageType: PackageType.Custom,
      rcBillingProduct: webBillingProduct,
      webBillingProduct: webBillingProduct,
    };

    const expectedOfferings: Offerings = {
      all: {
        offering_2: {
          serverDescription: "Offering 2",
          identifier: "offering_2",
          metadata: null,
          packagesById: {
            package_2: package2,
          },
          availablePackages: [package2],
          lifetime: null,
          annual: null,
          sixMonth: null,
          threeMonth: null,
          twoMonth: null,
          monthly: null,
          weekly: null,
          paywall_components: null,
        },
      },
      current: null,
    };

    expect(offerings).toEqual(expectedOfferings);
  });
  test("can get just current offering", async () => {
    const purchases = configurePurchases();
    const offerings = await purchases.getOfferings({
      offeringIdentifier: OfferingKeyword.Current,
    });

    const currentOffering: Offering = {
      serverDescription: "Offering 1",
      identifier: "offering_1",
      metadata: null,
      packagesById: {
        $rc_monthly: expectedMonthlyPackage,
      },
      availablePackages: [expectedMonthlyPackage],
      lifetime: null,
      annual: null,
      sixMonth: null,
      threeMonth: null,
      twoMonth: null,
      monthly: expectedMonthlyPackage,
      weekly: null,
      paywall_components: null,
    };

    const expectedOfferings: Offerings = {
      all: {
        offering_1: currentOffering,
      },
      current: currentOffering,
    };

    expect(offerings).toEqual(expectedOfferings);
  });

  test("returns no offerings when offering identifier is invalid", async () => {
    const purchases = configurePurchases();
    const offerings = await purchases.getOfferings({
      offeringIdentifier: "invalid_offering",
    });

    expect(Object.keys(offerings.all).length).toBe(0);
    expect(offerings.current).toBeNull();
  });

  describe("intro pricing support", () => {
    test("can parse offerings with intro pricing", async () => {
      const purchases = configurePurchases("appUserIdWithIntroPricing");
      const offerings = await purchases.getOfferings();

      // Find the offering with intro pricing
      const introOffering = offerings.all["offering_intro"];
      expect(introOffering).toBeDefined();

      const introPackage = introOffering.availablePackages[0];
      expect(introPackage).toBeDefined();

      const subscriptionOption =
        introPackage.webBillingProduct.defaultSubscriptionOption;
      expect(subscriptionOption).toBeDefined();
      expect(subscriptionOption!.introPrice).toBeDefined();
      expect(subscriptionOption!.introPrice!.price).toBeDefined();
      expect(subscriptionOption!.introPrice!.cycleCount).toBeGreaterThan(0);
    });

    test("can parse offerings with trial and intro pricing", async () => {
      const purchases = configurePurchases("appUserIdWithTrialAndIntroPricing");
      const offerings = await purchases.getOfferings();

      const trialIntroOffering = offerings.all["offering_trial_intro"];
      expect(trialIntroOffering).toBeDefined();

      const trialIntroPackage = trialIntroOffering.availablePackages[0];
      expect(trialIntroPackage).toBeDefined();

      const subscriptionOption =
        trialIntroPackage.webBillingProduct.defaultSubscriptionOption;
      expect(subscriptionOption).toBeDefined();

      // Verify both trial and intro price are present
      expect(subscriptionOption!.trial).toBeDefined();
      expect(subscriptionOption!.trial!.price).toBeNull();
      expect(subscriptionOption!.introPrice).toBeDefined();
      expect(subscriptionOption!.introPrice!.price).toBeDefined();
    });

    test("maintains backward compatibility with options without intro pricing", async () => {
      const purchases = configurePurchases();
      const offerings = await purchases.getOfferings();

      const currentOffering = offerings.current;
      expect(currentOffering).toBeDefined();

      const monthlyPackage = currentOffering!.monthly;
      expect(monthlyPackage).toBeDefined();

      const subscriptionOption =
        monthlyPackage!.webBillingProduct.defaultSubscriptionOption;
      expect(subscriptionOption).toBeDefined();
      expect(subscriptionOption!.introPrice).toBeNull();
    });
  });
});

describe("getOfferings placements", () => {
  test("gets fallback offering if placement id is missing", async () => {
    const purchases = configurePurchases();
    const offeringWithPlacement =
      await purchases.getCurrentOfferingForPlacement("missing_placement_id");
    expect(offeringWithPlacement).not.toBeNull();
    expect(offeringWithPlacement?.identifier).toEqual("offering_1");
    expect(
      offeringWithPlacement!.availablePackages[0].webBillingProduct
        .presentedOfferingContext.placementIdentifier,
    ).toEqual("missing_placement_id");
  });

  test("gets null offering if placement id has null offering id", async () => {
    const purchases = configurePurchases();
    const offeringWithPlacement =
      await purchases.getCurrentOfferingForPlacement("test_null_placement_id");
    expect(offeringWithPlacement).toBeNull();
  });

  test("gets correct offering if placement id is valid", async () => {
    const purchases = configurePurchases();
    const offeringWithPlacement =
      await purchases.getCurrentOfferingForPlacement("test_placement_id");
    expect(offeringWithPlacement).not.toBeNull();
    expect(offeringWithPlacement?.identifier).toEqual("offering_2");
    expect(
      offeringWithPlacement!.availablePackages[0].webBillingProduct
        .presentedOfferingContext.placementIdentifier,
    ).toEqual("test_placement_id");
  });
});
