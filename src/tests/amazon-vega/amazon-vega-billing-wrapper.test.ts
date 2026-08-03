import { describe, expect, test, vi } from "vitest";
import { AmazonVegaBillingWrapper } from "../../amazon-vega/amazon-vega-billing-wrapper";
import type {
  AmazonVegaSdk,
  AmazonVegaSdkLoader,
} from "../../amazon-vega/amazon-vega-sdk-loader";
import { ErrorCode, PurchasesError } from "../../entities/errors";

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
    const loader: AmazonVegaSdkLoader = {
      load: vi.fn(() => Promise.resolve(sdk)),
    };
    const wrapper = new AmazonVegaBillingWrapper(loader);

    await expect(getAmazonIapSdk(wrapper)).resolves.toBe(sdk);
    expect(loader.load).toHaveBeenCalledOnce();
  });

  test("preloads the Amazon SDK through its cached loader", async () => {
    const loader: AmazonVegaSdkLoader = {
      load: vi.fn(() => Promise.resolve({} as AmazonVegaSdk)),
    };
    const wrapper = new AmazonVegaBillingWrapper(loader);

    await expect(wrapper.preload()).resolves.toBeUndefined();
    expect(loader.load).toHaveBeenCalledOnce();
  });

  test("converts an SDK loading failure into a configuration error", async () => {
    const underlyingError = new Error("Cannot find package");
    const loader: AmazonVegaSdkLoader = {
      load: vi.fn(() => Promise.reject(underlyingError)),
    };
    const wrapper = new AmazonVegaBillingWrapper(loader);

    await expect(getAmazonIapSdk(wrapper)).rejects.toMatchObject({
      errorCode: ErrorCode.ConfigurationError,
      message:
        "Amazon Vega IAP SDK is unavailable. Install @amazon-devices/keplerscript-appstore-iap-lib to use an Amazon API key.",
      underlyingErrorMessage: "Cannot find package",
    });
  });

  test("preserves a typed loader error", async () => {
    const loaderError = new PurchasesError(
      ErrorCode.ConfigurationError,
      "The Amazon SDK is incompatible",
    );
    const loader: AmazonVegaSdkLoader = {
      load: vi.fn(() => Promise.reject(loaderError)),
    };
    const wrapper = new AmazonVegaBillingWrapper(loader);

    await expect(getAmazonIapSdk(wrapper)).rejects.toBe(loaderError);
  });

  test("omits an underlying error message for non-Error loading failures", async () => {
    const loader: AmazonVegaSdkLoader = {
      load: vi.fn(() => Promise.reject("SDK unavailable")),
    };
    const wrapper = new AmazonVegaBillingWrapper(loader);

    await expect(getAmazonIapSdk(wrapper)).rejects.toMatchObject({
      errorCode: ErrorCode.ConfigurationError,
      underlyingErrorMessage: undefined,
    });
  });
});
