import { beforeAll, expect, test } from "vitest";
import { Purchases } from "../../main";
import { waitForEntitlement } from "../../helpers/entitlement-checking-helper";
import { setupServer } from "msw/node";
import { getEntitlementsResponseHandlers } from "../test-responses";

const STRIPE_TEST_DATA = {
  stripe: { accountId: "acct_123", publishableKey: "pk_123" },
} as const;

const server = setupServer(...getEntitlementsResponseHandlers());

beforeAll(() => {
  server.listen();
});

test("returns true if a user is entitled and uses waitForEntitlement", async () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const isEntitled = await waitForEntitlement(
    billing,
    "someAppUserId",
    "someEntitlement",
    2,
  );
  expect(isEntitled).toBeTruthy();
});

test("returns false if a user is not entitled and uses waitForEntitlement", async () => {
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const isEntitled = await waitForEntitlement(
    billing,
    "someOtherAppUserId",
    "someEntitlement",
    2,
  );
  expect(isEntitled).not.toBeTruthy();
});
