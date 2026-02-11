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
import { trialPhaseP1W } from "./fixtures/price-phases";

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
    trial: trialPhaseP1W,
    introPrice: null,
    discountPrice: null,
  };

  test("can get offerings", async () => {
    const purchases = configurePurchases();
    const offerings = await purchases.getOfferings();

    const currentOffering: Offering = {
      paywallComponents: null,
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
      freeTrialPhase: trialPhaseP1W,
      introPricePhase: null,
      discountPricePhase: null,
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
          paywallComponents: null,
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
      freeTrialPhase: trialPhaseP1W,
      introPricePhase: null,
      discountPricePhase: null,
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
          paywallComponents: null,
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
          paywallComponents: null,
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
      paywallComponents: null,
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
      paywallComponents: null,
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

    const offeringProduct =
      offerings.current?.availablePackages[0].webBillingProduct;
    const nonSubscriptionOption = offeringProduct?.defaultNonSubscriptionOption;

    expect(nonSubscriptionOption?.basePrice).toBeDefined();
    expect(nonSubscriptionOption?.discountPrice).toBeNull();
    expect(offeringProduct?.freeTrialPhase).toBeNull();
    expect(offeringProduct?.introPricePhase).toBeNull();
    expect(offeringProduct?.discountPricePhase).toBeNull();
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
      freeTrialPhase: trialPhaseP1W,
      introPricePhase: null,
      discountPricePhase: null,
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
          paywallComponents: null,
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
      paywallComponents: null,
      uiConfig: undefined,
    };

    const expectedOfferings: Offerings = {
      all: {
        offering_1: currentOffering,
      },
      current: currentOffering,
    };

    expect(offerings).toEqual(expectedOfferings);

    const offeringProduct =
      offerings.current?.availablePackages[0].webBillingProduct;
    const subscriptionOption = offeringProduct?.defaultSubscriptionOption;

    expect(subscriptionOption?.base).toBeDefined();

    expect(offeringProduct?.freeTrialPhase).toBeNull();
    expect(subscriptionOption?.trial).toBeNull();

    expect(offeringProduct?.introPricePhase).toBeNull();
    expect(subscriptionOption?.introPrice).toBeNull();

    expect(offeringProduct?.discountPricePhase).toBeNull();
    expect(subscriptionOption?.discountPrice).toBeNull();
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

      // Find the product with intro pricing
      const offeringProduct =
        offerings.all["offering_intro"]?.availablePackages[0].webBillingProduct;
      const subscriptionOption = offeringProduct?.defaultSubscriptionOption;

      const expectedIntroPrice = {
        cycleCount: 3,
        periodDuration: "P1M",
        period: { number: 1, unit: PeriodUnit.Month },
        price: {
          amount: 199,
          amountMicros: 1990000,
          currency: "USD",
          formattedPrice: "$1.99",
        },
        pricePerMonth: expect.objectContaining({ amountMicros: 1990000 }),
        pricePerWeek: expect.objectContaining({ amountMicros: 464333 }),
        pricePerYear: expect.objectContaining({ amountMicros: 24211667 }),
      };

      // Convenience accessors for the intro price phase
      expect(offeringProduct?.introPricePhase).toStrictEqual(
        expectedIntroPrice,
      );
      expect(subscriptionOption?.introPrice).toStrictEqual(expectedIntroPrice);

      expect(offeringProduct?.freeTrialPhase).toBeNull();
      expect(subscriptionOption?.trial).toBeNull();

      expect(offeringProduct?.discountPricePhase).toBeNull();
      expect(subscriptionOption?.discountPrice).toBeNull();
    });

    test("can parse offerings with trial and intro pricing", async () => {
      const purchases = configurePurchases("appUserIdWithTrialAndIntroPricing");
      const offerings = await purchases.getOfferings();

      const offeringProduct =
        offerings.all["offering_trial_intro"]?.availablePackages[0]
          .webBillingProduct;
      const subscriptionOption = offeringProduct?.defaultSubscriptionOption;

      const expectedIntroPrice = {
        cycleCount: 6,
        periodDuration: "P1M",
        period: { number: 1, unit: PeriodUnit.Month },
        price: {
          amount: 499,
          amountMicros: 4990000,
          currency: "USD",
          formattedPrice: "$4.99",
        },
        pricePerMonth: expect.objectContaining({ amountMicros: 4990000 }),
        pricePerWeek: expect.objectContaining({ amountMicros: 1164333 }),
        pricePerYear: expect.objectContaining({ amountMicros: 60711667 }),
      };

      // Convenience accessors for the trial phase
      expect(offeringProduct?.freeTrialPhase).toStrictEqual(trialPhaseP1W);
      expect(subscriptionOption?.trial).toStrictEqual(trialPhaseP1W);

      // Convenience accessors for the intro price phase
      expect(offeringProduct?.introPricePhase).toStrictEqual(
        expectedIntroPrice,
      );
      expect(subscriptionOption?.introPrice).toStrictEqual(expectedIntroPrice);

      expect(offeringProduct?.discountPricePhase).toBeNull();
      expect(subscriptionOption?.discountPrice).toBeNull();
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

    test("can parse offerings with intro price with a null price", async () => {
      const purchases = configurePurchases("appUserIdWithIntroPriceNullPrice");
      const offerings = await purchases.getOfferings();

      const subscriptionOption =
        offerings.all["offering_intro_null_price"]?.availablePackages[0]
          ?.webBillingProduct.defaultSubscriptionOption;

      expect(subscriptionOption?.introPrice).toStrictEqual({
        cycleCount: 3,
        periodDuration: "P1M",
        period: { number: 1, unit: PeriodUnit.Month },
        price: null,
        pricePerMonth: null,
        pricePerWeek: null,
        pricePerYear: null,
      });
    });

    test("can parse offerings with intro price paid upfront", async () => {
      const purchases = configurePurchases("appUserIdWithUpfrontIntroPrice");
      const offerings = await purchases.getOfferings();

      const subscriptionOption =
        offerings.all["offering_intro_upfront"]?.availablePackages[0]
          ?.webBillingProduct.defaultSubscriptionOption;

      expect(subscriptionOption?.introPrice).toStrictEqual({
        cycleCount: 1,
        periodDuration: "P6M",
        period: { number: 6, unit: PeriodUnit.Month },
        price: {
          amount: 699,
          amountMicros: 6990000,
          currency: "USD",
          formattedPrice: "$6.99",
        },
        pricePerMonth: expect.objectContaining({ amountMicros: 1165000 }),
        pricePerWeek: expect.objectContaining({ amountMicros: 271833 }),
        pricePerYear: expect.objectContaining({ amountMicros: 14174167 }),
      });
    });

    test("filters out the offering when purchase option has null base", async () => {
      const purchases = configurePurchases("appUserIdWithNullBase");
      const offerings = await purchases.getOfferings();
      expect(offerings.all["offering_null_base"]).toBeUndefined();
      expect(offerings.current).toBeNull();
    });
  });

  describe("discount pricing support", () => {
    test("can parse offerings with one-time discount", async () => {
      const purchases = configurePurchases("appUserIdWithOneTimeDiscount");
      const offerings = await purchases.getOfferings();

      const {
        defaultSubscriptionOption,
        discountPricePhase,
        freeTrialPhase,
        introPricePhase,
      } =
        offerings.all["offering_one_time_discount"].availablePackages[0]
          .webBillingProduct;

      const expectedDiscountPrice = {
        durationMode: "one_time",
        timeWindow: "P1M",
        name: "One-Time 20% Discount",
        price: {
          amount: 800,
          amountMicros: 8000000,
          currency: "USD",
          formattedPrice: "$8.00",
        },
        period: { number: 1, unit: PeriodUnit.Month },
        cycleCount: 1,
      };

      expect(defaultSubscriptionOption?.discountPrice).toStrictEqual(
        expectedDiscountPrice,
      );
      expect(discountPricePhase).toStrictEqual(expectedDiscountPrice);

      expect(freeTrialPhase).toBeNull();
      expect(defaultSubscriptionOption?.trial).toBeNull();

      expect(introPricePhase).toBeNull();
      expect(defaultSubscriptionOption?.introPrice).toBeNull();
    });

    test("can parse consumable product with one-time discount", async () => {
      const purchases = configurePurchases("appUserIdWithConsumableDiscount");
      const offerings = await purchases.getOfferings();

      const {
        defaultNonSubscriptionOption,
        discountPricePhase,
        freeTrialPhase,
        introPricePhase,
        defaultSubscriptionOption,
      } =
        offerings.all["offering_consumable_discount"].availablePackages[0]
          .webBillingProduct;

      const expectedDiscountPrice = {
        durationMode: "one_time",
        timeWindow: null,
        name: "Consumable 20% Discount",
        price: {
          amount: 80,
          amountMicros: 800000,
          currency: "USD",
          formattedPrice: "$0.80",
        },
        period: null,
        cycleCount: 0,
      };

      expect(defaultNonSubscriptionOption?.discountPrice).toStrictEqual(
        expectedDiscountPrice,
      );
      expect(discountPricePhase).toStrictEqual(expectedDiscountPrice);

      // Consumable products don't have subscription phases
      expect(freeTrialPhase).toBeNull();
      expect(introPricePhase).toBeNull();
      expect(defaultSubscriptionOption).toBeNull();
    });

    test("can parse offerings with time window discount", async () => {
      const purchases = configurePurchases("appUserIdWithTimeWindowDiscount");
      const offerings = await purchases.getOfferings();

      const { defaultSubscriptionOption, discountPricePhase } =
        offerings.all["offering_time_window_discount"].availablePackages[0]
          .webBillingProduct;

      const expectedDiscountPrice = {
        durationMode: "time_window",
        timeWindow: "P3M",
        name: "Holiday Sale 30%",
        price: {
          amount: 700,
          amountMicros: 7000000,
          currency: "USD",
          formattedPrice: "$7.00",
        },
        period: { number: 1, unit: PeriodUnit.Month },
        cycleCount: 3,
      };

      expect(defaultSubscriptionOption?.discountPrice).toStrictEqual(
        expectedDiscountPrice,
      );
      expect(discountPricePhase).toStrictEqual(expectedDiscountPrice);
    });

    test("can parse offerings with forever discount", async () => {
      const purchases = configurePurchases("appUserIdWithForeverDiscount");
      const offerings = await purchases.getOfferings();

      const { defaultSubscriptionOption, discountPricePhase } =
        offerings.all["offering_forever_discount"].availablePackages[0]
          .webBillingProduct;

      const expectedDiscountPrice = {
        durationMode: "forever",
        timeWindow: null,
        name: "Forever 40% Discount",
        price: {
          amount: 600,
          amountMicros: 6000000,
          currency: "USD",
          formattedPrice: "$6.00",
        },
        period: null,
        cycleCount: 0,
      };
      expect(defaultSubscriptionOption?.discountPrice).toStrictEqual(
        expectedDiscountPrice,
      );
      expect(discountPricePhase).toStrictEqual(expectedDiscountPrice);
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
