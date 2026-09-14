import { describe, expect, test } from "vitest";
import {
  appendExternalPurchaseTokenId,
  getExternalPurchaseTokenId,
  RC_EXTERNAL_PURCHASE_TOKEN_ID_QUERY_PARAMETER,
} from "./external-purchase-token";

describe("external purchase token query parameter", () => {
  test("appends a trimmed token ID", () => {
    const searchParams = new URLSearchParams();

    appendExternalPurchaseTokenId(
      searchParams,
      "  rcat_external_purchase_token_123  ",
    );

    expect(
      searchParams.get(RC_EXTERNAL_PURCHASE_TOKEN_ID_QUERY_PARAMETER),
    ).toBe("rcat_external_purchase_token_123");
  });

  test("omits an empty token ID", () => {
    const searchParams = new URLSearchParams();

    appendExternalPurchaseTokenId(searchParams, "   ");

    expect(
      searchParams.has(RC_EXTERNAL_PURCHASE_TOKEN_ID_QUERY_PARAMETER),
    ).toBe(false);
  });

  test("reads the SDK token ID from the public URL parameter", () => {
    const searchParams = new URLSearchParams({
      [RC_EXTERNAL_PURCHASE_TOKEN_ID_QUERY_PARAMETER]:
        "rcat_external_purchase_token_123",
    });

    expect(getExternalPurchaseTokenId(searchParams)).toBe(
      "rcat_external_purchase_token_123",
    );
  });
});
