import { expect } from "@playwright/test";
import { integrationTest } from "./helpers/integration-test";
import { navigateToLandingUrl } from "./helpers/test-helpers";

integrationTest("Can set user attributes", async ({ page, userId }) => {
  page = await navigateToLandingUrl(page, userId, {
    $displayName: "Test User",
    nickname: "testy",
  });

  // Verify the attributes were set by checking the network requests
  const requestPromise = page.waitForRequest(
    (request) =>
      request.url().includes("/v1/subscribers/") &&
      request.url().includes("/attributes") &&
      request.method() === "POST",
  );

  const request = await requestPromise;
  const requestBody = request.postDataJSON();

  expect(requestBody).toHaveProperty("$displayName", "Test User");
  expect(requestBody).toHaveProperty("nickname", "testy");
});
