import { describe, expect, test } from "vitest";
import { isAmazonApiKey } from "../../helpers/api-key-helper";

describe("isAmazonApiKey", () => {
  test.each([
    "amzn_key",
    "amzn_key.with-dashes_and_underscores",
    "amzn_1234567890",
  ])("returns true for a valid Amazon API key: %s", (apiKey) => {
    expect(isAmazonApiKey(apiKey)).toBe(true);
  });

  test.each([
    "",
    "amzn_",
    "amzn_key with spaces",
    "amzn_key/with/slashes",
    "amzn_key!",
    "goog_valid_key",
    "appl_valid_key",
    "galx_valid_key",
    "test_valid_key",
    "pdl_valid_key",
    "rcb_valid_key",
    "AMZN_valid_key",
  ])("returns false for an invalid Amazon API key: %s", (apiKey) => {
    expect(isAmazonApiKey(apiKey)).toBe(false);
  });
});
