import { setupServer } from "msw/node";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import {
  type CustomerInfo,
  type EntitlementInfo,
  type Offering,
  type Offerings,
  type Package,
  PackageType,
  Purchases,
  PurchasesError,
} from "../main";
import { getRequestHandlers } from "./test-responses";
import { UninitializedPurchasesError } from "../entities/errors";
import { PeriodUnit } from "../helpers/duration-helper";

const server = setupServer(...getRequestHandlers());

const testApiKey = "rcb_test_api_key";
const testUserId = "someAppUserId";

function configurePurchases(appUserId: string = testUserId): Purchases {
  return Purchases.configure(testApiKey, appUserId);
}

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  if (Purchases.isConfigured()) {
    Purchases.getSharedInstance().close();
  }
});

describe("Purchases.configure()", () => {
  test("throws error if given invalid api key", () => {
    expect(() => Purchases.configure("goog_api_key", "appUserId")).toThrowError(
      PurchasesError,
    );
    expect(() =>
      Purchases.configure("rcb_test invalidchar", "appUserId"),
    ).toThrowError(PurchasesError);
  });

  test("throws error if given invalid user id", () => {
    expect(() => Purchases.configure(testApiKey, "")).toThrowError(
      PurchasesError,
    );
    expect(() =>
      Purchases.configure(testApiKey, "some/AppUserId"),
    ).toThrowError(PurchasesError);
  });

  test("configures successfully", () => {
    const purchases = Purchases.configure(testApiKey, testUserId);
    expect(purchases).toBeDefined();
  });

  test("configure multiple times returns different instances", () => {
    const purchases = Purchases.configure(testApiKey, testUserId);
    const purchases2 = Purchases.configure(
      "rcb_another_api_key",
      "another_user_id",
    );
    expect(purchases).not.toEqual(purchases2);
  });
});

describe("Purchases.isConfigured()", () => {
  test("returns false if not configured", () => {
    expect(Purchases.isConfigured()).toBeFalsy();
  });

  test("returns true if configured", () => {
    Purchases.configure(testApiKey, testUserId);
    expect(Purchases.isConfigured()).toBeTruthy();
  });
});

describe("Purchases.getSharedInstance()", () => {
  test("throws error if not configured", () => {
    expect(() => Purchases.getSharedInstance()).toThrowError(
      UninitializedPurchasesError,
    );
  });

  test("returns same instance than one returned after initialization", () => {
    const purchases = configurePurchases();
    expect(purchases).toEqual(Purchases.getSharedInstance());
  });
});

describe("Purchases.isEntitledTo", () => {
  test("returns true if a user is entitled", async () => {
    const purchases = configurePurchases();
    const isEntitled = await purchases.isEntitledTo("activeCatServices");
    expect(isEntitled).toBeTruthy();
  });

  test("returns false if a user is not entitled", async () => {
    const purchases = configurePurchases();
    const isEntitled = await purchases.isEntitledTo("expiredEntitlement");
    expect(isEntitled).not.toBeTruthy();
  });
});

describe("Purchases.changeUser", () => {
  test("can change user", () => {
    const newAppUserId = "newAppUserId";
    const purchases = configurePurchases();
    expect(purchases.getAppUserId()).toEqual(testUserId);
    purchases.changeUser(newAppUserId);
    expect(purchases.getAppUserId()).toEqual(newAppUserId);
  });
});

describe("Purchases.getAppUserId()", () => {
  test("returns app user id", () => {
    const purchases = configurePurchases();
    expect(purchases.getAppUserId()).toEqual(testUserId);
  });
});

describe("getOfferings", () => {
  const expectedMonthlyPackage: Package = {
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
  } as Package;

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

    const subscriptionOption = {
      id: "offer_12345",
      base: {
        cycleCount: 1,
        periodDuration: "P1M",
        period: {
          number: 1,
          unit: PeriodUnit.Month,
        },
        price: {
          amount: 500,
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

    const package2: Package = {
      identifier: "package_2",
      packageType: PackageType.Custom,
      rcBillingProduct: {
        currentPrice: {
          currency: "USD",
          amount: 500,
          formattedPrice: "$5.00",
        },
        displayName: "Monthly test 2",
        title: "Monthly test 2",
        description: "monthly description",
        identifier: "monthly_2",
        normalPeriodDuration: "P1M",
        presentedOfferingIdentifier: "offering_2",
        defaultSubscriptionOption: subscriptionOption,
        subscriptionOptions: {
          offer_12345: subscriptionOption,
        },
      },
    };

    expect(offerings).toEqual({
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
    });
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
          formattedPrice: "$5.00",
        },
        displayName: "Monthly test 2",
        title: "Monthly test 2",
        description: "monthly description",
        identifier: "monthly_2",
        normalPeriodDuration: "P1M",
        presentedOfferingIdentifier: "offering_2",
        defaultSubscriptionOption: {
          id: "offer_12345",
          base: {
            cycleCount: 1,
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: PeriodUnit.Month,
            },
            price: {
              amount: 500,
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
        },
        subscriptionOptions: {
          offer_12345: {
            id: "offer_12345",
            base: {
              cycleCount: 1,
              periodDuration: "P1M",
              period: {
                number: 1,
                unit: PeriodUnit.Month,
              },
              price: {
                amount: 500,
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
          },
        },
      },
    };
    const expectedOfferings: Offerings = {
      all: {
        offering_1: {
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

    const offering_1: Offering = {
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
    expect(offerings).toEqual({
      all: {
        offering_1: offering_1,
      },
      current: null,
    });
  });
});

test("can get customer info", async () => {
  const purchases = configurePurchases();
  const customerInfo = await purchases.getCustomerInfo();
  const activeCatServicesEntitlementInfo: EntitlementInfo = {
    identifier: "activeCatServices",
    billingIssueDetectedAt: null,
    isActive: true,
    isSandbox: true,
    periodType: "normal",
    latestPurchaseDate: new Date("2023-12-19T16:48:42Z"),
    originalPurchaseDate: new Date("2023-12-19T16:48:42Z"),
    expirationDate: new Date("2053-12-20T16:48:42Z"),
    productIdentifier: "black_f_friday_worten",
    store: "rc_billing",
    unsubscribeDetectedAt: null,
    willRenew: true,
  };
  const expectedCustomerInfo: CustomerInfo = {
    entitlements: {
      all: {
        expiredCatServices: {
          identifier: "expiredCatServices",
          billingIssueDetectedAt: null,
          isActive: false,
          isSandbox: true,
          periodType: "normal",
          latestPurchaseDate: new Date("2023-12-19T16:48:42Z"),
          originalPurchaseDate: new Date("2023-12-19T16:48:42Z"),
          expirationDate: new Date("2023-12-20T16:48:42Z"),
          productIdentifier: "black_f_friday_worten_2",
          store: "rc_billing",
          unsubscribeDetectedAt: null,
          willRenew: true,
        },
        activeCatServices: activeCatServicesEntitlementInfo,
      },
      active: {
        activeCatServices: activeCatServicesEntitlementInfo,
      },
    },
    activeSubscriptions: new Set(["black_f_friday_worten"]),
    allExpirationDatesByProduct: {
      black_f_friday_worten: new Date("2054-01-22T16:48:42.000Z"),
      black_f_friday_worten_2: new Date("2024-01-22T16:48:42.000Z"),
    },
    allPurchaseDatesByProduct: {
      black_f_friday_worten: new Date("2024-01-21T16:48:42.000Z"),
      black_f_friday_worten_2: new Date("2024-01-21T16:48:42.000Z"),
    },
    managementURL: "https://test-management-url.revenuecat.com",
    originalAppUserId: "someAppUserId",
    requestDate: new Date("2024-01-22T13:23:07Z"),
    firstSeenDate: new Date("2023-11-20T16:48:29Z"),
    originalPurchaseDate: null,
  };
  expect(customerInfo).toEqual(expectedCustomerInfo);
});

describe("Purchases.close()", () => {
  test("can close purchases", () => {
    const purchases = configurePurchases();
    expect(Purchases.isConfigured()).toBeTruthy();
    purchases.close();
    expect(Purchases.isConfigured()).toBeFalsy();
  });
});
