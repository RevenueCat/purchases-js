import {
  afterEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";
import { http, HttpResponse } from "msw";
import {
  configurePurchases,
  server,
  testApiKey,
  testUserId,
} from "./base.purchases_test";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { expectPromiseToError } from "./test-helpers";
import { Backend } from "../networking/backend";
import { Purchases, type PurchaseParams } from "../main";
import { defaultHttpConfig } from "../entities/http-config";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
  PurchaseOperationHelper,
} from "../helpers/purchase-operation-helper";
import type { IEventsTracker } from "../behavioural-events/events-tracker";
import { subscriptionChangeImmediateWithTax } from "../stories/fixtures";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import type { WebBillingCheckoutStartResponse } from "../networking/responses/checkout-start-response";

const STRIPE_API_KEY = "strp_sb_test_api_key";
const PADDLE_API_KEY = "pdl_test_api_key";
const SUBSCRIBER_TOKEN_1 = "eyJhbGciOiJSUzI1NiJ9.subscriber.token.1";
const SUBSCRIBER_TOKEN_2 = "eyJhbGciOiJSUzI1NiJ9.subscriber.token.2";
const FROM_PRODUCT_IDENTIFIER = "premium_monthly";
const packageToBuy = createMonthlyPackageMock();

const purchaseModeStartResponse: WebBillingCheckoutStartResponse = {
  operation_session_id: "rcbopsess_purchase_mode",
  gateway_params: {
    publishable_api_key: "pk_test",
    stripe_account_id: "acct_test",
  },
  stripe_billing_params: null,
  management_url: "https://example.com/manage",
  paddle_billing_params: null,
  checkout_mode: "purchase",
};

const stripePurchaseModeStartResponse: WebBillingCheckoutStartResponse = {
  operation_session_id: "rcbopsess_stripe_purchase_mode",
  gateway_params: {
    publishable_api_key: "pk_test",
    stripe_account_id: "acct_test",
  },
  stripe_billing_params: {
    client_secret: "cs_test_secret",
    environment: "sandbox",
    publishable_api_key: "pk_test",
    stripe_account_id: "acct_test",
  },
  management_url: "https://example.com/manage",
  paddle_billing_params: null,
  checkout_mode: "purchase",
};

type ProductChangeGate = {
  resolveProductChange: (params: PurchaseParams) =>
    | {
        subscriptionId?: string;
        productIdentifier?: string;
        subscriberToken: string;
      }
    | undefined;
};

function expectStartCalledWith(
  startSpy: MockInstance<PurchaseOperationHelper["checkoutStart"]>,
  expected: {
    subscriptionId?: string;
    productIdentifier?: string;
    subscriberToken: string;
  },
) {
  expect(startSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      productId: packageToBuy.webBillingProduct.identifier,
      purchaseOption: packageToBuy.webBillingProduct.defaultPurchaseOption,
      productChange: {
        subscriptionId: expected.subscriptionId,
        productIdentifier: expected.productIdentifier,
      },
      subscriberToken: expected.subscriberToken,
    }),
  );
}

describe("Purchases.purchase productChangeInfo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("rejects API-key shaped subscriber tokens", async () => {
    const purchases = configurePurchases();

    await expectPromiseToError(
      purchases.purchase({
        rcPackage: packageToBuy,
        productChangeInfo: {
          subscriptionId: "subabc123",
          subscriberToken: "rcb_test_api_key",
        },
      }),
      new PurchasesError(
        ErrorCode.ConfigurationError,
        "Invalid subscriber token.",
      ),
    );
  });

  test("allows omitting subscriptionId and productIdentifier for backend inference", async () => {
    const purchases = configurePurchases();

    const startSpy = vi
      .spyOn(PurchaseOperationHelper.prototype, "checkoutStart")
      .mockResolvedValue(subscriptionChangeImmediateWithTax);

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        subscriberToken: SUBSCRIBER_TOKEN_1,
      },
    });

    await vi.waitFor(() => {
      expectStartCalledWith(startSpy, {
        subscriberToken: SUBSCRIBER_TOKEN_1,
      });
    });
  });

  test("starts a normal purchase without product change when subscriberToken is missing", async () => {
    const purchases = configurePurchases();

    const startSpy = vi
      .spyOn(PurchaseOperationHelper.prototype, "checkoutStart")
      .mockResolvedValue(purchaseModeStartResponse);

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        subscriptionId: "subabc123",
      },
    });

    await vi.waitFor(() => {
      expect(startSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: packageToBuy.webBillingProduct.identifier,
          productChange: undefined,
          subscriberToken: undefined,
        }),
      );
    });
  });

  test("uses subscriberToken from configure when productChangeInfo omits it", async () => {
    if (Purchases.isConfigured()) {
      Purchases.getSharedInstance().close();
    }
    const purchases = Purchases.configure({
      apiKey: testApiKey,
      appUserId: testUserId,
      httpConfig: defaultHttpConfig,
      flags: { rcSource: "rcSource" },
      subscriberToken: SUBSCRIBER_TOKEN_1,
    });

    const startSpy = vi
      .spyOn(PurchaseOperationHelper.prototype, "checkoutStart")
      .mockResolvedValue(subscriptionChangeImmediateWithTax);

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        subscriptionId: "subabc123",
      },
    });

    await vi.waitFor(() => {
      expectStartCalledWith(startSpy, {
        subscriptionId: "subabc123",
        subscriberToken: SUBSCRIBER_TOKEN_1,
      });
    });
  });

  test("passes productIdentifier through to checkout start", async () => {
    const purchases = configurePurchases();

    const startSpy = vi
      .spyOn(PurchaseOperationHelper.prototype, "checkoutStart")
      .mockResolvedValue(subscriptionChangeImmediateWithTax);

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        productIdentifier: FROM_PRODUCT_IDENTIFIER,
        subscriberToken: SUBSCRIBER_TOKEN_1,
      },
    });

    await vi.waitFor(() => {
      expectStartCalledWith(startSpy, {
        productIdentifier: FROM_PRODUCT_IDENTIFIER,
        subscriberToken: SUBSCRIBER_TOKEN_1,
      });
    });
  });

  test("passes both subscriptionId and productIdentifier through to checkout start", async () => {
    const purchases = configurePurchases();

    const startSpy = vi
      .spyOn(PurchaseOperationHelper.prototype, "checkoutStart")
      .mockResolvedValue(subscriptionChangeImmediateWithTax);

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        subscriptionId: "subabc123",
        productIdentifier: FROM_PRODUCT_IDENTIFIER,
        subscriberToken: SUBSCRIBER_TOKEN_1,
      },
    });

    await vi.waitFor(() => {
      expectStartCalledWith(startSpy, {
        subscriptionId: "subabc123",
        productIdentifier: FROM_PRODUCT_IDENTIFIER,
        subscriberToken: SUBSCRIBER_TOKEN_1,
      });
    });
  });

  test("per-call subscriberToken overrides configure token", async () => {
    if (Purchases.isConfigured()) {
      Purchases.getSharedInstance().close();
    }
    const purchases = Purchases.configure({
      apiKey: testApiKey,
      appUserId: testUserId,
      httpConfig: defaultHttpConfig,
      flags: { rcSource: "rcSource" },
      subscriberToken: SUBSCRIBER_TOKEN_1,
    });

    const startSpy = vi
      .spyOn(PurchaseOperationHelper.prototype, "checkoutStart")
      .mockResolvedValue(subscriptionChangeImmediateWithTax);

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        subscriptionId: "subabc123",
        subscriberToken: SUBSCRIBER_TOKEN_2,
      },
    });

    await vi.waitFor(() => {
      expectStartCalledWith(startSpy, {
        subscriptionId: "subabc123",
        subscriberToken: SUBSCRIBER_TOKEN_2,
      });
    });
  });

  test("product-change start forwards full purchase attribution fields", async () => {
    const purchases = configurePurchases();
    const startSpy = vi
      .spyOn(PurchaseOperationHelper.prototype, "checkoutStart")
      .mockResolvedValue(subscriptionChangeImmediateWithTax);

    void purchases.purchase({
      rcPackage: packageToBuy,
      customerEmail: "buyer@example.com",
      productChangeInfo: {
        subscriptionId: "subabc123",
        subscriberToken: SUBSCRIBER_TOKEN_1,
      },
      paywallId: "pw_123",
      paywallSessionId: "pws_456",
      selectedLocale: "es-ES",
      metadata: { campaign: "spring" },
      attributionMetadata: { fbp: "fb.1.2" },
      workflowPurchaseContext: {
        stepId: "step_1",
        urlParameters: { utm_source: "newsletter" },
      },
    });

    await vi.waitFor(() => {
      expect(startSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          productChange: {
            subscriptionId: "subabc123",
            productIdentifier: undefined,
          },
          subscriberToken: SUBSCRIBER_TOKEN_1,
          customerEmail: "buyer@example.com",
          paywallId: "pw_123",
          paywallSessionId: "pws_456",
          locale: "es-ES",
          metadata: expect.objectContaining({ campaign: "spring" }),
          attributionMetadata: { fbp: "fb.1.2" },
          workflowPurchaseContext: {
            stepId: "step_1",
            urlParameters: { utm_source: "newsletter" },
          },
        }),
      );
    });
  });

  test("continues as a normal purchase in the same session when backend starts a purchase checkout", async () => {
    const purchases = configurePurchases();

    let startCallCount = 0;
    let requestBody: {
      product_change?: {
        subscription_id?: string;
        from_product_id?: string;
      };
    } = {};

    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/start",
        async ({ request }) => {
          startCallCount += 1;
          requestBody = (await request.json()) as typeof requestBody;
          return HttpResponse.json(purchaseModeStartResponse, { status: 201 });
        },
      ),
    );

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        subscriberToken: SUBSCRIBER_TOKEN_1,
      },
    });

    await vi.waitFor(() => {
      expect(startCallCount).toBe(1);
    });
    expect(requestBody.product_change).toEqual({});

    // The session created by /checkout/start is reused; no second start call.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(startCallCount).toBe(1);
  });

  test("forwards product change to checkout start for Stripe app api keys", async () => {
    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      STRIPE_API_KEY,
    );

    const startSpy = vi
      .spyOn(PurchaseOperationHelper.prototype, "checkoutStart")
      .mockResolvedValue(subscriptionChangeImmediateWithTax);

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        subscriptionId: "subabc123",
        productIdentifier: FROM_PRODUCT_IDENTIFIER,
        subscriberToken: SUBSCRIBER_TOKEN_1,
      },
    });

    await vi.waitFor(() => {
      expectStartCalledWith(startSpy, {
        subscriptionId: "subabc123",
        productIdentifier: FROM_PRODUCT_IDENTIFIER,
        subscriberToken: SUBSCRIBER_TOKEN_1,
      });
    });
  });

  test("rejects API-key shaped subscriber tokens for Stripe app api keys", async () => {
    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      STRIPE_API_KEY,
    );

    await expectPromiseToError(
      purchases.purchase({
        rcPackage: packageToBuy,
        productChangeInfo: {
          subscriptionId: "subabc123",
          subscriberToken: "strp_test_api_key",
        },
      }),
      new PurchasesError(
        ErrorCode.ConfigurationError,
        "Invalid subscriber token.",
      ),
    );
  });

  test("continues as a normal Stripe purchase in the same session when backend starts a purchase checkout", async () => {
    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      STRIPE_API_KEY,
    );

    let startCallCount = 0;
    let requestBody: {
      product_change?: {
        subscription_id?: string;
        from_product_id?: string;
      };
    } = {};

    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/start",
        async ({ request }) => {
          startCallCount += 1;
          requestBody = (await request.json()) as typeof requestBody;
          return HttpResponse.json(stripePurchaseModeStartResponse, {
            status: 201,
          });
        },
      ),
    );

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        subscriberToken: SUBSCRIBER_TOKEN_1,
      },
    });

    await vi.waitFor(() => {
      expect(startCallCount).toBe(1);
    });
    expect(requestBody.product_change).toEqual({});

    // The session created by /checkout/start is reused; no second start call.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(startCallCount).toBe(1);
  });
});

describe("productChangeInfo gateway gate", () => {
  const productChangeParams: PurchaseParams = {
    rcPackage: packageToBuy,
    productChangeInfo: {
      subscriptionId: "subabc123",
      subscriberToken: SUBSCRIBER_TOKEN_1,
    },
  };

  const resolveFor = (apiKey: string) => {
    const purchases = configurePurchases(testUserId, "rcSource", apiKey);
    return (purchases as unknown as ProductChangeGate).resolveProductChange(
      productChangeParams,
    );
  };

  test("resolves product change for Web Billing api keys", () => {
    expect(resolveFor(testApiKey)).toEqual({
      subscriptionId: "subabc123",
      productIdentifier: undefined,
      subscriberToken: SUBSCRIBER_TOKEN_1,
    });
  });

  test("resolves product change for Stripe app api keys", () => {
    expect(resolveFor(STRIPE_API_KEY)).toEqual({
      subscriptionId: "subabc123",
      productIdentifier: undefined,
      subscriberToken: SUBSCRIBER_TOKEN_1,
    });
  });

  test("does not resolve product change for Paddle api keys", () => {
    expect(resolveFor(PADDLE_API_KEY)).toBeUndefined();
  });
});

describe("product change checkout networking", () => {
  const backend = new Backend("rcb_test_api_key");

  const startSuccessResponse = {
    operation_session_id: "rcbopsess_start",
    change_type: "immediate" as const,
    checkout_mode: "subscription_change" as const,
    from_product: {
      product_id: "monthly",
      display_name: "Monthly",
      price_in_micros: 9990000,
      currency: "USD",
      period_duration: "P1M",
    },
    to_product: {
      product_id: "annual",
      display_name: "Annual",
      price_in_micros: 99990000,
      currency: "USD",
      period_duration: "P1Y",
    },
    price_breakdown: {
      currency: "USD",
      total_amount_in_micros: 99990000,
      tax_amount_in_micros: null,
      total_excluding_tax_in_micros: 99990000,
      original_amount_in_micros: 99990000,
    },
    estimated_renewal_price: null,
    email: "user@example.com",
    payment_method: {
      type: "card",
      last_4: "4242",
      brand: "visa",
      exp_month: 12,
      exp_year: 2030,
    },
    billing_address: {
      country_code: "US",
      postal_code: "12345",
    },
  };

  const purchaseOption = {
    id: "base_option",
    priceId: "price_annual",
  };

  const presentedOfferingContext = {
    offeringIdentifier: "default",
    targetingContext: null,
    placementIdentifier: null,
  };

  const eventsTrackerMock = {
    getTraceId: () => "trace-abc",
    updateUser: () => Promise.resolve(),
    trackSDKEvent: () => {},
    trackExternalEvent: () => {},
    trackPaywallEvent: () => {},
    dispose: () => {},
    flushAllEvents: () => Promise.resolve(),
  } as unknown as IEventsTracker;

  test("unified start sends product_change with subscription_id only", async () => {
    let requestBody: {
      product_id?: string;
      product_change?: {
        subscription_id?: string;
        from_product_id?: string;
      };
    } = {};
    let authHeader: string | null = null;
    let subscriberTokenHeader: string | null = null;

    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/start",
        async ({ request }) => {
          authHeader = request.headers.get("Authorization");
          subscriberTokenHeader = request.headers.get("X-RC-Subscriber-Token");
          requestBody = (await request.json()) as typeof requestBody;
          return HttpResponse.json(startSuccessResponse, { status: 201 });
        },
      ),
    );

    const response = await backend.postCheckoutStart({
      appUserId: testUserId,
      productId: "annual",
      purchaseOption,
      presentedOfferingContext,
      traceId: "trace",
      productChange: { subscriptionId: "subabc123" },
      subscriberToken: SUBSCRIBER_TOKEN_1,
    });

    expect(authHeader).toBe("Bearer rcb_test_api_key");
    expect(subscriberTokenHeader).toBe(SUBSCRIBER_TOKEN_1);
    expect(requestBody.product_id).toBe("annual");
    expect(requestBody.product_change).toEqual({
      subscription_id: "subabc123",
    });
    expect(response.operation_session_id).toBe("rcbopsess_start");
  });

  test("unified start sends from_product_id only", async () => {
    let requestBody: {
      product_change?: {
        subscription_id?: string;
        from_product_id?: string;
      };
    } = {};

    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/start",
        async ({ request }) => {
          requestBody = (await request.json()) as typeof requestBody;
          return HttpResponse.json(startSuccessResponse, { status: 201 });
        },
      ),
    );

    await backend.postCheckoutStart({
      appUserId: testUserId,
      productId: "annual",
      purchaseOption,
      presentedOfferingContext,
      traceId: "trace",
      productChange: { productIdentifier: FROM_PRODUCT_IDENTIFIER },
      subscriberToken: SUBSCRIBER_TOKEN_1,
    });

    expect(requestBody.product_change).toEqual({
      from_product_id: FROM_PRODUCT_IDENTIFIER,
    });
  });

  test("unified start sends empty product_change for inference", async () => {
    let requestBody: {
      product_change?: {
        subscription_id?: string;
        from_product_id?: string;
      };
    } = {};

    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/start",
        async ({ request }) => {
          requestBody = (await request.json()) as typeof requestBody;
          return HttpResponse.json(startSuccessResponse, { status: 201 });
        },
      ),
    );

    await backend.postCheckoutStart({
      appUserId: testUserId,
      productId: "annual",
      purchaseOption,
      presentedOfferingContext,
      traceId: "trace",
      productChange: {},
      subscriberToken: SUBSCRIBER_TOKEN_1,
    });

    expect(requestBody.product_change).toEqual({});
  });

  test("helper checkoutStart includes purchase attribution fields alongside product_change", async () => {
    let requestBody: {
      product_change?: { subscription_id?: string };
      paywall?: { paywall_id?: string; paywall_session_id?: string };
      locale?: string;
      metadata?: { campaign?: string };
      attribution_metadata?: { fbp?: string };
      presented_step_id?: string;
      url_parameters?: Record<string, string>;
      email?: string;
    } = {};

    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/start",
        async ({ request }) => {
          requestBody = (await request.json()) as typeof requestBody;
          return HttpResponse.json(startSuccessResponse, { status: 201 });
        },
      ),
    );

    const helper = new PurchaseOperationHelper(backend, eventsTrackerMock);
    await helper.checkoutStart({
      appUserId: testUserId,
      productId: "annual",
      purchaseOption,
      presentedOfferingContext,
      productChange: { subscriptionId: "subabc123" },
      subscriberToken: SUBSCRIBER_TOKEN_1,
      customerEmail: "buyer@example.com",
      paywallId: "pw_123",
      paywallSessionId: "pws_456",
      locale: "es-ES",
      metadata: { campaign: "spring" },
      attributionMetadata: { fbp: "fb.1.2" },
      workflowPurchaseContext: {
        stepId: "step_1",
        urlParameters: { utm_source: "newsletter" },
      },
    });

    expect(requestBody).toMatchObject({
      product_change: { subscription_id: "subabc123" },
      email: "buyer@example.com",
      paywall: { paywall_id: "pw_123", paywall_session_id: "pws_456" },
      locale: "es-ES",
      metadata: { campaign: "spring" },
      attribution_metadata: { fbp: "fb.1.2" },
      presented_step_id: "step_1",
      url_parameters: { utm_source: "newsletter" },
    });
  });

  test("complete with subscriber token posts to unified checkout complete endpoint", async () => {
    let authHeader: string | null = null;
    let subscriberTokenHeader: string | null = null;
    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/rcbopsess_start/complete",
        async ({ request }) => {
          authHeader = request.headers.get("Authorization");
          subscriberTokenHeader = request.headers.get("X-RC-Subscriber-Token");
          return HttpResponse.json(
            {
              operation_session_id: "rcbopsess_start",
              change_type: "immediate",
              new_product_id: "annual",
              checkout_mode: "subscription_change",
            },
            { status: 200 },
          );
        },
      ),
    );

    const response = await backend.postCheckoutComplete("rcbopsess_start", {
      subscriberToken: SUBSCRIBER_TOKEN_1,
    });

    expect(authHeader).toBe("Bearer rcb_test_api_key");
    expect(subscriberTokenHeader).toBe(SUBSCRIBER_TOKEN_1);
    expect(response).toMatchObject({
      new_product_id: "annual",
      checkout_mode: "subscription_change",
    });
  });

  test("helper completeProductChange maps the subscription-change response after a start", async () => {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/checkout/start", async () =>
        HttpResponse.json(startSuccessResponse, { status: 201 }),
      ),
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/rcbopsess_start/complete",
        async () =>
          HttpResponse.json(
            {
              operation_session_id: "rcbopsess_start",
              change_type: "immediate",
              new_product_id: "annual",
              checkout_mode: "subscription_change",
            },
            { status: 200 },
          ),
      ),
    );

    const helper = new PurchaseOperationHelper(backend, eventsTrackerMock);
    await helper.checkoutStart({
      appUserId: testUserId,
      productId: "annual",
      purchaseOption,
      presentedOfferingContext,
      productChange: { subscriptionId: "subabc123" },
      subscriberToken: SUBSCRIBER_TOKEN_1,
    });

    const result = await helper.completeProductChange({
      subscriberToken: SUBSCRIBER_TOKEN_1,
    });
    expect(result).toEqual({
      operationSessionId: "rcbopsess_start",
      changeType: "immediate",
      newProductId: "annual",
    });
  });

  test("helper completeProductChange throws when no session was started", async () => {
    const helper = new PurchaseOperationHelper(backend, eventsTrackerMock);

    await expect(
      helper.completeProductChange({ subscriberToken: SUBSCRIBER_TOKEN_1 }),
    ).rejects.toThrow(
      new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No product change checkout session to complete.",
      ),
    );
  });
});
