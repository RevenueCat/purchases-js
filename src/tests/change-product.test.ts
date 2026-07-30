import { describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { configurePurchases, server } from "./base.purchases_test";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { expectPromiseToError } from "./test-helpers";
import { Backend } from "../networking/backend";

describe("Purchases.changeProduct", () => {
  test("rejects API-key shaped subscriber tokens", async () => {
    const purchases = configurePurchases();

    await expectPromiseToError(
      purchases.changeProduct({
        newProductId: "annual_product",
        subscriberToken: "rcb_test_api_key",
        subscriptionId: "subabc123",
      }),
      new PurchasesError(
        ErrorCode.ConfigurationError,
        "Invalid subscriber token.",
      ),
    );
  });

  test("requires subscriptionId", async () => {
    const purchases = configurePurchases();

    await expectPromiseToError(
      purchases.changeProduct({
        newProductId: "annual_product",
        subscriberToken: "eyJhbGciOiJSUzI1NiJ9.subscriber.token",
        subscriptionId: "",
      }),
      new PurchasesError(
        ErrorCode.PurchaseInvalidError,
        "subscriptionId is required.",
        "Pass the RevenueCat subscription public id (sub…) for the " +
          "subscription to change.",
      ),
    );
  });
});

describe("product change checkout networking", () => {
  const backend = new Backend("rcb_test_api_key");

  test("start sends subscription_id and maps response", async () => {
    let requestBody: {
      new_product_id?: string;
      subscription_id?: string;
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
      "subabc123",
      "eyJhbGciOiJSUzI1NiJ9.subscriber.token",
    );

    expect(requestBody).toEqual({
      new_product_id: "annual",
      subscription_id: "subabc123",
    });
    expect(authHeader).toBe("Bearer eyJhbGciOiJSUzI1NiJ9.subscriber.token");
    expect(response.operation_session_id).toBe("rcbopsess_start");
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
      "eyJhbGciOiJSUzI1NiJ9.subscriber.token",
    );

    expect(authHeader).toBe("Bearer eyJhbGciOiJSUzI1NiJ9.subscriber.token");
    expect(response.new_product_id).toBe("annual");
  });
});
