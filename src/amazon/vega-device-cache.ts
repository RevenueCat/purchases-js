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
  private readonly rcStoragePrefix = "com.revenuecat.purchases.";
  private readonly tokensCacheKey = "tokens";
  private readonly tokensCachePath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(
    private readonly apiKey: string,
    private readonly fileSystemLoader: KeplerFileSystemLoader = loadKeplerFileSystem,
  ) {
    this.tokensCachePath = `/data/${this.rcStoragePrefix}${this.apiKey}.${this.tokensCacheKey}`;
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
    if (!(await fileSystem.exists(this.tokensCachePath))) {
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
