import { setupServer } from "msw/node";
import { beforeAll, expect, test } from "vitest";
import { Purchases } from "../main";
import { getRequestHandlers } from "./test-responses";

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

test("can get offerings", async () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const offerings = await billing.getOfferings("someAppUserId");

  const currentOffering = {
    displayName: "Offering 1",
    id: "offering_1",
    identifier: "offering_1",
    packages: [
      {
        id: "package_1",
        identifier: "package_1",
        rcBillingProduct: {
          currentPrice: {
            currency: "USD",
            amount: 300,
          },
          displayName: "Monthly test",
          id: "monthly",
          identifier: "monthly",
          normalPeriodDuration: "PT1H",
        },
      },
    ],
  };

  expect(offerings).toEqual({
    all: {
      offering_1: currentOffering,
      offering_2: {
        displayName: "Offering 2",
        id: "offering_2",
        identifier: "offering_2",
        packages: [
          {
            id: "package_2",
            identifier: "package_2",
            rcBillingProduct: {
              currentPrice: {
                currency: "USD",
                amount: 500,
              },
              displayName: "Monthly test 2",
              id: "monthly_2",
              identifier: "monthly_2",
              normalPeriodDuration: "PT1H",
            },
          },
        ],
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
        packages: [
          {
            id: "package_1",
            identifier: "package_1",
            rcBillingProduct: {
              currentPrice: {
                currency: "USD",
                amount: 300,
              },
              displayName: "Monthly test",
              id: "monthly",
              identifier: "monthly",
              normalPeriodDuration: "PT1H",
            },
          },
        ],
      },
      offering_2: {
        displayName: "Offering 2",
        id: "offering_2",
        identifier: "offering_2",
        packages: [
          {
            id: "package_2",
            identifier: "package_2",
            rcBillingProduct: {
              currentPrice: {
                currency: "USD",
                amount: 500,
              },
              displayName: "Monthly test 2",
              id: "monthly_2",
              identifier: "monthly_2",
              normalPeriodDuration: "PT1H",
            },
          },
        ],
      },
    },
    current: null,
  });
});

test("can get offerings with missing products", async () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const offerings = await billing.getOfferings("appUserIdWithMissingProducts");

  const offering_1 = {
    displayName: "Offering 1",
    id: "offering_1",
    identifier: "offering_1",
    packages: [
      {
        id: "package_1",
        identifier: "package_1",
        rcBillingProduct: {
          currentPrice: {
            currency: "USD",
            amount: 300,
          },
          displayName: "Monthly test",
          id: "monthly",
          identifier: "monthly",
          normalPeriodDuration: "PT1H",
        },
      },
    ],
  };
  expect(offerings).toEqual({
    all: {
      offering_1: offering_1,
    },
    current: null,
  });
});

test("can get customer info", async () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const customerInfo = await billing.getCustomerInfo("someAppUserId");
  const activeCatServicesEntitlementInfo = {
    identifier: "activeCatServices",
    isActive: true,
    originalPurchaseDate: new Date("2023-12-19T16:48:42Z"),
    expirationDate: new Date("2053-12-20T16:48:42Z"),
    productIdentifier: "black_f_friday_worten",
  };
  expect(customerInfo).toEqual({
    entitlements: {
      all: {
        expiredCatServices: {
          identifier: "expiredCatServices",
          isActive: false,
          originalPurchaseDate: new Date("2023-12-19T16:48:42Z"),
          expirationDate: new Date("2023-12-20T16:48:42Z"),
          productIdentifier: "black_f_friday_worten_2",
        },
        activeCatServices: activeCatServicesEntitlementInfo,
      },
      active: {
        activeCatServices: activeCatServicesEntitlementInfo,
      },
    },
    managementURL: "https://test-management-url.revenuecat.com",
    requestDate: new Date("2024-01-22T13:23:07Z"),
    firstSeenDate: new Date("2023-11-20T16:48:29Z"),
    originalPurchaseDate: null,
  });
});
