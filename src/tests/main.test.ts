import { setupServer } from "msw/node";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import {
  CustomerInfo,
  EntitlementInfo,
  Offering,
  Offerings,
  Package,
  PackageType,
  Purchases,
  PurchasesError,
} from "../main";
import { getRequestHandlers } from "./test-responses";
import { UninitializedPurchasesError } from "../entities/errors";

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

  test("configure multiple times returns same instance", () => {
    const purchases = Purchases.configure(testApiKey, testUserId);
    const purchases2 = Purchases.configure(
      "rcb_another_api_key",
      "another_user_id",
    );
    expect(purchases).toEqual(purchases2);
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
      },
      displayName: "Monthly test",
      identifier: "monthly",
      normalPeriodDuration: "PT1H",
      presentedOfferingIdentifier: "offering_1",
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

    const package2 = {
      identifier: "package_2",
      packageType: "custom",
      rcBillingProduct: {
        currentPrice: {
          currency: "USD",
          amount: 500,
        },
        displayName: "Monthly test 2",
        identifier: "monthly_2",
        normalPeriodDuration: "PT1H",
        presentedOfferingIdentifier: "offering_2",
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
    const package2 = {
      identifier: "package_2",
      packageType: PackageType.Custom,
      rcBillingProduct: {
        currentPrice: {
          currency: "USD",
          amount: 500,
        },
        displayName: "Monthly test 2",
        identifier: "monthly_2",
        normalPeriodDuration: "PT1H",
        presentedOfferingIdentifier: "offering_2",
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
    };

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
    isSandbox: false,
    periodType: "normal",
    originalPurchaseDate: new Date("2023-12-19T16:48:42Z"),
    expirationDate: new Date("2053-12-20T16:48:42Z"),
    productIdentifier: "black_f_friday_worten",
    store: "unknown",
    unsubscribeDetectedAt: null,
    willRenew: false,
  };
  const expectedCustomerInfo: CustomerInfo = {
    entitlements: {
      all: {
        expiredCatServices: {
          identifier: "expiredCatServices",
          billingIssueDetectedAt: null,
          isActive: false,
          isSandbox: false,
          periodType: "normal",
          originalPurchaseDate: new Date("2023-12-19T16:48:42Z"),
          expirationDate: new Date("2023-12-20T16:48:42Z"),
          productIdentifier: "black_f_friday_worten_2",
          store: "unknown",
          unsubscribeDetectedAt: null,
          willRenew: false,
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
