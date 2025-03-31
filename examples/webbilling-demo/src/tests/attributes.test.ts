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

  // Verify the request payload
  expect(requestBody).toHaveProperty("attributes");
  expect(requestBody.attributes).toHaveProperty("$displayName");
  expect(requestBody.attributes).toHaveProperty("nickname");

  expect(requestBody.attributes["$displayName"]).toHaveProperty(
    "value",
    "Test User",
  );
  expect(requestBody.attributes["$displayName"]).toHaveProperty(
    "updated_at_ms",
  );
  expect(requestBody.attributes["nickname"]).toHaveProperty("value", "testy");
  expect(requestBody.attributes["nickname"]).toHaveProperty("updated_at_ms");

  // Verify the request succeeds by waiting for the response
  const response = await request.response();
  expect(response?.status()).toBe(200);

  // Verify the response body is empty
  const responseBody = await response?.json();
  expect(responseBody).toEqual({});
});
