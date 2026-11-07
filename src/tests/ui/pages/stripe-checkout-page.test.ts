import { render, waitFor } from "@testing-library/svelte";
import { describe, expect, test, vi } from "vitest";
import type { Stripe } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import StripeCheckoutPage from "../../../ui/pages/stripe-checkout-page.svelte";

vi.mock("@stripe/stripe-js/pure", () => ({
  loadStripe: vi.fn(),
}));

describe("StripeCheckoutPage", () => {
  test("passes the Stripe error message to onError when embedded checkout fails to initialize", async () => {
    const mockStripe: Partial<Stripe> = {
      createEmbeddedCheckoutPage: vi
        .fn()
        .mockRejectedValue(
          new Error("You cannot have multiple Embedded Checkout objects."),
        ),
    };
    vi.mocked(loadStripe).mockResolvedValue(mockStripe as Stripe);
    const onError = vi.fn();

    render(StripeCheckoutPage, {
      props: {
        stripeBillingParams: {
          client_secret: "cs_test_123",
          environment: "production",
          publishable_api_key: "pk_test_123",
          stripe_account_id: "acct_test_123",
        },
        onContinue: vi.fn(),
        onError,
      },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You cannot have multiple Embedded Checkout objects.",
        }),
      );
    });
  });
});
