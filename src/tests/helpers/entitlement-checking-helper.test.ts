import { beforeAll, expect, test } from "vitest";
import { waitForEntitlement } from "../../helpers/entitlement-checking-helper";
import { setupServer } from "msw/node";
import { getEntitlementsResponseHandlers } from "../test-responses";
import { Backend } from "../../networking/backend";

const server = setupServer(...getEntitlementsResponseHandlers());

beforeAll(() => {
  server.listen();
});

test("returns true if a user is entitled and uses waitForEntitlement", async () => {
  const backend = new Backend("test_api_key");
  const isEntitled = await waitForEntitlement(
    backend,
    "someAppUserId",
    "someEntitlement",
    2,
  );
  expect(isEntitled).toBeTruthy();
});

test("returns false if a user is not entitled and uses waitForEntitlement", async () => {
  const backend = new Backend("test_api_key");
  const isEntitled = await waitForEntitlement(
    backend,
    "someOtherAppUserId",
    "someEntitlement",
    2,
  );
  expect(isEntitled).not.toBeTruthy();
});
