import { afterEach, describe, expect, test, vi } from "vitest";
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
import { Purchases } from "../main";
import { defaultHttpConfig } from "../entities/http-config";
import { ProductChangeOperationHelper } from "../helpers/product-change-operation-helper";
import { subscriptionChangeImmediateWithTax } from "../stories/fixtures";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";

const SUBSCRIBER_TOKEN_1 = "eyJhbGciOiJSUzI1NiJ9.subscriber.token.1";
const SUBSCRIBER_TOKEN_2 = "eyJhbGciOiJSUzI1NiJ9.subscriber.token.2";
const FROM_PRODUCT_IDENTIFIER = "premium_monthly";
const packageToBuy = createMonthlyPackageMock();

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
          fromProductIdentifier: FROM_PRODUCT_IDENTIFIER,
          subscriberToken: "rcb_test_api_key",
        },
      }),
      new PurchasesError(
        ErrorCode.ConfigurationError,
        "Invalid subscriber token.",
      ),
    );
  });

  test("allows omitting fromProductIdentifier for backend inference", async () => {
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
      .spyOn(ProductChangeOperationHelper.prototype, "start")
      .mockResolvedValue(subscriptionChangeImmediateWithTax);

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {},
    });

    await vi.waitFor(() => {
      expect(startSpy).toHaveBeenCalledWith(
        packageToBuy.webBillingProduct.identifier,
        undefined,
        SUBSCRIBER_TOKEN_1,
      );
    });
  });

  test("requires subscriberToken from configure or productChangeInfo", async () => {
    const purchases = configurePurchases();

    await expectPromiseToError(
      purchases.purchase({
        rcPackage: packageToBuy,
        productChangeInfo: {
          fromProductIdentifier: FROM_PRODUCT_IDENTIFIER,
        },
      }),
      new PurchasesError(
        ErrorCode.ConfigurationError,
        "subscriberToken is required for product changes.",
        "Pass a subscriber access token via PurchasesConfig.subscriberToken " +
          "or productChangeInfo.subscriberToken.",
      ),
    );
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
      .spyOn(ProductChangeOperationHelper.prototype, "start")
      .mockResolvedValue(subscriptionChangeImmediateWithTax);

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        fromProductIdentifier: FROM_PRODUCT_IDENTIFIER,
      },
    });

    await vi.waitFor(() => {
      expect(startSpy).toHaveBeenCalledWith(
        packageToBuy.webBillingProduct.identifier,
        FROM_PRODUCT_IDENTIFIER,
        SUBSCRIBER_TOKEN_1,
      );
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
      .spyOn(ProductChangeOperationHelper.prototype, "start")
      .mockResolvedValue(subscriptionChangeImmediateWithTax);

    void purchases.purchase({
      rcPackage: packageToBuy,
      productChangeInfo: {
        fromProductIdentifier: FROM_PRODUCT_IDENTIFIER,
        subscriberToken: SUBSCRIBER_TOKEN_2,
      },
    });

    await vi.waitFor(() => {
      expect(startSpy).toHaveBeenCalledWith(
        packageToBuy.webBillingProduct.identifier,
        FROM_PRODUCT_IDENTIFIER,
        SUBSCRIBER_TOKEN_2,
      );
    });
  });
});

describe("product change checkout networking", () => {
  const backend = new Backend("rcb_test_api_key");

  test("start sends from_product_id and maps response", async () => {
    let requestBody: {
      new_product_id?: string;
      from_product_id?: string;
    } = {};
    let authHeader: string | null = null;

    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/subscription/change/checkout/start",
        async ({ request }) => {
          authHeader = request.headers.get("Authorization");
          requestBody = (await request.json()) as typeof requestBody;
          return HttpResponse.json(
            {
              operation_session_id: "rcbopsess_start",
              change_type: "immediate",
              from_product: {
                product_id: "monthly",
                display_name: "Monthly",
                price_in_micros: 9990000,
                currency: "USD",
              },
              to_product: {
                product_id: "annual",
                display_name: "Annual",
                price_in_micros: 99990000,
                currency: "USD",
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
            },
            { status: 201 },
          );
        },
      ),
    );

    const response = await backend.postSubscriptionChangeCheckoutStart(
      "annual",
      FROM_PRODUCT_IDENTIFIER,
      SUBSCRIBER_TOKEN_1,
    );

    expect(requestBody).toEqual({
      new_product_id: "annual",
      from_product_id: FROM_PRODUCT_IDENTIFIER,
    });
    expect(authHeader).toBe(`Bearer ${SUBSCRIBER_TOKEN_1}`);
    expect(response.operation_session_id).toBe("rcbopsess_start");
  });

  test("start omits from_product_id when not provided", async () => {
    let requestBody: {
      new_product_id?: string;
      from_product_id?: string;
    } = {};

    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/subscription/change/checkout/start",
        async ({ request }) => {
          requestBody = (await request.json()) as typeof requestBody;
          return HttpResponse.json(
            {
              operation_session_id: "rcbopsess_inferred",
              change_type: "immediate",
              from_product: {
                product_id: "monthly",
                display_name: "Monthly",
                price_in_micros: 9990000,
                currency: "USD",
              },
              to_product: {
                product_id: "annual",
                display_name: "Annual",
                price_in_micros: 99990000,
                currency: "USD",
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
              payment_method: null,
              billing_address: null,
            },
            { status: 201 },
          );
        },
      ),
    );

    await backend.postSubscriptionChangeCheckoutStart(
      "annual",
      undefined,
      SUBSCRIBER_TOKEN_1,
    );

    expect(requestBody).toEqual({
      new_product_id: "annual",
    });
    expect(requestBody.from_product_id).toBeUndefined();
  });

  test("confirm posts to session confirm endpoint", async () => {
    let authHeader: string | null = null;
    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/subscription/change/checkout/rcbopsess_start/confirm",
        ({ request }) => {
          authHeader = request.headers.get("Authorization");
          return HttpResponse.json(
            {
              operation_session_id: "rcbopsess_start",
              change_type: "immediate",
              new_product_id: "annual",
            },
            { status: 200 },
          );
        },
      ),
    );

    const response = await backend.postSubscriptionChangeCheckoutConfirm(
      "rcbopsess_start",
      SUBSCRIBER_TOKEN_1,
    );

    expect(authHeader).toBe(`Bearer ${SUBSCRIBER_TOKEN_1}`);
    expect(response.new_product_id).toBe("annual");
  });
});
