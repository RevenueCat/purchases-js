import { beforeEach, expect, test, vi } from "vitest";
import { Purchases } from "../main";
import { ErrorCode } from "../entities/errors";
import {
  externalCheckoutUrl,
  validateExternalCheckoutUrls,
} from "../external/external-checkout";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { APIPostRequest } from "./test-responses";
import { customerInfoResponse } from "./test-responses";
import { server } from "./base.purchases_test";
import { http, HttpResponse } from "msw";
import type * as BrowserGlobals from "../helpers/browser-globals";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

const completedOperation = {
  status: "succeeded",
  is_expired: true,
  product_identifier: "reported-product",
  store_transaction_identifier: "transaction",
  purchase_date: "2026-11-11T12:00:00Z",
  redemption_info: { redeem_url: "https://redeem.example/token" },
};

test.each([
  ["started", false, "pending"],
  ["in_progress", true, "expired"],
  ["failed", false, "failed"],
])("resumes %s checkout as %s", async (status, isExpired, expected) => {
  const getCustomerInfo = vi.fn(() => HttpResponse.json(customerInfoResponse));
  server.use(
    http.get("http://localhost:8000/v1/subscribers/:id", getCustomerInfo),
    http.get(
      "http://localhost:8000/rcbilling/v1/checkout/:token",
      ({ request }) => {
        expect(new URL(request.url).searchParams.get("app_user_id")).toBe(
          "return-user",
        );
        return HttpResponse.json({
          operation: { status, is_expired: isExpired },
        });
      },
    ),
  );
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "return-user",
  });
  expect(
    (
      await purchases.resumeExternalPurchase({
        checkoutToken: "token",
        waitTimeoutMs: 0,
      })
    ).status,
  ).toBe(expected);
  expect(getCustomerInfo).not.toHaveBeenCalled();
});

test("resumes a successful expired checkout with its reported product and redemption link", async () => {
  const requests: string[] = [];
  server.use(
    http.get("http://localhost:8000/v1/subscribers/:id", ({ params }) => {
      expect(params.id).toBe("return-user");
      requests.push("customer-info");
      return HttpResponse.json(customerInfoResponse);
    }),
    http.get("http://localhost:8000/rcbilling/v1/checkout/:token", () => {
      requests.push("operation");
      return HttpResponse.json({ operation: completedOperation });
    }),
  );
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "return-user",
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await purchases.resumeExternalPurchase({
      checkoutToken: "token",
      waitTimeoutMs: 0,
    });
    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      expect(result.purchaseResult.customerInfo.originalAppUserId).toBe(
        customerInfoResponse.subscriber.original_app_user_id,
      );
      expect(result.purchaseResult.storeTransaction.productIdentifier).toBe(
        "reported-product",
      );
      expect(result.purchaseResult.redemptionInfo?.redeemUrl).toBe(
        "https://redeem.example/token",
      );
    }
  }
  expect(requests).toEqual([
    "operation",
    "customer-info",
    "operation",
    "customer-info",
  ]);
});

test.each([
  { during: "polling", status: "succeeded" },
  { during: "polling", status: "started" },
  { during: "customer-info", status: "succeeded" },
])(
  "rejects a customer change during $during for $status checkout",
  async ({ during, status }) => {
    let notifyRequestStarted!: () => void;
    const requestStarted = new Promise<void>((resolve) => {
      notifyRequestStarted = resolve;
    });
    let releaseRequest!: () => void;
    const responseReady = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });
    const customerInfoRequests: string[] = [];
    server.use(
      http.get(
        "http://localhost:8000/rcbilling/v1/checkout/:token",
        async ({ request }) => {
          expect(new URL(request.url).searchParams.get("app_user_id")).toBe(
            "return-user",
          );
          if (during === "polling") {
            notifyRequestStarted();
            await responseReady;
          }
          return HttpResponse.json({
            operation: { ...completedOperation, status },
          });
        },
      ),
      http.get(
        "http://localhost:8000/v1/subscribers/:id",
        async ({ params }) => {
          const userId = String(params.id);
          customerInfoRequests.push(userId);
          if (during === "customer-info" && userId === "return-user") {
            notifyRequestStarted();
            await responseReady;
          }
          return HttpResponse.json(customerInfoResponse);
        },
      ),
    );
    const purchases = Purchases.configure({
      apiKey: "ext_public_test",
      appUserId: "return-user",
    });
    const result = purchases.resumeExternalPurchase({
      checkoutToken: "token",
      waitTimeoutMs: 0,
    });
    const rejected = expect(result).rejects.toMatchObject({
      errorCode: ErrorCode.ConfigurationError,
      message:
        "The SDK customer changed while resuming checkout. Retry with the original customer.",
    });
    const settled = vi.fn();
    void result.then(settled, settled);
    await requestStarted;
    await purchases.changeUser("other-user");
    expect(settled).not.toHaveBeenCalled();
    releaseRequest();
    await rejected;
    expect(purchases.getAppUserId()).toBe("other-user");
    expect(
      customerInfoRequests.filter((id) => id === "return-user"),
    ).toHaveLength(during === "customer-info" ? 1 : 0);
  },
);

test("rejects malformed successful checkout responses", async () => {
  server.use(
    http.get("http://localhost:8000/rcbilling/v1/checkout/:token", () =>
      HttpResponse.json({
        operation: { status: "succeeded", is_expired: false },
      }),
    ),
  );
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "return-user",
  });
  await expect(
    purchases.resumeExternalPurchase({
      checkoutToken: "token",
      waitTimeoutMs: 0,
    }),
  ).rejects.toMatchObject({
    errorCode: ErrorCode.UnexpectedBackendResponseError,
  });
});

test("polls until the purchase report arrives", async () => {
  let checks = 0;
  server.use(
    http.get("http://localhost:8000/rcbilling/v1/checkout/:token", () => {
      checks++;
      return HttpResponse.json({
        operation: {
          status: checks === 1 ? "started" : "failed",
          is_expired: false,
        },
      });
    }),
  );
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "return-user",
  });
  expect(
    (
      await purchases.resumeExternalPurchase({
        checkoutToken: "token",
        waitTimeoutMs: 2000,
      })
    ).status,
  ).toBe("failed");
  expect(checks).toBe(2);
});

test.each([NaN, Infinity, -1])(
  "rejects invalid polling timeout %s",
  async (waitTimeoutMs) => {
    const purchases = Purchases.configure({
      apiKey: "ext_public_test",
      appUserId: "return-user",
    });
    await expect(
      purchases.resumeExternalPurchase({
        checkoutToken: "token",
        waitTimeoutMs,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.ConfigurationError });
  },
);
vi.mock("../helpers/browser-globals", async (importOriginal) => ({
  ...(await importOriginal<typeof BrowserGlobals>()),
  getWindow: () => ({ location: { assign: navigate } }),
}));

beforeEach(() => {
  navigate.mockReset();
  server.use(
    http.post("http://localhost:8000/rcbilling/v1/checkout/start", () =>
      HttpResponse.json({
        operation_session_id: "rcbopsess_external_checkout",
      }),
    ),
  );
});

test("uses the backend token and replaces stale tokens in both URLs", () => {
  const base = "https://checkout.example/start?checkout_token=old";
  const destination =
    "https://merchant.example/return?checkout_token=old&source=demo#done";
  const first = new URL(
    externalCheckoutUrl(
      validateExternalCheckoutUrls(base, destination),
      "user",
      "product",
      "rcbopsess_first",
    ),
  );
  const second = new URL(
    externalCheckoutUrl(
      validateExternalCheckoutUrls(base, destination),
      "user",
      "product",
      "rcbopsess_second",
    ),
  );
  expect(first.searchParams.get("checkout_token")).toBe("rcbopsess_first");
  expect(second.searchParams.get("checkout_token")).toBe("rcbopsess_second");
  const returned = new URL(first.searchParams.get("return_url")!);
  expect(returned.searchParams.getAll("checkout_token")).toEqual(
    first.searchParams.getAll("checkout_token"),
  );
  expect(returned.searchParams.get("source")).toBe("demo");
  expect(returned.hash).toBe("#done");
});

test("accepts a returned token without treating it as proof of access", async () => {
  server.use(
    http.get("http://localhost:8000/v1/subscribers/:id", () =>
      HttpResponse.json(customerInfoResponse),
    ),
  );
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "return-user",
    externalCheckoutReturnToken: "opaque-return-token",
  });
  const info = await purchases.getCustomerInfo();
  expect(info.originalAppUserId).toBe(
    customerInfoResponse.subscriber.original_app_user_id,
  );
  expect(
    APIPostRequest.mock.calls.filter(
      ([request]) => !request.url.endsWith("/v1/events"),
    ),
  ).toEqual([]);
});

test("constructs the contract parameters without losing unrelated query values or fragment", () => {
  const url = new URL(
    externalCheckoutUrl(
      validateExternalCheckoutUrls(
        "http://localhost:3001/api/checkout?source=demo&app_user_id=old&product_id=old#checkout",
        undefined,
      ),
      "user+/#&",
      "product+/#&",
      "rcbopsess_checkout",
    ),
  );
  expect(url.searchParams.get("source")).toBe("demo");
  expect(url.searchParams.getAll("app_user_id")).toEqual(["user+/#&"]);
  expect(url.searchParams.getAll("product_id")).toEqual(["product+/#&"]);
  expect(url.hash).toBe("#checkout");
});

test("encodes a return URL with its own query and fragment and removes stale return values", () => {
  const returnUrl =
    "https://merchant.example/paywall?source=a%2Bb&offering=monthly#purchase";
  const url = new URL(
    externalCheckoutUrl(
      validateExternalCheckoutUrls(
        "https://checkout.example/start?return_url=old",
        returnUrl,
      ),
      "user",
      "product",
      "rcbopsess_checkout",
    ),
  );
  const returned = new URL(url.searchParams.get("return_url")!);
  expect(returned.searchParams.get("checkout_token")).toBe(
    url.searchParams.get("checkout_token"),
  );
  returned.searchParams.delete("checkout_token");
  expect(returned.toString()).toBe(returnUrl);
  expect(
    new URL(
      externalCheckoutUrl(
        validateExternalCheckoutUrls(
          "https://checkout.example/start?return_url=old",
          undefined,
        ),
        "user",
        "product",
        "rcbopsess_checkout",
      ),
    ).searchParams.has("return_url"),
  ).toBe(false);
});

test.each([undefined, "https://merchant.example/override?foo=bar#paywall"])(
  "uses the effective return URL %s",
  async (override) => {
    const configured = "http://localhost:3010/user?offering=monthly";
    const purchases = Purchases.configure({
      apiKey: "ext_public_test",
      appUserId: "user",
      externalCheckoutUrl: "http://localhost:3001/api/checkout",
      externalCheckoutReturnUrl: configured,
    });
    void purchases.purchase({
      rcPackage: createMonthlyPackageMock(),
      externalCheckoutReturnUrl: override,
    });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    const checkout = new URL(navigate.mock.calls[0][0]);
    const returned = new URL(checkout.searchParams.get("return_url")!);
    expect(returned.searchParams.get("checkout_token")).toBe(
      checkout.searchParams.get("checkout_token"),
    );
    returned.searchParams.delete("checkout_token");
    expect(returned.toString()).toBe(override ?? configured);
  },
);

test.each([
  "",
  "/relative",
  "javascript:alert(1)",
  "https://user:password@example.com",
])(
  "rejects invalid return URL %s before starting checkout",
  async (returnUrl) => {
    const startCheckout = vi.fn(() =>
      HttpResponse.json({ operation_session_id: "rcbopsess_unused" }),
    );
    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/start",
        startCheckout,
      ),
    );
    const purchases = Purchases.configure({
      apiKey: "ext_public_test",
      appUserId: "user",
      externalCheckoutUrl: "https://checkout.example/start",
    });
    await expect(
      purchases.purchase({
        rcPackage: createMonthlyPackageMock(),
        externalCheckoutReturnUrl: returnUrl,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.ConfigurationError });
    expect(startCheckout).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  },
);

test.each([
  undefined,
  "",
  "/checkout",
  "javascript:alert(1)",
  "https://user:password@example.com/checkout",
])("rejects checkout URL %s before starting checkout", async (url) => {
  const startCheckout = vi.fn(() =>
    HttpResponse.json({ operation_session_id: "rcbopsess_unused" }),
  );
  server.use(
    http.post(
      "http://localhost:8000/rcbilling/v1/checkout/start",
      startCheckout,
    ),
  );
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "user",
    externalCheckoutUrl: url,
  });
  await expect(
    purchases.purchase({ rcPackage: createMonthlyPackageMock() }),
  ).rejects.toMatchObject({ errorCode: ErrorCode.ConfigurationError });
  expect(startCheckout).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
});

test.each([undefined, ""])(
  "does not redirect when checkout start returns token %s",
  async (token) => {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/checkout/start", () =>
        HttpResponse.json({ operation_session_id: token }),
      ),
    );
    const purchases = Purchases.configure({
      apiKey: "ext_public_test",
      appUserId: "user",
      externalCheckoutUrl: "https://checkout.example/start",
    });
    await expect(
      purchases.purchase({ rcPackage: createMonthlyPackageMock() }),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.UnexpectedBackendResponseError,
    });
    expect(navigate).not.toHaveBeenCalled();
  },
);

test.each([undefined, "https://merchant.example/checkout?source=override"])(
  "redirects using the effective URL %s without producing a successful purchase",
  async (override) => {
    const purchases = Purchases.configure({
      apiKey: "ext_public_test",
      appUserId: "original",
      externalCheckoutUrl: "http://localhost:3001/api/checkout",
    });
    server.use(
      http.get("http://localhost:8000/v1/subscribers/:id", () =>
        HttpResponse.json(customerInfoResponse),
      ),
    );
    await purchases.changeUser("current+#&");
    const pkg = createMonthlyPackageMock();
    const settled = vi.fn();
    const promise = purchases.purchase({
      rcPackage: pkg,
      externalCheckoutUrl: override,
    });
    void promise.then(settled, settled);
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenCalledTimes(1);
    const url = new URL(navigate.mock.calls[0][0]);
    expect(url.origin).toBe(
      override ? "https://merchant.example" : "http://localhost:3001",
    );
    expect(url.searchParams.get("app_user_id")).toBe("current+#&");
    expect(url.searchParams.get("product_id")).toBe(pkg.product.identifier);
    expect(url.searchParams.get("checkout_token")).toBe(
      "rcbopsess_external_checkout",
    );
    expect(settled).not.toHaveBeenCalled();
  },
);

test("an empty purchase override fails before navigation", async () => {
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "user",
    externalCheckoutUrl: "https://merchant.example/checkout",
  });
  await expect(
    purchases.purchase({
      rcPackage: createMonthlyPackageMock(),
      externalCheckoutUrl: "",
    }),
  ).rejects.toMatchObject({ errorCode: ErrorCode.ConfigurationError });
  expect(navigate).not.toHaveBeenCalled();
});

test("purchasePackage uses the configured checkout URL", async () => {
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "user",
    externalCheckoutUrl: "https://merchant.example/checkout",
  });
  const pkg = createMonthlyPackageMock();
  void purchases.purchasePackage(pkg);
  await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(
    new URL(navigate.mock.calls[0][0]).searchParams.get("product_id"),
  ).toBe(pkg.product.identifier);
});

test("does not redirect if creating the backend operation fails", async () => {
  server.use(
    http.post("http://localhost:8000/rcbilling/v1/checkout/start", () =>
      HttpResponse.json(
        { code: 7225, message: "Checkout unavailable" },
        { status: 400 },
      ),
    ),
  );
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "user",
    externalCheckoutUrl: "https://merchant.example/checkout",
  });
  await expect(
    purchases.purchase({ rcPackage: createMonthlyPackageMock() }),
  ).rejects.toThrow();
  expect(navigate).not.toHaveBeenCalled();
});

test("stores presentation context before navigating to the merchant", async () => {
  const received = vi.fn();
  server.use(
    http.post(
      "http://localhost:8000/rcbilling/v1/checkout/start",
      async ({ request }) => {
        received(await request.json());
        return HttpResponse.json({ operation_session_id: "rcbopsess_context" });
      },
    ),
  );
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "user",
    externalCheckoutUrl: "https://merchant.example/checkout",
  });
  const pkg = createMonthlyPackageMock();
  void purchases.purchase({
    rcPackage: pkg,
    paywallId: "pw_test",
    paywallSessionId: "presentation",
    workflowPurchaseContext: {
      stepId: "step",
      urlParameters: { utm_source: "demo" },
    },
    metadata: { campaign: "autumn" },
  });
  await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
  expect(received).toHaveBeenCalledWith(
    expect.objectContaining({
      app_user_id: "user",
      product_id: pkg.product.identifier,
      price_id: pkg.product.defaultPurchaseOption.priceId,
      presented_offering_identifier:
        pkg.product.presentedOfferingContext.offeringIdentifier,
      paywall: { paywall_id: "pw_test", paywall_session_id: "presentation" },
      presented_step_id: "step",
      url_parameters: { utm_source: "demo" },
      metadata: { campaign: "autumn" },
      trace_id: expect.any(String),
    }),
  );
});

test("navigation failures reject instead of reporting a successful purchase", async () => {
  navigate.mockImplementationOnce(() => {
    throw new Error("Navigation blocked");
  });
  const purchases = Purchases.configure({
    apiKey: "ext_public_test",
    appUserId: "user",
    externalCheckoutUrl: "https://merchant.example/checkout",
  });
  await expect(
    purchases.purchase({ rcPackage: createMonthlyPackageMock() }),
  ).rejects.toThrow("Navigation blocked");
});
