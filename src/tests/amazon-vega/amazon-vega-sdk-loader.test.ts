import { describe, expect, test, vi } from "vitest";
import {
  loadAmazonVegaSdk,
  type AmazonVegaSdk,
} from "../../amazon-vega/amazon-vega-sdk-loader";

describe("AmazonVegaSdkLoader", () => {
  test("loads the Amazon SDK once and returns the cached promise", async () => {
    const sdk = {} as AmazonVegaSdk;
    const importer = vi.fn(() => Promise.resolve(sdk));

    const firstLoad = loadAmazonVegaSdk(importer);
    const secondLoad = loadAmazonVegaSdk(importer);

    expect(importer).toHaveBeenCalledOnce();
    expect(secondLoad).toBe(firstLoad);
    await expect(firstLoad).resolves.toBe(sdk);
  });
});
