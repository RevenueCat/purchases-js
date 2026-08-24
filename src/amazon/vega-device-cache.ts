import {
  loadKeplerFileSystem,
  type KeplerFileSystemLoader,
} from "./kepler-file-system-loader";

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
  private readonly tokensCachePath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(
    private readonly apiKey: string,
    private readonly fileSystemLoader: KeplerFileSystemLoader = loadKeplerFileSystem,
  ) {
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

      const fileSystem = await this.fileSystemLoader();
      const updatedReceiptIds = [...receiptIds, receiptId];
      if (await fileSystem.exists(this.tokensCachePath)) {
        await fileSystem.removeFile(this.tokensCachePath);
      }
      try {
        await fileSystem.writeStringToFile(
          this.tokensCachePath,
          JSON.stringify(updatedReceiptIds),
          "UTF-8",
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
          "UTF-8",
        );
      }
    });

    this.writeQueue = operation.catch(() => undefined);
    await operation;
  }

  private async getReceiptIds(): Promise<ReceiptCache> {
    const fileSystem = await this.fileSystemLoader();
    const cacheExists = await fileSystem.exists(this.tokensCachePath);
    if (!cacheExists) {
      return [];
    }

    try {
      const serializedReceiptIds = await fileSystem.readFileAsString(
        this.tokensCachePath,
        "UTF-8",
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
