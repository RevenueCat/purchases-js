import { beforeEach, describe, expect, test } from "vitest";
import {
  configurePurchases,
  server,
  testApiKey,
  testUserId,
} from "./base.purchases_test";
import { APIGetRequest, type GetRequest } from "./test-responses";
import { http, HttpResponse } from "msw";
import { buildAssetURL } from "../networking/assets";

const applePayBrandingLogoFlags = { applePayBrandingLogoEnabled: true };

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

  test("does not inject an apple-touch-icon when the flag is disabled", async () => {
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

    expect(
      document.head.querySelector('link[rel="apple-touch-icon"]'),
    ).toBeNull();
  });

  test("injects an apple-touch-icon when branding provides one and the flag is enabled", async () => {
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

    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      testApiKey,
      applePayBrandingLogoFlags,
    );
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

    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      testApiKey,
      applePayBrandingLogoFlags,
    );
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

  test("does not inject an apple-touch-icon in a same-origin iframe when an ancestor already has one", async () => {
    document.head.innerHTML =
      '<link rel="apple-touch-icon" href="/host-provided-icon.png">';

    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);

    expect(iframe.contentWindow).not.toBeNull();
    expect(iframe.contentDocument).not.toBeNull();

    const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "window",
    );
    const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "document",
    );

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: iframe.contentWindow,
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: iframe.contentDocument,
    });

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

    let purchases: ReturnType<typeof configurePurchases> | undefined;

    try {
      purchases = configurePurchases(
        testUserId,
        "rcSource",
        testApiKey,
        applePayBrandingLogoFlags,
      );
      await purchases.preload();
    } finally {
      purchases?.close();

      if (originalWindowDescriptor) {
        Object.defineProperty(globalThis, "window", originalWindowDescriptor);
      }
      if (originalDocumentDescriptor) {
        Object.defineProperty(
          globalThis,
          "document",
          originalDocumentDescriptor,
        );
      }
    }

    expect(
      iframe.contentDocument?.head.querySelector(
        'link[rel="apple-touch-icon"]',
      ),
    ).toBeNull();
    expect(
      document.head
        .querySelector('link[rel="apple-touch-icon"]')
        ?.getAttribute("href"),
    ).toBe("/host-provided-icon.png");
  });
});
