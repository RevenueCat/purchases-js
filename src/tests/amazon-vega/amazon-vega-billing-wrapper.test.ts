import { describe, expect, test, vi } from "vitest";
import {
  ProductDataResponseCode,
  PurchasingService,
} from "@amazon-devices/keplerscript-appstore-iap-lib";
import { AmazonVegaBillingWrapper } from "../../amazon-vega/amazon-vega-billing-wrapper";
import type { AmazonVegaSdk } from "../../amazon-vega/amazon-vega-sdk-loader";
import { ErrorCode, PurchasesError } from "../../entities/errors";

vi.mock("@amazon-devices/keplerscript-appstore-iap-lib", () => ({
  ProductDataResponseCode: { SUCCESSFUL: 1 },
  ProductType: { CONSUMABLE: 1, ENTITLED: 2, SUBSCRIPTION: 3 },
  PurchasingService: { getProductData: vi.fn() },
}));

type AmazonIapSdkGetter = {
  getAmazonIapSdk(): Promise<AmazonVegaSdk>;
};

function getAmazonIapSdk(
  wrapper: AmazonVegaBillingWrapper,
): Promise<AmazonVegaSdk> {
  return (wrapper as unknown as AmazonIapSdkGetter).getAmazonIapSdk();
}

describe("AmazonVegaBillingWrapper", () => {
  test("returns the Amazon SDK from its loader", async () => {
    const sdk = {} as AmazonVegaSdk;
    const loader = vi.fn(() => Promise.resolve(sdk));
    const wrapper = new AmazonVegaBillingWrapper(loader);

    await expect(getAmazonIapSdk(wrapper)).resolves.toBe(sdk);
    expect(loader).toHaveBeenCalledOnce();
  });

  test("preloads the Amazon SDK through its cached loader", async () => {
    const loader = vi.fn(() => Promise.resolve({} as AmazonVegaSdk));
    const wrapper = new AmazonVegaBillingWrapper(loader);

    await expect(wrapper.preload()).resolves.toBeUndefined();
    expect(loader).toHaveBeenCalledOnce();
  });

  test("loads the Amazon SDK before querying product details", async () => {
    const loader = vi.fn(() => Promise.resolve({} as AmazonVegaSdk));
    const wrapper = new AmazonVegaBillingWrapper(loader);
    vi.mocked(PurchasingService.getProductData).mockResolvedValue({
      responseCode: ProductDataResponseCode.SUCCESSFUL,
      productData: new Map(),
      unavailableSkus: [],
    });

    await expect(wrapper.getProducts("appUserId", [])).resolves.toEqual({
      product_details: [],
    });
    expect(loader).toHaveBeenCalledOnce();
  });

  test("converts an SDK loading failure into a configuration error", async () => {
    const underlyingError = new Error("Cannot find package");
    const loader = vi.fn(() => Promise.reject(underlyingError));
    const wrapper = new AmazonVegaBillingWrapper(loader);

    await expect(getAmazonIapSdk(wrapper)).rejects.toMatchObject({
      errorCode: ErrorCode.ConfigurationError,
      message: "Amazon Vega IAP SDK is unavailable.",
      underlyingErrorMessage: "Cannot find package",
    });
  });

  test("preserves a typed loader error", async () => {
    const loaderError = new PurchasesError(
      ErrorCode.ConfigurationError,
      "The Amazon SDK is incompatible",
    );
    const loader = vi.fn(() => Promise.reject(loaderError));
    const wrapper = new AmazonVegaBillingWrapper(loader);

    await expect(getAmazonIapSdk(wrapper)).rejects.toBe(loaderError);
  });

  test("omits an underlying error message for non-Error loading failures", async () => {
    const loader = vi.fn(() => Promise.reject("SDK unavailable"));
    const wrapper = new AmazonVegaBillingWrapper(loader);

    await expect(getAmazonIapSdk(wrapper)).rejects.toMatchObject({
      errorCode: ErrorCode.ConfigurationError,
      underlyingErrorMessage: undefined,
    });
  });
});
