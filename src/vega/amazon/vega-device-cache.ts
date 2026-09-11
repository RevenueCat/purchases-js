import { KeplerFileSystem } from "@amazon-devices/kepler-file-system";
import { isPresentOnOS } from "@amazon-devices/kepler-compatibility";

type ReceiptCache = string[];

/**
 * Class capable of caching items on a Vega device.
 *
 * @internal
 */
export class VegaDeviceCache {
  // Apps operate in a sandboxed environment with a restricted view of the device file system.
  // Vega makes the following app-specific directories available in the sandbox.
  //
  // The /data directory is a writable location for app data. It is persistent across
  // device reboots and package upgrades, and is not shared between apps or services.
  // The directory isn't persistent on app uninstall.
  //
  // More info: https://developer.amazon.com/docs/vega-api/0.24/README.amazon-devices_kepler-file-system.html
  private readonly dataDirectory = "data";
  private readonly rcStoragePrefix = "com.revenuecat.purchases";
  private readonly cacheFileEncoding = "UTF-8";
  private readonly tokensCachePath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(private readonly apiKey: string) {
    // As of KeplerFileSystem SDK version 0.24, there is no way to create a directory, and any attempts
    // to write to one throw a com.amazon.kepler.file_system.NotFoundError error. Therefore, we write
    // our cache files to the /data directory.
    this.tokensCachePath = `/${this.dataDirectory}/${this.rcStoragePrefix}.${this.apiKey}.tokens`;
  }

  public async getPreviouslySentReceiptIds(): Promise<Set<string>> {
    await this.writeQueue;
    return new Set(await this.getReceiptIds());
  }

  public async addSuccessfullyPostedReceiptId(
    receiptId: string,
  ): Promise<void> {
    const operation = this.writeQueue.then(async () => {
      const receiptIds = await this.getReceiptIds();

      if (receiptIds.includes(receiptId)) {
        return;
      }

      const fileSystem = KeplerFileSystem;
      const updatedReceiptIds = [...receiptIds, receiptId];
      if (await this.doesCacheFileExist(fileSystem)) {
        await fileSystem.removeFile(this.tokensCachePath);
      }
      try {
        await fileSystem.writeStringToFile(
          this.tokensCachePath,
          JSON.stringify(updatedReceiptIds),
          this.cacheFileEncoding,
        );
      } catch {
        const currentReceiptIds = await this.getReceiptIds();
        if (currentReceiptIds.includes(receiptId)) {
          return;
        }

        await fileSystem.removeFile(this.tokensCachePath);
        await fileSystem.writeStringToFile(
          this.tokensCachePath,
          JSON.stringify([...currentReceiptIds, receiptId]),
          this.cacheFileEncoding,
        );
      }
    });

    this.writeQueue = operation.catch(() => undefined);
    await operation;
  }

  private async doesCacheFileExist(
    fileSystem: typeof KeplerFileSystem,
  ): Promise<boolean> {
    // `exists` arrived in Kepler File System 0.0.7. On older Vega OS versions,
    // use a read attempt to determine whether the cache file is present.
    if (isPresentOnOS("@amazon-devices/kepler-file-system", "0.0.7")) {
      return await fileSystem.exists(this.tokensCachePath);
    }

    try {
      // Throws if the file isn't found
      await fileSystem.readFileAsString(
        this.tokensCachePath,
        this.cacheFileEncoding,
      );
      return true;
    } catch {
      return false;
    }
  }

  private async getReceiptIds(): Promise<ReceiptCache> {
    const fileSystem = KeplerFileSystem;
    if (!(await this.doesCacheFileExist(fileSystem))) {
      return [];
    }

    try {
      const serializedReceiptIds = await fileSystem.readFileAsString(
        this.tokensCachePath,
        this.cacheFileEncoding,
      );
      const receiptIds: unknown = JSON.parse(serializedReceiptIds);

      return isReceiptCache(receiptIds) ? receiptIds : [];
    } catch {
      return [];
    }
  }
}

function isReceiptCache(value: unknown): value is ReceiptCache {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}
