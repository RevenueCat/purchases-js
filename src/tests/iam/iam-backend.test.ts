import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { Backend, PostReceiptInitiationSource } from "../../networking/backend";
import type { IamRequestAuthorizer } from "../../iam/iam-session-manager";
import type { PurchaseOption } from "../../entities/offerings";

const API_KEY = "rcb_sb_test_api_key";
const ACCESS_TOKEN = "iam-access-token";
const BASE_URL = "http://localhost:8000";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const credentials = { accessToken: ACCESS_TOKEN, appUserId: "user-1" };
const authorizer: IamRequestAuthorizer = {
  getCurrentCredentials: () => credentials,
  getCredentials: async () => credentials,
  refreshAfterUnauthorized: async () => null,
};

const purchaseOption = {
  id: "base_option",
  priceId: "price_1",
} as PurchaseOption;
const offeringContext = {
  offeringIdentifier: "offering_1",
  targetingContext: null,
  placementIdentifier: null,
};

interface RecordedRequest {
  method: string;
  path: string;
  authorization: string | null;
  body: unknown;
}

function recordRequests(): RecordedRequest[] {
  const requests: RecordedRequest[] = [];
  server.use(
    http.all(`${BASE_URL}/*`, async ({ request }) => {
      const url = new URL(request.url);
      const text = await request.text();
      requests.push({
        method: request.method,
        path: `${url.pathname}${url.search}`,
        authorization: request.headers.get("Authorization"),
        body: text ? JSON.parse(text) : null,
      });
      return HttpResponse.json({ product_details: [] });
    }),
  );
  return requests;
}

type BackendCall = (backend: Backend) => Promise<unknown>;

const customerCalls: Array<[string, BackendCall, string, string]> = [
  [
    "getOfferings",
    (b) => b.getOfferings("user-1"),
    "GET",
    "/v1/customer/offerings",
  ],
  [
    "getCustomerInfo",
    (b) => b.getCustomerInfo("user-1"),
    "GET",
    "/v1/customer",
  ],
  [
    "getProducts",
    (b) => b.getProducts("user-1", ["p1", "p2"], "EUR", "CODE"),
    "GET",
    "/rcbilling/v1/customer/products?id=p1&id=p2&currency=EUR&discount_code=CODE",
  ],
  [
    "setAttributes",
    (b) => b.setAttributes("user-1", { $email: "a@example.com" }),
    "POST",
    "/v1/customer/attributes",
  ],
  [
    "getVirtualCurrencies",
    (b) => b.getVirtualCurrencies("user-1"),
    "GET",
    "/v1/customer/virtual_currencies",
  ],
  [
    "getWorkflows",
    (b) => b.getWorkflows("user-1"),
    "GET",
    "/v1/customer/workflows?type=paywall",
  ],
  [
    "getWorkflowById",
    (b) => b.getWorkflowById("user-1", "wf 1"),
    "GET",
    "/v1/customer/workflows/wf%201",
  ],
  [
    "postCheckoutStart",
    (b) =>
      b.postCheckoutStart({
        appUserId: "user-1",
        productId: "p1",
        purchaseOption,
        presentedOfferingContext: offeringContext,
        traceId: "trace",
      }),
    "POST",
    "/rcbilling/v1/customer/checkout/start",
  ],
  [
    "patchCheckoutRefreshPricing",
    (b) => b.patchCheckoutRefreshPricing("osid", { countryCode: "US" }),
    "PATCH",
    "/rcbilling/v1/customer/checkout/osid",
  ],
  [
    "postCheckoutComplete",
    (b) => b.postCheckoutComplete("osid"),
    "POST",
    "/rcbilling/v1/customer/checkout/osid/complete",
  ],
  [
    "getCheckoutStatus",
    (b) => b.getCheckoutStatus("osid"),
    "GET",
    "/rcbilling/v1/customer/checkout/osid",
  ],
  [
    "postReceipt",
    (b) =>
      b.postReceipt(
        "user-1",
        "p1",
        "USD",
        "fetch-token",
        null,
        PostReceiptInitiationSource.PURCHASE,
      ),
    "POST",
    "/v1/receipts",
  ],
];

describe("Backend with an IAM authorizer", () => {
  const backend = new Backend(API_KEY, undefined, undefined, authorizer);

  test.each(customerCalls)(
    "%s uses the IAM route with the access token",
    async (_name, call, method, path) => {
      const requests = recordRequests();

      await call(backend);

      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({
        method,
        path,
        authorization: `Bearer ${ACCESS_TOKEN}`,
      });
    },
  );

  test("bodies still name the token's user", async () => {
    const requests = recordRequests();

    await backend.postReceipt(
      "user-1",
      "p1",
      "USD",
      "fetch-token",
      null,
      PostReceiptInitiationSource.PURCHASE,
    );

    expect(requests[0].body).toMatchObject({ app_user_id: "user-1" });
  });

  test("product-change checkout ignores a subscriber token", async () => {
    const requests = recordRequests();

    await backend.postCheckoutStart({
      appUserId: "user-1",
      productId: "p1",
      purchaseOption,
      presentedOfferingContext: offeringContext,
      traceId: "trace",
      productChange: { subscriptionId: "sub_1" },
      subscriberToken: "subscriber-token",
    });

    expect(requests[0].authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  test.each<[string, BackendCall, string]>([
    ["getBrandingInfo", (b) => b.getBrandingInfo(), "/rcbilling/v1/branding"],
    [
      "postCheckoutPrepare",
      (b) => b.postCheckoutPrepare("p1", purchaseOption),
      "/rcbilling/v1/checkout/prepare",
    ],
  ])("%s keeps the public API key", async (_name, call, path) => {
    const requests = recordRequests();

    await call(backend);

    expect(requests[0]).toMatchObject({
      path,
      authorization: `Bearer ${API_KEY}`,
    });
  });
});

describe("Backend without an IAM authorizer", () => {
  const backend = new Backend(API_KEY);

  test.each<[string, BackendCall, string]>([
    [
      "getOfferings",
      (b) => b.getOfferings("user 1"),
      "/v1/subscribers/user%201/offerings",
    ],
    [
      "getCustomerInfo",
      (b) => b.getCustomerInfo("user-1"),
      "/v1/subscribers/user-1",
    ],
    [
      "getProducts",
      (b) => b.getProducts("user-1", ["p1"]),
      "/rcbilling/v1/subscribers/user-1/products?id=p1",
    ],
    [
      "getCheckoutStatus",
      (b) => b.getCheckoutStatus("osid"),
      "/rcbilling/v1/checkout/osid",
    ],
  ])("%s keeps the legacy route and the API key", async (_name, call, path) => {
    const requests = recordRequests();

    await call(backend);

    expect(requests[0]).toMatchObject({
      path,
      authorization: `Bearer ${API_KEY}`,
    });
  });
});
