import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeAll, expect, test } from "vitest";
import { Purchases } from "./main";

const server = setupServer(
  http.get("http://localhost:8000/rcbilling/v1/offerings", () => {
    return HttpResponse.json(
      {
        offerings: [
          {
            identifier: "offering_1",
            display_name: "Offering 1",
            packages: [
              {
                id: "package_1",
                identifier: "package_1",
                rc_billing_product: {
                  id: "product_1",
                  display_name: "Product 1",
                  current_price: {
                    amount: 100,
                    currency: "USD",
                  },
                  normal_period_duration: "P1M",
                },
              },
            ],
          },
        ],
      },
      { status: 200 },
    );
  }),

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
  const billing = new Purchases("test_api_key");
  expect(billing).toBeDefined();
});

test("returns true if a user is entitled", async () => {
  const billing = new Purchases("test_api_key");
  const isEntitled = await billing.isEntitledTo(
    "someAppUserId",
    "someEntitlement",
  );
  expect(isEntitled).toBeTruthy();
});

test("returns true if a user is entitled and uses waitForEntitlement", async () => {
  const billing = new Purchases("test_api_key");
  const isEntitled = await billing.waitForEntitlement(
    "someAppUserId",
    "someEntitlement",
    2,
  );
  expect(isEntitled).toBeTruthy();
});

test("returns false if a user is not entitled", async () => {
  const billing = new Purchases("test_api_key");
  const isEntitled = await billing.isEntitledTo(
    "someOtherAppUserId",
    "someEntitlement",
  );
  expect(isEntitled).not.toBeTruthy();
});

test("returns false if a user is not entitled and uses waitForEntitlement", async () => {
  const billing = new Purchases("test_api_key");
  const isEntitled = await billing.waitForEntitlement(
    "someOtherAppUserId",
    "someEntitlement",
    2,
  );
  expect(isEntitled).not.toBeTruthy();
});

test("can get offerings", async () => {
  const billing = new Purchases("test_api_key");
  const offerings = await billing.listOfferings();

  expect(offerings).toEqual({
    offerings: [
      {
        displayName: "Offering 1",
        id: undefined,
        identifier: "offering_1",
        packages: [
          {
            displayName: undefined,
            id: "package_1",
            identifier: "package_1",
            rcBillingProduct: {
              currentPrice: {
                currency: "USD",
                amount: 100,
              },
              displayName: "Product 1",
              id: "product_1",
              normalPeriodDuration: "P1M",
            },
          },
        ],
      },
    ],
    priceByPackageId: undefined,
  });
});

test("can post to subscribe", async () => {
  const billing = new Purchases("test_api_key");
  const subscribeResponse = await billing.subscribe(
    "someAppUserId",
    "product_1",
  );

  expect(subscribeResponse).toEqual({
    nextAction: "collect_payment_info",
    data: {
      clientSecret: "seti_123",
    },
  });
});

test("can get a specific Package", async () => {
  const purchases = new Purchases("test_api_key");
  const pkg = await purchases.getPackage("package_1");
  expect(pkg).not.toBeNull();
  expect(pkg?.identifier).toBe("package_1");
});

test("returns null for Package not found", async () => {
  const purchases = new Purchases("test_api_key");
  const pkg = await purchases.getPackage("package_not_there");
  expect(pkg).toBeNull();
});
