import { Purchases } from "../main";
import { setupServer } from "msw/node";
import {
  APIGetRequest,
  APIPostRequest,
  getRequestHandlers,
} from "./test-responses";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { defaultHttpConfig } from "../entities/http-config";

export const testApiKey = "rcb_test_api_key";
export const testUserId = "someAppUserId";

export const server = setupServer(...getRequestHandlers());

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  APIGetRequest.mockReset();
  APIPostRequest.mockReset();
  server.resetHandlers();
  if (Purchases.isConfigured()) {
    Purchases.getSharedInstance().close();
  }
});

afterAll(() => server.close());

export function configurePurchases(
  appUserId: string = testUserId,
  rcSource: string = "rcSource",
): Purchases {
  return Purchases.configure(testApiKey, appUserId, defaultHttpConfig, {
    rcSource: rcSource,
  });
}
