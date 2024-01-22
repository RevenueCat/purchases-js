import { setupServer } from "msw/node";
import { beforeAll, expect, test } from "vitest";
import { Purchases } from "../main";
import { getRequestHandlers } from "./test-responses.test";

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

test("returns true if a user is entitled and uses waitForEntitlement", async () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const isEntitled = await billing.waitForEntitlement(
    "someAppUserId",
    "someEntitlement",
    2,
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

test("returns false if a user is not entitled and uses waitForEntitlement", async () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const isEntitled = await billing.waitForEntitlement(
    "someOtherAppUserId",
    "someEntitlement",
    2,
  );
  expect(isEntitled).not.toBeTruthy();
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

test("can post to subscribe", async () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const subscribeResponse = await billing.subscribe(
    "someAppUserId",
    "product_1",
    "someone@somewhere.com",
  );

  expect(subscribeResponse).toEqual({
    nextAction: "collect_payment_info",
    data: {
      clientSecret: "seti_123",
    },
  });
});
