import { describe, expect, test, vi } from "vitest";
import { VegaDeviceCache } from "../../amazon/vega-device-cache";
const { nativeFileSystem, isPresentOnOS } = vi.hoisted(() => ({
  nativeFileSystem: {},
  isPresentOnOS: vi.fn(),
}));
vi.mock("@amazon-devices/kepler-file-system", () => ({
  KeplerFileSystem: nativeFileSystem,
}));
vi.mock("@amazon-devices/kepler-compatibility", () => ({ isPresentOnOS }));

const cachePath = "/data/com.revenuecat.purchases.amzn_api_key.tokens";

function createCache(supportsFileSystemExists = true) {
  const files = new Map<string, string>();
  const fileSystem = {
    exists: vi.fn(async (path: string) => files.has(path)),
    removeFile: vi.fn(async (path: string) => {
      files.delete(path);
    }),
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
  Object.assign(nativeFileSystem, fileSystem);
  isPresentOnOS.mockReset().mockReturnValue(supportsFileSystemExists);
  const cache = new VegaDeviceCache("amzn_api_key");

  return { cache, fileSystem, files };
}

describe("VegaDeviceCache", () => {
  test("returns an empty set when no receipt cache exists", async () => {
    const { cache, fileSystem } = createCache();

    await expect(cache.getPreviouslySentReceiptIds()).resolves.toEqual(
      new Set(),
    );
    expect(isPresentOnOS).toHaveBeenCalledExactlyOnceWith(
      "@amazon-devices/kepler-file-system",
      "0.0.7",
    );
    expect(fileSystem.exists).toHaveBeenCalledExactlyOnceWith(cachePath);
    expect(fileSystem.readFileAsString).not.toHaveBeenCalled();
  });

  test("reads the cache directly when the OS lacks exists", async () => {
    const { cache, fileSystem, files } = createCache(false);
    files.set(cachePath, JSON.stringify(["receipt-id"]));

    await expect(cache.getPreviouslySentReceiptIds()).resolves.toEqual(
      new Set(["receipt-id"]),
    );
    expect(fileSystem.exists).not.toHaveBeenCalled();
    expect(fileSystem.readFileAsString).toHaveBeenCalledTimes(2);
    expect(fileSystem.readFileAsString).toHaveBeenCalledWith(
      cachePath,
      "UTF-8",
    );
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
    const { cache, fileSystem } = createCache();

    await cache.addSuccessfullyPostedReceiptId("receipt-id-1");
    await cache.addSuccessfullyPostedReceiptId("receipt-id-2");

    expect(fileSystem.removeFile).toHaveBeenCalledExactlyOnceWith(cachePath);
    await expect(cache.getPreviouslySentReceiptIds()).resolves.toEqual(
      new Set(["receipt-id-1", "receipt-id-2"]),
    );
  });

  test("retries an existing-file error with the current cache contents", async () => {
    const { cache, fileSystem, files } = createCache();
    fileSystem.writeStringToFile
      .mockImplementationOnce(async () => {
        files.set(cachePath, JSON.stringify(["first-receipt-id"]));
        throw new Error("[com.amazon.kepler.file_system.AlreadyExistsError]");
      })
      .mockImplementationOnce(async (path: string, content: string) => {
        files.set(path, content);
        return content.length;
      });

    await cache.addSuccessfullyPostedReceiptId("second-receipt-id");

    expect(fileSystem.removeFile).toHaveBeenCalledExactlyOnceWith(cachePath);
    await expect(cache.getPreviouslySentReceiptIds()).resolves.toEqual(
      new Set(["first-receipt-id", "second-receipt-id"]),
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
