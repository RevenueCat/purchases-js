import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  getBillingProvider,
  registerBillingProvider,
  resetBillingProvider,
} from "../../helpers/billing-provider";
import type { BillingProvider } from "../../helpers/billing-provider";

function createProvider(): BillingProvider {
  return {
    validateApiKey: vi.fn<BillingProvider["validateApiKey"]>(),
    createBillingWrapper: vi.fn<BillingProvider["createBillingWrapper"]>(),
  };
}

describe("billing provider registry", () => {
  beforeEach(() => resetBillingProvider());
  afterEach(() => resetBillingProvider());

  test("has no provider before registration", () => {
    expect(getBillingProvider()).toBeUndefined();
  });

  test("retains the registered provider without initializing billing", () => {
    const provider = createProvider();

    registerBillingProvider(provider);

    expect(getBillingProvider()).toBe(provider);
    expect(getBillingProvider()).toBe(provider);
    expect(provider.validateApiKey).not.toHaveBeenCalled();
    expect(provider.createBillingWrapper).not.toHaveBeenCalled();
  });

  test("replaces an existing provider with the latest registration", () => {
    const original = createProvider();
    const replacement = createProvider();

    registerBillingProvider(original);
    registerBillingProvider(replacement);

    expect(getBillingProvider()).toBe(replacement);
  });

  test("clears the provider on reset and allows registration afterward", () => {
    registerBillingProvider(createProvider());

    resetBillingProvider();

    expect(getBillingProvider()).toBeUndefined();

    const replacement = createProvider();
    registerBillingProvider(replacement);

    expect(getBillingProvider()).toBe(replacement);
  });

  test("can reset repeatedly without a registered provider", () => {
    resetBillingProvider();
    resetBillingProvider();

    expect(getBillingProvider()).toBeUndefined();
  });
});
