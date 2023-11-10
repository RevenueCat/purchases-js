import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeAll, beforeEach, expect, test, vi } from "vitest";
import { Purchases } from "./main";

const server = setupServer(
  http.get("https://api.revenuecat.com/v1/subscribers/:appUserId", () => {
    // const { appUserId } = params;
    return HttpResponse.json({}, { status: 200 });
  }),
);

beforeAll(() => {
  server.listen();
});

// Set the global Stripe
beforeEach(() => {
  // Since we are in a module environment, you might need to use globalThis
  //window.Stripe = vi.fn(() => stripeMock);
});

// If you need to reset the mocks before each test, you can do it in a beforeEach hook
beforeEach(() => {
  vi.clearAllMocks();
});

test("Purchases is defined", () => {
  console.log(Purchases);
  const billing = new Purchases("test_api_key");
  expect(billing).toBeDefined();
});

test("Can log in with an app user ID", async () => {
  const billing = new Purchases("test_api_key");
  await billing.logIn("test_app_user_id");
});
