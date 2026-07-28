import { describe, expect, test, vi } from "vitest";
import {
  createAmazonVegaSdkLoader,
  type AmazonVegaSdk,
} from "../../amazon-vega/amazon-vega-sdk-loader";

describe("AmazonVegaSdkLoader", () => {
  test("does not import the Amazon SDK until it is loaded", () => {
    const importer = vi.fn();

    createAmazonVegaSdkLoader(importer);

    expect(importer).not.toHaveBeenCalled();
  });

  test("loads the Amazon SDK once and returns the cached promise", async () => {
    const sdk = {} as AmazonVegaSdk;
    const importer = vi.fn(() => Promise.resolve(sdk));
    const loader = createAmazonVegaSdkLoader(importer);

    const firstLoad = loader.load();
    const secondLoad = loader.load();

    expect(importer).toHaveBeenCalledOnce();
    expect(secondLoad).toBe(firstLoad);
    await expect(firstLoad).resolves.toBe(sdk);
  });

  test("caches an Amazon SDK loading failure", async () => {
    const error = new Error("Amazon Vega IAP is unavailable");
    const importer = vi.fn(() => Promise.reject(error));
    const loader = createAmazonVegaSdkLoader(importer);

    const firstLoad = loader.load();
    const secondLoad = loader.load();

    expect(importer).toHaveBeenCalledOnce();
    expect(secondLoad).toBe(firstLoad);
    await expect(firstLoad).rejects.toBe(error);
  });
});
