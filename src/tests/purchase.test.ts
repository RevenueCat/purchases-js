import { beforeEach, describe, expect, test, vi } from "vitest";
import { configurePurchases } from "./base.purchases_test";
import { APIGetRequest, type GetRequest } from "./test-responses";
import { mount } from "svelte";
import { Purchases } from "../main";

vi.mock("svelte", () => ({
  mount: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: () => "c1365463-ce59-4b83-b61b-ef0d883e9047",
}));

describe("purchase", () => {
  beforeEach(() => {
    configurePurchases();
  });

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

  test("appends checkout session id to http urls", async () => {
    vi.mocked(mount).mockImplementation((_component, options) => {
      options.props?.onFinished({
        redeemUrl: "https://example.com",
      });
      return vi.fn();
    });

    const purchases = Purchases.getSharedInstance();
    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];

    const result = await purchases.purchase({
      rcPackage: packageToBuy!,
    });

    expect(result.redemptionInfo?.redeemUrl).not.toBeNull();

    const redeemUrl = new URL(result.redemptionInfo!.redeemUrl!);

    expect(redeemUrl.searchParams.get("trace_id")).toBe(
      "c1365463-ce59-4b83-b61b-ef0d883e9047",
    );
    expect(redeemUrl.searchParams.get("checkout_session_id")).toBe(
      "c1365463-ce59-4b83-b61b-ef0d883e9047",
    );
  });

  test("appends checkout session id to https urls", async () => {
    vi.mocked(mount).mockImplementation((_component, options) => {
      options.props?.onFinished({
        redeemUrl: "https://example.com",
      });
      return vi.fn();
    });

    const purchases = Purchases.getSharedInstance();
    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];

    const result = await purchases.purchase({
      rcPackage: packageToBuy!,
    });

    expect(result.redemptionInfo?.redeemUrl).not.toBeNull();

    const redeemUrl = new URL(result.redemptionInfo!.redeemUrl!);

    expect(redeemUrl.searchParams.get("trace_id")).toBe(
      "c1365463-ce59-4b83-b61b-ef0d883e9047",
    );
    expect(redeemUrl.searchParams.get("checkout_session_id")).toBe(
      "c1365463-ce59-4b83-b61b-ef0d883e9047",
    );
  });

  test("does NOT append params to other protocols", async () => {
    vi.mocked(mount).mockImplementation((_component, options) => {
      options.props?.onFinished({
        redeemUrl: "rc-test://example.com/purchase/success",
      });
      return vi.fn();
    });

    const purchases = Purchases.getSharedInstance();
    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];

    const result = await purchases.purchase({
      rcPackage: packageToBuy!,
    });

    expect(result.redemptionInfo?.redeemUrl).not.toBeNull();

    const redeemUrl = new URL(result.redemptionInfo!.redeemUrl!);

    expect(redeemUrl.toString()).toEqual(
      "rc-test://example.com/purchase/success",
    );
    expect(redeemUrl.searchParams.get("trace_id")).toBeNull();
    expect(redeemUrl.searchParams.get("checkout_session_id")).toBeNull();
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
});
