import { describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { configurePurchases, server } from "./base.purchases_test";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { expectPromiseToError } from "./test-helpers";

describe("Purchases.changeProduct", () => {
  const subscriptionChangeResponse = {
    operation_session_id: "rcbopsess_test_id",
    change_type: "immediate",
    new_product_id: "annual_product",
  };

  function setSubscriptionChangeResponse(httpResponse: HttpResponse) {
    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/subscription/change",
        () => {
          return httpResponse;
        },
      ),
    );
  }

  test("performs the change and returns the mapped result", async () => {
    setSubscriptionChangeResponse(
      HttpResponse.json(subscriptionChangeResponse, { status: 201 }),
    );
    const purchases = configurePurchases();

    const result = await purchases.changeProduct({
      newProductId: "annual_product",
      subscriberToken: "eyJhbGciOiJSUzI1NiJ9.subscriber.token",
    });

    expect(result).toEqual({
      operationSessionId: "rcbopsess_test_id",
      changeType: "immediate",
      newProductId: "annual_product",
    });
  });

  test("sends sourceProductId when provided", async () => {
    let requestBody: { new_product_id?: string; source_product_id?: string } =
      {};
    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/subscription/change",
        async ({ request }) => {
          requestBody = (await request.json()) as typeof requestBody;
          return HttpResponse.json(subscriptionChangeResponse, { status: 201 });
        },
      ),
    );
    const purchases = configurePurchases();

    await purchases.changeProduct({
      newProductId: "annual_product",
      subscriberToken: "eyJhbGciOiJSUzI1NiJ9.subscriber.token",
      sourceProductId: "monthly_product",
    });

    expect(requestBody).toEqual({
      new_product_id: "annual_product",
      source_product_id: "monthly_product",
    });
  });

  test.each([
    "rcb_public_key_like",
    "rcb_sb_sandbox_key_like",
    "sk_secret_key_like",
    "pdl_paddle_key_like",
    "strp_stripe_key_like",
    "",
  ])(
    "rejects tokens that look like API keys or are empty: '%s'",
    async (badToken: string) => {
      const purchases = configurePurchases();

      await expectPromiseToError(
        purchases.changeProduct({
          newProductId: "annual_product",
          subscriberToken: badToken,
        }),
        new PurchasesError(
          ErrorCode.ConfigurationError,
          "Invalid subscriber token.",
          "The subscriberToken must be a short-lived subscriber access token " +
            "minted server-side with a secret API key via the RevenueCat " +
            "Developer API authenticate endpoint. Never pass a RevenueCat API " +
            "key from the browser.",
        ),
      );
    },
  );
});
