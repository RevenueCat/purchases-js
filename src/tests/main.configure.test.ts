import { beforeEach, describe, expect, test, vi } from "vitest";
import { Logger } from "../helpers/logger";

const mocks = vi.hoisted(() => {
  const loader = {
    load: vi.fn(() => Promise.resolve({})),
  };

  return {
    createAmazonVegaSdkLoader: vi.fn(() => loader),
    loader,
  };
});

vi.mock("../amazon-vega/amazon-vega-sdk-loader", () => ({
  createAmazonVegaSdkLoader: mocks.createAmazonVegaSdkLoader,
}));

import { Purchases } from "../main";

describe("Purchases.configure() Vega SDK loading", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.createAmazonVegaSdkLoader.mockClear();
    mocks.loader.load.mockClear();
    mocks.loader.load.mockResolvedValue({});
  });

  test("starts loading the Vega SDK when configured with an Amazon API key", async () => {
    const debugLog = vi.spyOn(Logger, "debugLog");
    const purchases = Purchases.configure({
      apiKey: "amzn_valid_key",
      appUserId: "appUserId",
    });

    expect(purchases).toBeDefined();
    expect(mocks.createAmazonVegaSdkLoader).toHaveBeenCalledOnce();
    expect(mocks.loader.load).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      expect(debugLog).toHaveBeenCalledWith("Amazon Vega IAP SDK loaded.");
    });
  });

  test.each([
    "rcb_valid_key",
    "rcb_sb_valid_key",
    "pdl_valid_key",
    "strp_valid_key",
    "test_valid_key",
  ])(
    "does not create or load the Vega SDK for a %s configuration",
    (apiKey) => {
      Purchases.configure({ apiKey, appUserId: "appUserId" });

      expect(mocks.createAmazonVegaSdkLoader).not.toHaveBeenCalled();
      expect(mocks.loader.load).not.toHaveBeenCalled();
    },
  );

  test("does not wait for the Vega SDK import before returning from configure", () => {
    let resolveImport: (() => void) | undefined;
    mocks.loader.load.mockImplementationOnce(
      () => new Promise((resolve) => (resolveImport = () => resolve({}))),
    );

    const purchases = Purchases.configure({
      apiKey: "amzn_valid_key",
      appUserId: "appUserId",
    });

    expect(purchases).toBeDefined();
    expect(resolveImport).toBeDefined();
    resolveImport?.();
  });
});
