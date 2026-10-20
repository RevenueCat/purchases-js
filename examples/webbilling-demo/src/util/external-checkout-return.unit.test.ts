import { describe, expect, it } from "vitest";
import {
  checkoutReturnContext,
  checkoutReturnUrl,
} from "./external-checkout-return";

describe("external checkout return routing", () => {
  it("preserves customer identity, app settings and continuation without browser storage", () => {
    const original =
      "http://localhost:3010/rc_paywall/customer%2Bname?offeringId=demo&currency=USD#packages";
    const url = new URL(checkoutReturnUrl(original, "customer+name"));
    expect(url.pathname).toBe("/checkout-return/customer%2Bname");
    expect(url.searchParams.get("offeringId")).toBe("demo");
    expect(url.searchParams.get("currency")).toBe("USD");
    expect(url.searchParams.has("checkout_token")).toBe(false);
    url.searchParams.set("checkout_token", "opaque-return-token");
    expect(checkoutReturnContext(url.toString())).toEqual({
      token: "opaque-return-token",
      continueTo:
        "/rc_paywall/customer%2Bname?offeringId=demo&currency=USD#packages",
    });
  });

  it.each(["", "checkout_token=", "checkout_token=one&checkout_token=two"])(
    "rejects missing or ambiguous token %s",
    (query) => {
      expect(() =>
        checkoutReturnContext(
          `https://demo.example/checkout-return/customer?${query}`,
        ),
      ).toThrow();
    },
  );

  it.each([
    "https://another.example/page",
    "//another.example/page",
    "javascript:alert(1)",
    "http://[invalid",
  ])("does not continue to a different origin %s", (destination) => {
    const url = new URL(
      "https://demo.example/checkout-return/customer?checkout_token=token",
    );
    url.searchParams.set("continue_to", destination);
    expect(checkoutReturnContext(url.toString()).continueTo).toBe("/");
  });

  it("reconfiguring after return preserves the original continuation and removes the old token", () => {
    const original = checkoutReturnUrl(
      "http://localhost:3010/rc_paywall/user?offeringId=demo",
      "user",
    );
    const returned = new URL(original);
    returned.searchParams.set("checkout_token", "old-token");
    const next = new URL(checkoutReturnUrl(returned.toString(), "user"));
    expect(next.searchParams.has("checkout_token")).toBe(false);
    expect(next.searchParams.get("continue_to")).toBe(
      "/rc_paywall/user?offeringId=demo",
    );
  });
});
