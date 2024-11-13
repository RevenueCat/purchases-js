import { AppUserIDProvider, Purchases } from "../main";
import { setupServer } from "msw/node";
import { APIGetRequest, getRequestHandlers } from "./test-responses";
import { afterAll, beforeAll, beforeEach } from "vitest";

export const testApiKey = "rcb_test_api_key";
export const testUserId = "someAppUserId";

const server = setupServer(...getRequestHandlers());

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  APIGetRequest.mockReset();
  if (Purchases.isConfigured()) {
    Purchases.getSharedInstance().close();
  }
});

afterAll(() => server.close());

export function configurePurchases(
  appUserId: string | AppUserIDProvider = testUserId,
): Purchases {
  return Purchases.configure(testApiKey, appUserId);
}
