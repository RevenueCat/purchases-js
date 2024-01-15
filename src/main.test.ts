import { http, HttpResponse, RequestHandler } from "msw";
import { setupServer } from "msw/node";
import { beforeAll, expect, test } from "vitest";
import { Purchases } from "./main";

const STRIPE_TEST_DATA = {
  stripe: { accountId: "acct_123", publishableKey: "pk_123" },
} as const;

const monthlyProductResponse = {
  current_price: {
    amount: 300,
    currency: "USD",
  },
  identifier: "monthly",
  normal_period_duration: "PT1H",
  product_type: "subscription",
  title: "Monthly test",
};

const monthly2ProductResponse = {
  current_price: {
    amount: 500,
    currency: "USD",
  },
  identifier: "monthly_2",
  normal_period_duration: "PT1H",
  product_type: "subscription",
  title: "Monthly test 2",
};

const productsResponse = {
  product_details: [monthlyProductResponse, monthly2ProductResponse],
};

const offeringsArray = [
  {
    identifier: "offering_1",
    description: "Offering 1",
    metadata: null,
    packages: [
      {
        identifier: "package_1",
        platform_product_identifier: "monthly",
      },
    ],
  },
  {
    identifier: "offering_2",
    description: "Offering 2",
    metadata: null,
    packages: [
      {
        identifier: "package_2",
        platform_product_identifier: "monthly_2",
      },
    ],
  },
];

const offeringsResponsesPerUserId: { [userId: string]: object } = {
  someAppUserId: {
    current_offering_id: "offering_1",
    offerings: offeringsArray,
  },
  appUserIdWithoutCurrentOfferingId: {
    current_offering_id: null,
    offerings: offeringsArray,
  },
  appUserIdWithMissingProducts: {
    current_offering_id: "offering_2",
    offerings: offeringsArray,
  },
};

const productsResponsesPerUserId: { [userId: string]: object } = {
  someAppUserId: productsResponse,
  appUserIdWithoutCurrentOfferingId: productsResponse,
  appUserIdWithMissingProducts: { product_details: [monthlyProductResponse] },
};

function getRequestHandlers(): RequestHandler[] {
  const requestHandlers: RequestHandler[] = [];
  Object.keys(offeringsResponsesPerUserId).forEach((userId: string) => {
    const body = offeringsResponsesPerUserId[userId]!;
    requestHandlers.push(
      http.get(
        `http://localhost:8000/v1/subscribers/${userId}/offerings`,
        () => {
          return HttpResponse.json(body, { status: 200 });
        },
      ),
    );
  });

  Object.keys(productsResponsesPerUserId).forEach((userId: string) => {
    const body = productsResponsesPerUserId[userId]!;
    requestHandlers.push(
      http.get(
        `http://localhost:8000/rcbilling/v1/subscribers/${userId}/products?id=monthly&id=monthly_2`,
        () => {
          return HttpResponse.json(body, { status: 200 });
        },
      ),
    );
  });

  return requestHandlers;
}

const server = setupServer(
  ...getRequestHandlers(),

  http.get(
    "http://localhost:8000/rcbilling/v1/entitlements/someAppUserId",
    () => {
      return HttpResponse.json(
        {
          entitlements: [
            {
              created_at: 1699890475771,
              display_name: "Some Entitlement Name",
              id: "ent12345",
              lookup_key: "someEntitlement",
              object: "entitlement",
              project_id: "proj12345",
            },
          ],
        },
        { status: 200 },
      );
    },
  ),

  http.get(
    "http://localhost:8000/rcbilling/v1/entitlements/someOtherAppUserId",
    () => {
      return HttpResponse.json(
        {
          entitlements: [],
        },
        { status: 200 },
      );
    },
  ),

  http.post("http://localhost:8000/rcbilling/v1/subscribe", () => {
    return HttpResponse.json(
      {
        next_action: "collect_payment_info",
        data: {
          client_secret: "seti_123",
        },
      },
      { status: 200 },
    );
  }),
);

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
