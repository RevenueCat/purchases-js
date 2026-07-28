import type * as AmazonVegaSdkModule from "@amazon-devices/keplerscript-appstore-iap-lib";

/**
 * The Vega SDK should only be available when configured with an Amazon API Key.
 * This loader manages importing the SDK at runtime so web and other store
 * configurations never resolve it.
 * @internal
 */
export type AmazonVegaSdk = typeof AmazonVegaSdkModule;

type AmazonVegaSdkImporter = () => Promise<AmazonVegaSdk>;

const importAmazonVegaSdk: AmazonVegaSdkImporter = async () =>
  await import("@amazon-devices/keplerscript-appstore-iap-lib");

/** @internal */
export interface AmazonVegaSdkLoader {
  load(): Promise<AmazonVegaSdk>;
}

/** @internal */
export function createAmazonVegaSdkLoader(
  importer: AmazonVegaSdkImporter = importAmazonVegaSdk,
): AmazonVegaSdkLoader {
  let sdkPromise: Promise<AmazonVegaSdk> | undefined;

  return {
    load(): Promise<AmazonVegaSdk> {
      sdkPromise ??= importer();
      return sdkPromise;
    },
  };
}

const amazonVegaSdkLoader = createAmazonVegaSdkLoader();

/**
 * Starts loading the Vega SDK and returns the cached loading promise.
 * Future Amazon purchase handling can await this same promise.
 * @internal
 */
export function loadAmazonVegaSdk(): Promise<AmazonVegaSdk> {
  return amazonVegaSdkLoader.load();
}
