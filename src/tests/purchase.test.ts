import { beforeEach, describe, expect, test } from "vitest";
import { configurePurchases, server } from "./base.purchases_test";
import { APIGetRequest, type GetRequest } from "./test-responses";
import { http, HttpResponse } from "msw";
import { buildAssetURL } from "../networking/assets";

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("purchase", () => {
  test("purchase loads branding if not preloaded", async () => {
    const purchases = configurePurchases();
    const expectedRequest: GetRequest = {
      url: "http://localhost:8000/rcbilling/v1/branding",
    };
    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];
    expect(packageToBuy).not.toBeNull();
    expect(APIGetRequest).not.toHaveBeenCalledWith(expectedRequest);
    // Currently we hold on the purchase UI, so we add a timeout to not hold the test forever.
    // We're just checking that the request happened as expected.
    await Promise.race([
      purchases.purchase({
        rcPackage: packageToBuy!,
      }),
      new Promise((resolve) => setTimeout(resolve, 100)),
    ]);
    expect(APIGetRequest).toHaveBeenCalledWith(expectedRequest);
  });
});

describe("preload", () => {
  test("loads branding info", async () => {
    const purchases = configurePurchases();
    const expectedRequest: GetRequest = {
      url: "http://localhost:8000/rcbilling/v1/branding",
    };
    expect(APIGetRequest).not.toHaveBeenCalledWith(expectedRequest);
    await purchases.preload();
    expect(APIGetRequest).toHaveBeenCalledWith(expectedRequest);
  });

  test("does not load branding info if using simulated store api key", async () => {
    const purchases = configurePurchases(
      "test-app-user-id",
      "test-rc-source",
      "test_store_api_key",
    );
    const expectedRequest: GetRequest = {
      url: "http://localhost:8000/rcbilling/v1/branding",
    };
    expect(APIGetRequest).not.toHaveBeenCalledWith(expectedRequest);
    await purchases.preload();
    expect(APIGetRequest).not.toHaveBeenCalledWith(expectedRequest);
  });

  test("injects an apple-touch-icon when branding provides one", async () => {
    server.use(
      http.get("http://localhost:8000/rcbilling/v1/branding", ({ request }) => {
        APIGetRequest({ url: request.url });
        return HttpResponse.json(
          {
            id: "test-app-id",
            app_name: "Test Company name",
            app_icon: "apple-touch-icon.png",
            app_icon_webp: null,
            app_wordmark: null,
            app_wordmark_webp: null,
            appearance: null,
            support_email: "test-rcbilling-support@revenuecat.com",
            gateway_tax_collection_enabled: false,
            brand_font_config: null,
          },
          { status: 200 },
        );
      }),
    );

    const purchases = configurePurchases();
    await purchases.preload();

    const appleTouchIcon = document.head.querySelector<HTMLLinkElement>(
      'link[rel="apple-touch-icon"]',
    );
    expect(appleTouchIcon).not.toBeNull();
    expect(appleTouchIcon?.getAttribute("href")).toBe(
      buildAssetURL("apple-touch-icon.png"),
    );
    expect(appleTouchIcon?.getAttribute("data-rc-apple-touch-icon")).toBe(
      "true",
    );
  });

  test("does not overwrite an existing apple-touch-icon", async () => {
    document.head.innerHTML =
      '<link rel="apple-touch-icon" href="/host-provided-icon.png">';

    server.use(
      http.get("http://localhost:8000/rcbilling/v1/branding", ({ request }) => {
        APIGetRequest({ url: request.url });
        return HttpResponse.json(
          {
            id: "test-app-id",
            app_name: "Test Company name",
            app_icon: "apple-touch-icon.png",
            app_icon_webp: null,
            app_wordmark: null,
            app_wordmark_webp: null,
            appearance: null,
            support_email: "test-rcbilling-support@revenuecat.com",
            gateway_tax_collection_enabled: false,
            brand_font_config: null,
          },
          { status: 200 },
        );
      }),
    );

    const purchases = configurePurchases();
    await purchases.preload();

    const appleTouchIcons = document.head.querySelectorAll(
      'link[rel="apple-touch-icon"]',
    );
    expect(appleTouchIcons).toHaveLength(1);
    expect(appleTouchIcons[0]?.getAttribute("href")).toBe(
      "/host-provided-icon.png",
    );
    expect(
      appleTouchIcons[0]?.getAttribute("data-rc-apple-touch-icon"),
    ).toBeNull();
  });
});
