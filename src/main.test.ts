import { beforeEach, expect, test, vi } from "vitest";
import { RCBilling } from "./main";

// Mocking Stripe object
const elementMock = {
  mount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  update: vi.fn(),
};

const elementsMock = {
  create: vi.fn(() => elementMock),
};

const stripeMock = {
  elements: vi.fn(() => elementsMock),
  createToken: vi.fn(async () => {
    await Promise.resolve();
  }),
  createSource: vi.fn(async () => {
    await Promise.resolve();
  }),
};

// Set the global Stripe
beforeEach(() => {
  // Since we are in a module environment, you might need to use globalThis
  window.Stripe = vi.fn(() => stripeMock);
});

// If you need to reset the mocks before each test, you can do it in a beforeEach hook
beforeEach(() => {
  vi.clearAllMocks();
});

test("RCBilling is defined", () => {
  const billing = new RCBilling("test_api_key", "test_app_user_id");
  expect(billing).toBeDefined();
});
