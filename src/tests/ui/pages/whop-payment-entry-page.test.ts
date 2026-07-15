import { fireEvent, render } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import WhopPaymentEntryPage from "../../../ui/pages/whop-payment-entry-page.svelte";

describe("WhopPaymentEntryPage", () => {
  test("applies RevenueCat branding to the embedded checkout", async () => {
    render(WhopPaymentEntryPage, {
      props: {
        whopGatewayParams: {
          checkout_session_id: "ch_test_123",
          plan_id: "plan_test_123",
          environment: "sandbox",
        },
        checkoutReturnUrl: "https://example.com/checkout",
        brandingAppearance: {
          color_buttons_primary: "#576CDB",
          color_accent: "#1148B8",
          color_error: "#B0171F",
          color_product_info_bg: "#EFF3FA",
          color_form_bg: "#F7F7F7",
          color_page_bg: "#8399BE",
          font: "default",
          shapes: "pill",
          show_product_description: false,
        },
      },
    });

    const loader = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.whop.com/static/checkout/loader.js"]',
    );
    expect(loader).not.toBeNull();
    await fireEvent.load(loader!);

    const checkout = document.querySelector<HTMLElement>(
      '[data-whop-checkout-session="ch_test_123"]',
    );
    expect(checkout).not.toBeNull();
    expect(
      checkout?.getAttribute("data-whop-checkout-theme-background-color"),
    ).toBe("#F7F7F7");
    expect(
      checkout?.getAttribute("data-whop-checkout-theme-accent-color"),
    ).toBe("#576CDB");
    expect(
      checkout?.getAttribute("data-whop-checkout-theme-border-radius"),
    ).toBe("9999");
  });
});
