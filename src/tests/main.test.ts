import { setupServer } from "msw/node";
import { beforeAll, describe, expect, test } from "vitest";
import { EntitlementInfo, Purchases } from "../main";
import { getRequestHandlers } from "./test-responses";
import { PackageType } from "../entities/offerings";
import { CustomerInfo } from "../entities/customer-info";

const STRIPE_TEST_DATA = {
  stripe: { accountId: "acct_123", publishableKey: "pk_123" },
} as const;

const server = setupServer(...getRequestHandlers());

beforeAll(() => {
  server.listen();
});

test("Purchases is defined", () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  expect(billing).toBeDefined();
});

test("returns true if a user is entitled", async () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const isEntitled = await billing.isEntitledTo(
    "someAppUserId",
    "someEntitlement",
  );
  expect(isEntitled).toBeTruthy();
});

test("returns false if a user is not entitled", async () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const isEntitled = await billing.isEntitledTo(
    "someOtherAppUserId",
    "someEntitlement",
  );
  expect(isEntitled).not.toBeTruthy();
});

describe("getOfferings", () => {
  const expectedMonthlyPackage = {
    id: "$rc_monthly",
    identifier: "$rc_monthly",
    packageType: PackageType.Monthly,
    rcBillingProduct: {
      currentPrice: {
        currency: "USD",
        amount: 300,
      },
      displayName: "Monthly test",
      id: "monthly",
      identifier: "monthly",
      normalPeriodDuration: "PT1H",
      presentedOfferingIdentifier: "offering_1",
    },
  };
  test("can get offerings", async () => {
    const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
    const offerings = await billing.getOfferings("someAppUserId");

    const currentOffering = {
      displayName: "Offering 1",
      id: "offering_1",
      identifier: "offering_1",
      metadata: null,
      packages: {
        $rc_monthly: expectedMonthlyPackage,
      },
      lifetimePackage: null,
      annualPackage: null,
      sixMonthPackage: null,
      threeMonthPackage: null,
      twoMonthPackage: null,
      monthlyPackage: expectedMonthlyPackage,
      weeklyPackage: null,
    };

    expect(offerings).toEqual({
      all: {
        offering_1: currentOffering,
        offering_2: {
          displayName: "Offering 2",
          id: "offering_2",
          identifier: "offering_2",
          metadata: null,
          packages: {
            package_2: {
              id: "package_2",
              identifier: "package_2",
              packageType: "custom",
              rcBillingProduct: {
                currentPrice: {
                  currency: "USD",
                  amount: 500,
                },
                displayName: "Monthly test 2",
                id: "monthly_2",
                identifier: "monthly_2",
                normalPeriodDuration: "PT1H",
                presentedOfferingIdentifier: "offering_2",
              },
            },
          },
          lifetimePackage: null,
          annualPackage: null,
          sixMonthPackage: null,
          threeMonthPackage: null,
          twoMonthPackage: null,
          monthlyPackage: null,
          weeklyPackage: null,
        },
      },
      current: currentOffering,
    });
  });

  test("can get offerings without current offering id", async () => {
    const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
    const offerings = await billing.getOfferings(
      "appUserIdWithoutCurrentOfferingId",
    );

    expect(offerings).toEqual({
      all: {
        offering_1: {
          displayName: "Offering 1",
          id: "offering_1",
          identifier: "offering_1",
          metadata: null,
          packages: {
            $rc_monthly: expectedMonthlyPackage,
          },
          lifetimePackage: null,
          annualPackage: null,
          sixMonthPackage: null,
          threeMonthPackage: null,
          twoMonthPackage: null,
          monthlyPackage: expectedMonthlyPackage,
          weeklyPackage: null,
        },
        offering_2: {
          displayName: "Offering 2",
          id: "offering_2",
          identifier: "offering_2",
          metadata: null,
          packages: {
            package_2: {
              id: "package_2",
              identifier: "package_2",
              packageType: "custom",
              rcBillingProduct: {
                currentPrice: {
                  currency: "USD",
                  amount: 500,
                },
                displayName: "Monthly test 2",
                id: "monthly_2",
                identifier: "monthly_2",
                normalPeriodDuration: "PT1H",
                presentedOfferingIdentifier: "offering_2",
              },
            },
          },
          lifetimePackage: null,
          annualPackage: null,
          sixMonthPackage: null,
          threeMonthPackage: null,
          twoMonthPackage: null,
          monthlyPackage: null,
          weeklyPackage: null,
        },
      },
      current: null,
    });
  });

  test("can get offerings with missing products", async () => {
    const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
    const offerings = await billing.getOfferings(
      "appUserIdWithMissingProducts",
    );

    const offering_1 = {
      displayName: "Offering 1",
      id: "offering_1",
      identifier: "offering_1",
      metadata: null,
      packages: {
        $rc_monthly: expectedMonthlyPackage,
      },
      lifetimePackage: null,
      annualPackage: null,
      sixMonthPackage: null,
      threeMonthPackage: null,
      twoMonthPackage: null,
      monthlyPackage: expectedMonthlyPackage,
      weeklyPackage: null,
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
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const customerInfo = await billing.getCustomerInfo("someAppUserId");
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
