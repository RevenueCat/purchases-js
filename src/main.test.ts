import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeAll, expect, test } from "vitest";
import { Purchases } from "./main";

const server = setupServer(
  http.get("http://localhost:8000/rcbilling/v1/entitlements/:appUserId", () => {
    // const { appUserId } = params;
    return HttpResponse.json({}, { status: 200 });
  }),
);

beforeAll(() => {
  server.listen();
});

test("Purchases is defined", () => {
  const billing = new Purchases("test_api_key");
  expect(billing).toBeDefined();
});

test("Can log in with an app user ID", async () => {
  const billing = new Purchases("test_api_key");
  await billing.logIn("test_app_user_id");
});
