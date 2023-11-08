import { beforeEach, expect, test, vi } from "vitest";
import { RCBilling } from "./main";

// Set the global Stripe
beforeEach(() => {
  // Since we are in a module environment, you might need to use globalThis
  //window.Stripe = vi.fn(() => stripeMock);
});

// If you need to reset the mocks before each test, you can do it in a beforeEach hook
beforeEach(() => {
  vi.clearAllMocks();
});

test("RCBilling is defined", () => {
  const billing = new RCBilling("test_api_key");
  expect(billing).toBeDefined();
});
