import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeAll, expect, test } from "vitest";
import { Purchases } from "./main";

const server = setupServer(
  http.get(
    "http://localhost:8000/v1/subscribers/someAppUserId/offerings",
    () => {
      return HttpResponse.json(
        {
          current_offering_id: "offering_1",
          offerings: [
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
          ],
        },
        { status: 200 },
      );
    },
  ),

  http.get(
    "http://localhost:8000/rcbilling/v1/subscribers/someAppUserId/products?id=monthly",
    () => {
      return HttpResponse.json(
        {
          product_details: [
            {
              current_price: {
                amount: 300,
                currency: "USD",
              },
              identifier: "monthly",
              normal_period_duration: "PT1H",
              product_type: "subscription",
              title: "Monthly test",
            },
          ],
        },
        { status: 200 },
      );
    },
  ),

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
  const offerings = await billing.listOfferings("someAppUserId");

  expect(offerings).toEqual({
    offerings: [
      {
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
    ],
    priceByPackageId: {
      package_1: {
        amount: 300,
        currency: "USD",
      },
    },
  });
});

test("can post to subscribe", async () => {
  const billing = new Purchases("test_api_key");
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

test("can get a specific Package", async () => {
  const purchases = new Purchases("test_api_key");
  const pkg = await purchases.getPackage("someAppUserId", "package_1");
  expect(pkg).not.toBeNull();
  expect(pkg?.identifier).toBe("package_1");
});

test("returns null for Package not found", async () => {
  const purchases = new Purchases("test_api_key");
  const pkg = await purchases.getPackage("someAppUserId", "package_not_there");
  expect(pkg).toBeNull();
});
