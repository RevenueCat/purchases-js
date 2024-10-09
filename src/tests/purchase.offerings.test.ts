import { describe, expect, test } from "vitest";
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
import { failTest } from "./test-helpers";
import { ErrorCode, PurchasesError } from "../entities/errors";

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
    },
    trial: {
      cycleCount: 1,
      periodDuration: "P1W",
      period: {
        number: 1,
        unit: PeriodUnit.Week,
      },
      price: null,
    },
  };

  test("can get offerings", async () => {
    const purchases = configurePurchases();
    const offerings = await purchases.getOfferings();

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
    };

    const package2: Package = {
      identifier: "package_2",
      packageType: PackageType.Custom,
      rcBillingProduct: {
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
      },
    };

    const expectedOfferings: Offerings = {
      all: {
        offering_1: currentOffering,
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
        },
      },
      current: currentOffering,
    };

    expect(offerings).toEqual(expectedOfferings);
  });

  test("can get offerings without current offering id", async () => {
    const purchases = configurePurchases("appUserIdWithoutCurrentOfferingId");
    const offerings = await purchases.getOfferings();
    const package2: Package = {
      identifier: "package_2",
      packageType: PackageType.Custom,
      rcBillingProduct: {
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
      },
    };
    const packageWithoutTargeting = createMonthlyPackageMock(null);
    const expectedOfferings: Offerings = {
      all: {
        offering_1: {
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
      () => failTest(),
    );
  });

  test("fails to get offerings with invalid currency", async () => {
    const purchases = configurePurchases();
    await purchases.getOfferings({ currency: "invalid" }).then(
      () => failTest(),
      (e) => {
        expect(e).toBeInstanceOf(PurchasesError);
        expect(e.errorCode).toEqual(ErrorCode.ConfigurationError);
      },
    );
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
      offeringWithPlacement!.availablePackages[0].rcBillingProduct
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
      offeringWithPlacement!.availablePackages[0].rcBillingProduct
        .presentedOfferingContext.placementIdentifier,
    ).toEqual("test_placement_id");
  });
});

describe("getOffering", () => {
  test("gets null offering if offering id is missing", async () => {
    const purchases = configurePurchases();
    const offering = await purchases.getOffering("missing_offering_id");
    expect(offering).toBeNull();
  });

  test("gets correct offering if identifier id is valid", async () => {
    const purchases = configurePurchases();
    const offering = await purchases.getOffering("offering_2");
    expect(offering).not.toBeNull();
    expect(offering?.identifier).toEqual("offering_2");
  });
});
