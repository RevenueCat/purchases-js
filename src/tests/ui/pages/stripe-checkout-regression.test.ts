import { cleanup, render, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Stripe, StripeEmbeddedCheckout } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import { tick } from "svelte";
import StripeCheckoutPage from "../../../ui/pages/stripe-checkout-page.svelte";
import { StripeService } from "../../../stripe/stripe-service";

vi.mock("@stripe/stripe-js/pure", () => ({ loadStripe: vi.fn() }));

// All identifiers are inert placeholders; no Stripe or RevenueCat requests occur.
const params = {
  stripe_account_id: "mock-account",
  publishable_api_key: "mock-key",
  client_secret: "mock-secret",
  environment: "test",
};

beforeEach(() => vi.resetAllMocks());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Embedded Checkout lifecycle", () => {
  test("ignores a retained completion callback after page disposal", async () => {
    let complete!: () => void;
    const checkout = { mount: vi.fn(), destroy: vi.fn() };
    vi.mocked(loadStripe).mockResolvedValue({
      createEmbeddedCheckoutPage: vi
        .fn()
        .mockImplementation(async (options: { onComplete: () => void }) => {
          complete = options.onComplete;
          return checkout;
        }),
    } as unknown as Stripe);
    const onContinue = vi.fn();
    const onError = vi.fn();
    const page = render(StripeCheckoutPage, {
      stripeBillingParams: params,
      onContinue,
      onError,
    });
    await waitFor(() => expect(checkout.mount).toHaveBeenCalledTimes(1));
    complete();
    expect(onContinue).toHaveBeenCalledTimes(1);
    await page.unmount();
    complete();
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(checkout.destroy).toHaveBeenCalledTimes(1);
  });

  test("control: destroys an initialized checkout on ordinary unmount", async () => {
    const checkout = { mount: vi.fn(), destroy: vi.fn() };
    vi.mocked(loadStripe).mockResolvedValue({
      createEmbeddedCheckoutPage: vi.fn().mockResolvedValue(checkout),
    } as unknown as Stripe);
    const page = render(StripeCheckoutPage, {
      stripeBillingParams: params,
      onContinue: vi.fn(),
      onError: vi.fn(),
    });
    await waitFor(() => expect(checkout.mount).toHaveBeenCalledTimes(1));
    await page.unmount();
    expect(checkout.destroy).toHaveBeenCalledTimes(1);
  });

  test("destroys a checkout whose initialization resolves after unmount", async () => {
    const serviceInitialization = vi.spyOn(
      StripeService,
      "initializeStripeCheckout",
    );
    let resolveCheckout!: (checkout: StripeEmbeddedCheckout) => void;
    const pendingCheckout = new Promise<StripeEmbeddedCheckout>((resolve) => {
      resolveCheckout = resolve;
    });
    const initialize = vi.fn().mockReturnValue(pendingCheckout);
    vi.mocked(loadStripe).mockResolvedValue({
      createEmbeddedCheckoutPage: initialize,
    } as unknown as Stripe);
    const checkout = { mount: vi.fn(), destroy: vi.fn() };
    const page = render(StripeCheckoutPage, {
      stripeBillingParams: params,
      onContinue: vi.fn(),
      onError: vi.fn(),
    });
    await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
    await page.unmount();
    resolveCheckout(checkout as unknown as StripeEmbeddedCheckout);
    // Await the real service promise and flush Svelte after resolving Stripe.
    await serviceInitialization.mock.results[0].value;
    await tick();
    expect.soft(checkout.destroy).toHaveBeenCalledTimes(1);
    expect.soft(checkout.mount).not.toHaveBeenCalled();
  });
});
