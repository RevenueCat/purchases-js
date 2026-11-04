import { cleanup, render, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Stripe, StripeEmbeddedCheckout } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import StripeCheckoutPage from "../../../ui/pages/stripe-checkout-page.svelte";
import { StripeService } from "../../../stripe/stripe-service";

vi.mock("@stripe/stripe-js/pure", () => ({ loadStripe: vi.fn() }));
const params = {
  stripe_account_id: "mock-account",
  publishable_api_key: "mock-key",
  client_secret: "mock-secret",
  environment: "test",
};
const client = () => ({ mount: vi.fn(), destroy: vi.fn() });

beforeEach(() => vi.resetAllMocks());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setupDeferredFirstCheckout() {
  let resolve!: (value: StripeEmbeddedCheckout) => void;
  let reject!: (error: Error) => void;
  const pending = new Promise<StripeEmbeddedCheckout>(
    (resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    },
  );
  const second = client();
  // Intentionally no singleton restriction: the public lifecycle contract does
  // not establish what real Stripe does for overlapping initialization calls.
  const initialize = vi
    .fn()
    .mockReturnValueOnce(pending)
    .mockResolvedValueOnce(second);
  vi.mocked(loadStripe).mockResolvedValue({
    createEmbeddedCheckoutPage: initialize,
  } as unknown as Stripe);
  const service = vi.spyOn(StripeService, "initializeStripeCheckout");
  return { resolve, reject, second, initialize, service };
}

describe("Embedded Checkout close/reopen without assumed Stripe singleton behavior", () => {
  test("control: a reopened page mounts its own client while the closed page is pending", async () => {
    const state = setupDeferredFirstCheckout();
    const oldError = vi.fn();
    const oldPage = render(StripeCheckoutPage, {
      stripeBillingParams: params,
      onContinue: vi.fn(),
      onError: oldError,
    });
    await waitFor(() => expect(state.initialize).toHaveBeenCalledTimes(1));
    await oldPage.unmount();
    const newError = vi.fn();
    const newPage = render(StripeCheckoutPage, {
      stripeBillingParams: params,
      onContinue: vi.fn(),
      onError: newError,
    });
    await waitFor(() => expect(state.second.mount).toHaveBeenCalledTimes(1));
    const oldClient = client();
    state.resolve(oldClient as unknown as StripeEmbeddedCheckout);
    await state.service.mock.results[0].value;
    await tick();
    expect(oldClient.mount).not.toHaveBeenCalled();
    expect(state.second.mount.mock.calls[0][0].isConnected).toBe(true);
    expect(state.second.destroy).not.toHaveBeenCalled();
    expect(oldError).not.toHaveBeenCalled();
    expect(newError).not.toHaveBeenCalled();
    await newPage.unmount();
    expect(state.second.destroy).toHaveBeenCalledTimes(1);
    expect(oldClient.destroy).toHaveBeenCalledTimes(1);
  });

  test("cleans the late old client without destroying the reopened page's client", async () => {
    const state = setupDeferredFirstCheckout();
    const oldPage = render(StripeCheckoutPage, {
      stripeBillingParams: params,
      onContinue: vi.fn(),
      onError: vi.fn(),
    });
    await waitFor(() => expect(state.initialize).toHaveBeenCalledTimes(1));
    await oldPage.unmount();
    const newPage = render(StripeCheckoutPage, {
      stripeBillingParams: params,
      onContinue: vi.fn(),
      onError: vi.fn(),
    });
    await waitFor(() => expect(state.second.mount).toHaveBeenCalledTimes(1));
    const oldClient = client();
    state.resolve(oldClient as unknown as StripeEmbeddedCheckout);
    await state.service.mock.results[0].value;
    await tick();

    expect.soft(oldClient.destroy).toHaveBeenCalledTimes(1);
    expect.soft(oldClient.mount).not.toHaveBeenCalled();
    expect.soft(state.second.destroy).not.toHaveBeenCalled();
    await newPage.unmount();
    expect(state.second.destroy).toHaveBeenCalledTimes(1);
  });

  test("ignores a late initialization failure from the closed page after reopen", async () => {
    const state = setupDeferredFirstCheckout();
    const oldError = vi.fn();
    const oldPage = render(StripeCheckoutPage, {
      stripeBillingParams: params,
      onContinue: vi.fn(),
      onError: oldError,
    });
    await waitFor(() => expect(state.initialize).toHaveBeenCalledTimes(1));
    await oldPage.unmount();
    const newError = vi.fn();
    const newPage = render(StripeCheckoutPage, {
      stripeBillingParams: params,
      onContinue: vi.fn(),
      onError: newError,
    });
    await waitFor(() => expect(state.second.mount).toHaveBeenCalledTimes(1));
    state.reject(
      new Error("mocked old checkout initialization failed after close"),
    );
    await state.service.mock.results[0].value.catch(() => {});
    await tick();

    expect.soft(oldError).not.toHaveBeenCalled();
    expect.soft(newError).not.toHaveBeenCalled();
    expect.soft(state.second.destroy).not.toHaveBeenCalled();
    await newPage.unmount();
    expect(state.second.destroy).toHaveBeenCalledTimes(1);
  });

  test("control: an initialization failure on a live page invokes its error callback", async () => {
    const state = setupDeferredFirstCheckout();
    const onError = vi.fn();
    render(StripeCheckoutPage, {
      stripeBillingParams: params,
      onContinue: vi.fn(),
      onError,
    });
    await waitFor(() => expect(state.initialize).toHaveBeenCalledTimes(1));
    state.reject(new Error("mocked live initialization failure"));
    await state.service.mock.results[0].value.catch(() => {});
    await tick();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
