import { describe, expect, test, vi } from "vitest";
import { VegaDeviceCache } from "../../amazon/vega-device-cache";
import type { KeplerFileSystem } from "../../amazon/kepler-file-system-loader";

const cachePath = "/data/com.revenuecat.purchases.amzn_api_key.tokens";

function createCache() {
  const files = new Map<string, string>();
  const fileSystem = {
    exists: vi.fn(async (path: string) => files.has(path)),
    readFileAsString: vi.fn(async (path: string) => {
      const content = files.get(path);
      if (content === undefined) {
        throw new Error("File not found");
      }
      return content;
    }),
    writeStringToFile: vi.fn(async (path: string, content: string) => {
      files.set(path, content);
      return content.length;
    }),
  };
  const cache = new VegaDeviceCache(
    "amzn_api_key",
    async () => fileSystem as unknown as KeplerFileSystem,
  );

  return { cache, fileSystem, files };
}

describe("VegaDeviceCache", () => {
  test("returns an empty set when no receipt cache exists", async () => {
    const { cache, fileSystem } = createCache();

    await expect(cache.getPreviouslySentReceiptIds()).resolves.toEqual(
      new Set(),
    );
    expect(fileSystem.exists).toHaveBeenCalledExactlyOnceWith(cachePath);
    expect(fileSystem.readFileAsString).not.toHaveBeenCalled();
  });

  test("stores raw receipt IDs", async () => {
    const { cache, fileSystem } = createCache();

    await cache.addSuccessfullyPostedReceiptId("receipt-id");

    expect(fileSystem.writeStringToFile).toHaveBeenCalledExactlyOnceWith(
      cachePath,
      JSON.stringify(["receipt-id"]),
      "UTF-8",
    );
    await expect(cache.getPreviouslySentReceiptIds()).resolves.toEqual(
      new Set(["receipt-id"]),
    );
  });

  test("does not write an already-cached receipt ID again", async () => {
    const { cache, fileSystem } = createCache();

    await cache.addSuccessfullyPostedReceiptId("receipt-id");
    await cache.addSuccessfullyPostedReceiptId("receipt-id");

    expect(fileSystem.writeStringToFile).toHaveBeenCalledOnce();
  });

  test("stores multiple receipt IDs", async () => {
    const { cache } = createCache();

    await cache.addSuccessfullyPostedReceiptId("receipt-id-1");
    await cache.addSuccessfullyPostedReceiptId("receipt-id-2");

    await expect(cache.getPreviouslySentReceiptIds()).resolves.toEqual(
      new Set(["receipt-id-1", "receipt-id-2"]),
    );
  });

  test("serializes concurrent writes", async () => {
    const { cache, files } = createCache();

    await Promise.all([
      cache.addSuccessfullyPostedReceiptId("receipt-id-1"),
      cache.addSuccessfullyPostedReceiptId("receipt-id-2"),
    ]);

    expect(JSON.parse(files.get(cachePath) ?? "")).toEqual([
      "receipt-id-1",
      "receipt-id-2",
    ]);
  });

  test("treats malformed cache contents as empty", async () => {
    const { cache, files } = createCache();
    files.set(cachePath, "not JSON");

    await expect(cache.getPreviouslySentReceiptIds()).resolves.toEqual(
      new Set(),
    );
  });
});
